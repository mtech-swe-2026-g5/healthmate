import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { AppointmentDetailView } from '@/features/appointments/components/AppointmentDetailView';
import { getAppointmentForPatient } from '@/features/appointments/services/appointments';
import { AppError } from '@/lib/errors';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Booking details — HealthMate',
  description: 'Your appointment booking details.',
};

export default async function AppointmentDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  let appointment;
  try {
    appointment = await getAppointmentForPatient(
      session.user.id,
      session.user.role,
      id,
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    if (error instanceof Error && error.message === 'Forbidden') redirect('/dashboard');
    throw error;
  }

  return <AppointmentDetailView appointment={appointment} />;
}
