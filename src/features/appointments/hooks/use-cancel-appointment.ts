"use client";

import { useCallback, useState } from "react";

import { cancelAppointmentRequest } from "../services/client";
import type { AppointmentConfirmation } from "../services/client";

/**
 * Drives the cancel action for a single appointment.
 * Returns the cancelled appointment on success and `null` on failure, keeping
 * the message in `error` so the caller can surface it without a throw.
 */
export function useCancelAppointment(appointmentId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel =
    useCallback(async (): Promise<AppointmentConfirmation | null> => {
      setSubmitting(true);
      setError(null);
      try {
        return await cancelAppointmentRequest(appointmentId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to cancel appointment",
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    }, [appointmentId]);

  const clearError = useCallback(() => setError(null), []);

  return { cancel, submitting, error, clearError };
}
