import { PageLoading } from "@/components/ui/PageLoading";

export default function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <PageLoading label="Loading…" variant="form" />
    </div>
  );
}
