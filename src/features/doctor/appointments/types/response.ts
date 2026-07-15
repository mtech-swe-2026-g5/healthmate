import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from "@/features/auth";

export interface Metadata {
  links: {
    self: string;
    prevWeek: string;
    nextWeek: string;
  };
}

export interface AppointmentsResponse {
  _metadata: Metadata;
  appointments: Appointment[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: (typeof GENDER_OPTIONS)[number];
  phoneNumber: string;
  bloodGroup: (typeof BLOOD_GROUP_OPTIONS)[number];
}

export interface Appointment {
  id: string;
  patient: Patient;
  start: Date;
  end: Date;
}
