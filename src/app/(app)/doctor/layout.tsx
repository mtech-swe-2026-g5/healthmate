import { DoctorAppLayout } from '@/features/navigation';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DoctorAppLayout>{children}</DoctorAppLayout>;
}
