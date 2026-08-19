import type { PatientRosterStatusFilter } from "@/features/doctor/patients/types/schemas";

export type PatientRosterStatus = "active" | "inactive" | "new";

export type DoctorPatientListItem = {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  age: number;
  gender: string | null;
  status: PatientRosterStatus;
  lastVisitAt: string | null;
  lastVisitLabel: string | null;
  lastVisitReason: string | null;
  visitCount: number;
};

export type DoctorPatientsListResponse = {
  patients: DoctorPatientListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    from: number;
    to: number;
  };
  filters: {
    q: string;
    status: PatientRosterStatusFilter;
  };
};

export type PatientVisitStatus = "completed" | "upcoming" | "cancelled";

export type DoctorPatientVisit = {
  id: string;
  bookingReference: string;
  dateLabel: string;
  timeLabel: string;
  reasonForVisit: string;
  additionalNotes: string | null;
  status: PatientVisitStatus;
};

export type DoctorPatientDetail = {
  patient: {
    id: string;
    displayId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    initials: string;
    email: string;
    phoneNumber: string | null;
    gender: string | null;
    dateOfBirthLabel: string;
    age: number;
    bloodGroup: string | null;
    profilePictureUrl: string | null;
    status: PatientRosterStatus;
    visitCount: number;
  };
  doctorName: string;
  visits: DoctorPatientVisit[];
};
