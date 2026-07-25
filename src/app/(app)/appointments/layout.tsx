import { PatientAppLayout } from '@/features/navigation';

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientAppLayout>{children}</PatientAppLayout>;
}
