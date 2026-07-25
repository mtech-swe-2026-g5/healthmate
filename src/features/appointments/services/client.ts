import type { DoctorListItem } from '../types/doctor';
import type { TimeSlot } from '../lib/date-utils';

export type AppointmentConfirmation = {
  id: string;
  bookingReference: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reasonForVisit: string;
  additionalNotes: string | null;
  doctor: DoctorListItem;
  timing: 'upcoming' | 'past';
};

export type AppointmentsListResponse = {
  upcoming: AppointmentConfirmation[];
  past: AppointmentConfirmation[];
};

async function readJson<T>(response: Response): Promise<T> {
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'error' in json && json.error
        ? String(json.error)
        : 'Request failed';
    throw new Error(message);
  }
  return json;
}

export async function fetchDoctors(): Promise<DoctorListItem[]> {
  const response = await fetch('/api/doctors');
  const data = await readJson<{ doctors: DoctorListItem[] }>(response);
  return data.doctors;
}

export async function fetchSlots(
  doctorId: string,
  date: string,
): Promise<TimeSlot[]> {
  const response = await fetch(
    `/api/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`,
  );
  const data = await readJson<{ slots: TimeSlot[] }>(response);
  return data.slots;
}

export async function createAppointmentRequest(body: {
  doctorId: string;
  date: string;
  startTime: string;
  reasonForVisit: string;
  additionalNotes?: string;
}): Promise<AppointmentConfirmation> {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await readJson<{ appointment: AppointmentConfirmation }>(
    response,
  );
  return data.appointment;
}

export async function fetchAppointment(
  id: string,
): Promise<AppointmentConfirmation> {
  const response = await fetch(`/api/appointments/${id}`);
  const data = await readJson<{ appointment: AppointmentConfirmation }>(
    response,
  );
  return data.appointment;
}

export async function fetchAppointments(): Promise<AppointmentsListResponse> {
  const response = await fetch('/api/appointments');
  return readJson<AppointmentsListResponse>(response);
}
