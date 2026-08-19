import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";

import { requireRole } from "@/features/auth/services/permissions";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import {
  derivePatientRosterStatus,
  formatPatientDisplayId,
  patientInitials,
} from "@/features/doctor/patients/lib/patient-status";
import type { ListDoctorPatientsQuery } from "@/features/doctor/patients/types/schemas";
import type {
  DoctorPatientDetail,
  DoctorPatientListItem,
  DoctorPatientsListResponse,
  DoctorPatientVisit,
  PatientRosterStatus,
  PatientVisitStatus,
} from "@/features/doctor/patients/types/response";
import { getDoctorIdForUser } from "@/features/doctor/schedule/services/schedule";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type RawPatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string | null;
  phone_number: string | null;
  visit_count: number;
  last_visit_at: Date | null;
  has_upcoming: boolean;
  last_visit_reason: string | null;
  patient_status: PatientRosterStatus;
};

function assertDoctorAccess(role: string | undefined): void {
  if (!role) throw new AppError("Unauthorized", 401);
  requireRole(role, ["doctor"]);
}

function buildSearchSql(search: string): Prisma.Sql {
  const trimmed = search.trim();
  if (!trimmed) {
    return Prisma.sql`TRUE`;
  }

  const pattern = `%${trimmed}%`;
  return Prisma.sql`(
    p.first_name ILIKE ${pattern}
    OR p.last_name ILIKE ${pattern}
    OR (p.first_name || ' ' || p.last_name) ILIKE ${pattern}
    OR COALESCE(p.phone_number, '') ILIKE ${pattern}
    OR p.id::text ILIKE ${pattern}
  )`;
}

function buildStatusSql(status: ListDoctorPatientsQuery["status"]): Prisma.Sql {
  if (status === "all") {
    return Prisma.sql`TRUE`;
  }
  return Prisma.sql`patient_status = ${status}`;
}

function rankedPatientsCte(doctorId: string, search: string): Prisma.Sql {
  return Prisma.sql`
    WITH stats AS (
      SELECT
        a.patient_id,
        COUNT(*) FILTER (WHERE a.status <> 'CANCELLED')::int AS visit_count,
        MAX(a.starts_at) FILTER (WHERE a.status <> 'CANCELLED') AS last_visit_at,
        BOOL_OR(a.status = 'CONFIRMED' AND a.starts_at > NOW()) AS has_upcoming
      FROM appointments a
      WHERE a.doctor_id = ${doctorId}::uuid
      GROUP BY a.patient_id
    ),
    ranked AS (
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone_number,
        s.visit_count,
        s.last_visit_at,
        s.has_upcoming,
        la.reason_for_visit AS last_visit_reason,
        CASE
          WHEN s.visit_count = 1 THEN 'new'
          WHEN s.has_upcoming OR s.last_visit_at >= NOW() - INTERVAL '365 days' THEN 'active'
          ELSE 'inactive'
        END AS patient_status
      FROM stats s
      INNER JOIN patients p ON p.id = s.patient_id
      LEFT JOIN LATERAL (
        SELECT a2.reason_for_visit
        FROM appointments a2
        WHERE a2.patient_id = s.patient_id
          AND a2.doctor_id = ${doctorId}::uuid
          AND a2.status <> 'CANCELLED'
        ORDER BY a2.starts_at DESC
        LIMIT 1
      ) la ON TRUE
      WHERE ${buildSearchSql(search)}
    )
  `;
}

function computeAge(dateOfBirth: Date, reference: Date = new Date()): number {
  const dob = DateTime.fromJSDate(dateOfBirth).setZone(CLINIC_TIMEZONE);
  const ref = DateTime.fromJSDate(reference).setZone(CLINIC_TIMEZONE);
  return Math.max(0, Math.trunc(ref.diff(dob, "years").years));
}

function formatLastVisitLabel(lastVisitAt: Date | null): string | null {
  if (!lastVisitAt) return null;
  return DateTime.fromJSDate(lastVisitAt)
    .setZone(CLINIC_TIMEZONE)
    .toFormat("MMM d, yyyy");
}

function mapRow(row: RawPatientRow): DoctorPatientListItem {
  const firstName = row.first_name;
  const lastName = row.last_name;

  return {
    id: row.id,
    displayId: formatPatientDisplayId(row.id),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    initials: patientInitials(firstName, lastName),
    age: computeAge(row.date_of_birth),
    gender: row.gender,
    status: row.patient_status,
    lastVisitAt: row.last_visit_at?.toISOString() ?? null,
    lastVisitLabel: formatLastVisitLabel(row.last_visit_at),
    lastVisitReason: row.last_visit_reason,
    visitCount: row.visit_count,
  };
}

export async function listDoctorPatients(
  userId: string,
  role: string | undefined,
  query: ListDoctorPatientsQuery,
): Promise<DoctorPatientsListResponse> {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);

  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;
  const search = query.q.trim();
  const status = query.status;

  const cte = rankedPatientsCte(doctorId, search);

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<RawPatientRow[]>(Prisma.sql`
      ${cte}
      SELECT *
      FROM ranked
      WHERE ${buildStatusSql(status)}
      ORDER BY last_visit_at DESC NULLS LAST
      LIMIT ${pageSize}
      OFFSET ${skip}
    `),
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      ${cte}
      SELECT COUNT(*)::bigint AS count
      FROM ranked
      WHERE ${buildStatusSql(status)}
    `),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : skip + 1;
  const to = total === 0 ? 0 : Math.min(skip + rows.length, total);

  return {
    patients: rows.map(mapRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      from,
      to,
    },
    filters: {
      q: search,
      status,
    },
  };
}

function visitStatus(
  status: "CONFIRMED" | "CANCELLED",
  startsAt: Date,
  now: Date,
): PatientVisitStatus {
  if (status === "CANCELLED") return "cancelled";
  return startsAt > now ? "upcoming" : "completed";
}

function mapVisit(
  appointment: {
    id: string;
    bookingReference: string;
    startsAt: Date;
    reasonForVisit: string;
    additionalNotes: string | null;
    status: "CONFIRMED" | "CANCELLED";
  },
  now: Date,
): DoctorPatientVisit {
  const start = DateTime.fromJSDate(appointment.startsAt).setZone(
    CLINIC_TIMEZONE,
  );
  return {
    id: appointment.id,
    bookingReference: appointment.bookingReference,
    dateLabel: start.toFormat("MMM d, yyyy"),
    timeLabel: start.toFormat("h:mm a · 'IST'"),
    reasonForVisit: appointment.reasonForVisit,
    additionalNotes: appointment.additionalNotes,
    status: visitStatus(appointment.status, appointment.startsAt, now),
  };
}

export async function getDoctorPatientDetail(
  userId: string,
  role: string | undefined,
  patientId: string,
): Promise<DoctorPatientDetail> {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);
  const now = new Date();

  const [doctor, patient, appointments] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { firstName: true, lastName: true },
    }),
    prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phoneNumber: true,
        bloodGroup: true,
        profilePictureUrl: true,
        user: { select: { email: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { doctorId, patientId },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        bookingReference: true,
        startsAt: true,
        reasonForVisit: true,
        additionalNotes: true,
        status: true,
      },
    }),
  ]);

  if (!doctor || !patient || appointments.length === 0) {
    throw new AppError("Patient not found", 404);
  }

  const nonCancelled = appointments.filter((a) => a.status !== "CANCELLED");
  const visitCount = nonCancelled.length;
  const lastVisitAt =
    nonCancelled.length > 0 ? nonCancelled[0]!.startsAt : null;
  const hasUpcoming = appointments.some(
    (a) => a.status === "CONFIRMED" && a.startsAt > now,
  );

  const firstName = patient.firstName;
  const lastName = patient.lastName;
  const dob = DateTime.fromJSDate(patient.dateOfBirth).setZone(CLINIC_TIMEZONE);

  return {
    patient: {
      id: patient.id,
      displayId: formatPatientDisplayId(patient.id),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      initials: patientInitials(firstName, lastName),
      email: patient.user.email,
      phoneNumber: patient.phoneNumber,
      gender: patient.gender,
      dateOfBirthLabel: dob.toFormat("dd LLL yyyy"),
      age: computeAge(patient.dateOfBirth),
      bloodGroup: patient.bloodGroup,
      profilePictureUrl: patient.profilePictureUrl,
      status: derivePatientRosterStatus({
        visitCount:
          visitCount > 0 ? visitCount : Math.min(appointments.length, 1),
        hasUpcoming,
        lastVisitAt,
        now,
      }),
      visitCount,
    },
    doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
    visits: appointments.map((appointment) => mapVisit(appointment, now)),
  };
}
