import { requireRole } from "@/features/auth/services/permissions";
import { AppError } from "@/lib/errors";

export function assertAdminAccess(role: string | undefined): void {
  if (!role) throw new AppError("Unauthorized", 401);
  try {
    requireRole(role, ["admin"]);
  } catch {
    throw new AppError("Forbidden", 403);
  }
}
