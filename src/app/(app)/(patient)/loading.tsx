import { PageLoading } from "@/components/ui/PageLoading";

/**
 * Shown while navigating between patient portal pages. Nested under the
 * shared patient layout so the shell stays mounted and this fallback replaces
 * only the page segment.
 */
export default function PatientSegmentLoading() {
  return <PageLoading label="Loading…" variant="cards" />;
}
