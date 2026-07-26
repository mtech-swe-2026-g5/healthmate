import { PatientAppLayout } from "@/features/navigation";

export default function PatientSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientAppLayout>{children}</PatientAppLayout>;
}
