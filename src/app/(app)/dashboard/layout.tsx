import { PatientAppLayout } from "@/features/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientAppLayout>{children}</PatientAppLayout>;
}
