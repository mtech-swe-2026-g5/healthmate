import { AdminAppLayout } from "@/features/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAppLayout>{children}</AdminAppLayout>;
}
