import { PatientAppLayout } from '@/features/navigation';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientAppLayout>{children}</PatientAppLayout>;
}
