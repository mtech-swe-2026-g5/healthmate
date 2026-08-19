import { prisma } from "@/lib/prisma";

import type { AppointmentNotificationContext } from "../types";

/**
 * Loads the patient and doctor identities an appointment email needs.
 * Runs off the request path, so it re-reads the appointment rather than
 * widening the booking response payload.
 *
 * @param appointmentId - Appointment the notification is about
 * @returns Template context, or null when the appointment or an email is missing
 */
export async function getAppointmentNotificationContext(
  appointmentId: string,
): Promise<AppointmentNotificationContext | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      bookingReference: true,
      startsAt: true,
      endsAt: true,
      reasonForVisit: true,
      additionalNotes: true,
      patient: {
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          user: { select: { email: true } },
        },
      },
      doctor: {
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          specialization: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!appointment) return null;

  const patientEmail = appointment.patient.user.email;
  const doctorEmail = appointment.doctor.user.email;
  if (!patientEmail || !doctorEmail) return null;

  return {
    appointment: {
      id: appointment.id,
      bookingReference: appointment.bookingReference,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      reasonForVisit: appointment.reasonForVisit,
      additionalNotes: appointment.additionalNotes,
    },
    patient: {
      userId: appointment.patient.userId,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      email: patientEmail,
    },
    doctor: {
      userId: appointment.doctor.userId,
      firstName: appointment.doctor.firstName,
      lastName: appointment.doctor.lastName,
      specialization: appointment.doctor.specialization,
      email: doctorEmail,
    },
  };
}
