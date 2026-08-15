"use client";

import { useCallback, useState } from "react";

import { rescheduleAppointmentRequest } from "../services/client";
import type { AppointmentConfirmation } from "../services/client";

/**
 * Holds the new-slot selection for a reschedule and submits it.
 * Picking a date clears any slot chosen under the previous date, so a stale
 * `startTime` can never be submitted against a different day.
 */
export function useRescheduleAppointment(appointmentId: string) {
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectDate = useCallback((next: string) => {
    setDate(next);
    setStartTime(null);
    setError(null);
  }, []);

  const selectSlot = useCallback((next: string) => {
    setStartTime(next);
    setError(null);
  }, []);

  const submit =
    useCallback(async (): Promise<AppointmentConfirmation | null> => {
      if (!date || !startTime) {
        setError("Select a new date and time slot first");
        return null;
      }

      setSubmitting(true);
      setError(null);
      try {
        return await rescheduleAppointmentRequest(appointmentId, {
          date,
          startTime,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to reschedule appointment",
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    }, [appointmentId, date, startTime]);

  return { date, startTime, submitting, error, selectDate, selectSlot, submit };
}
