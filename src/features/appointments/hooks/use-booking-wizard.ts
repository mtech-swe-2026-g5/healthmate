"use client";

import { useCallback, useState } from "react";

import type { BookingStepId } from "../constants";
import type { DoctorListItem } from "../types/doctor";
import type { AppointmentConfirmation } from "../services/client";
import { appointmentDetailsSchema } from "../types";
import {
  createPaymentOrderRequest,
  verifyPaymentRequest,
} from "@/features/payments/services/client";
import { openRazorpayCheckout } from "@/features/payments/lib/checkout";

export type BookingWizardState = {
  step: BookingStepId;
  doctor: DoctorListItem | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  reasonForVisit: string;
  additionalNotes: string;
  confirmation: AppointmentConfirmation | null;
};

const INITIAL: BookingWizardState = {
  step: "doctor",
  doctor: null,
  date: null,
  startTime: null,
  endTime: null,
  reasonForVisit: "",
  additionalNotes: "",
  confirmation: null,
};

export function useBookingWizard(options?: {
  patientEmail?: string | null;
  patientName?: string | null;
}) {
  const [state, setState] = useState<BookingWizardState>(INITIAL);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectDoctor = useCallback((doctor: DoctorListItem) => {
    setState((prev) => ({
      ...prev,
      doctor,
      date: null,
      startTime: null,
      endTime: null,
      step: "slot",
    }));
  }, []);

  const selectDate = useCallback((date: string) => {
    setState((prev) => ({
      ...prev,
      date,
      startTime: null,
      endTime: null,
    }));
  }, []);

  const selectSlot = useCallback((startTime: string, endTime: string) => {
    setState((prev) => ({
      ...prev,
      startTime,
      endTime,
    }));
  }, []);

  const goToDetails = useCallback(() => {
    setState((prev) => {
      if (!prev.doctor || !prev.date || !prev.startTime) return prev;
      return { ...prev, step: "details" };
    });
    setDetailsError(null);
    setSubmitError(null);
  }, []);

  const goBackToSlot = useCallback(() => {
    setState((prev) => ({ ...prev, step: "slot" }));
    setDetailsError(null);
    setSubmitError(null);
  }, []);

  const goBackToDoctor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: "doctor",
    }));
  }, []);

  const goBackToDetails = useCallback(() => {
    setState((prev) => ({ ...prev, step: "details" }));
    setSubmitError(null);
  }, []);

  const setReason = useCallback((reasonForVisit: string) => {
    setState((prev) => ({ ...prev, reasonForVisit }));
  }, []);

  const setNotes = useCallback((additionalNotes: string) => {
    setState((prev) => ({ ...prev, additionalNotes }));
  }, []);

  /** Validate details and advance to payment (does not create appointment). */
  const goToPayment = useCallback(() => {
    setDetailsError(null);
    setSubmitError(null);

    let advanced = false;

    setState((prev) => {
      const parsed = appointmentDetailsSchema.safeParse({
        reasonForVisit: prev.reasonForVisit,
        additionalNotes: prev.additionalNotes,
      });

      if (!parsed.success) {
        const reasonIssue = parsed.error.issues.find(
          (i) => i.path[0] === "reasonForVisit",
        );
        setDetailsError(
          reasonIssue?.message ??
            parsed.error.issues[0]?.message ??
            "Invalid details",
        );
        return prev;
      }

      if (!prev.doctor || !prev.date || !prev.startTime) {
        setSubmitError("Missing booking selection");
        return prev;
      }

      advanced = true;
      return {
        ...prev,
        reasonForVisit: parsed.data.reasonForVisit,
        additionalNotes: parsed.data.additionalNotes ?? "",
        step: "payment",
      };
    });

    return advanced;
  }, []);

  /** Create Razorpay order, open Checkout, verify, then confirm appointment. */
  const payAndConfirm = useCallback(async () => {
    setSubmitError(null);

    if (!state.doctor || !state.date || !state.startTime) {
      setSubmitError("Missing booking selection");
      return null;
    }

    setSubmitting(true);
    try {
      const order = await createPaymentOrderRequest({
        doctorId: state.doctor.id,
        date: state.date,
        startTime: state.startTime,
        reasonForVisit: state.reasonForVisit,
        additionalNotes: state.additionalNotes || undefined,
      });

      await new Promise<void>((resolve, reject) => {
        void openRazorpayCheckout({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "HealthMate",
          description: "Consultation fee",
          order_id: order.orderId,
          prefill: {
            email: options?.patientEmail ?? undefined,
            name: options?.patientName ?? undefined,
          },
          theme: { color: "#005258" },
          handler: (response) => {
            void (async () => {
              try {
                const result = await verifyPaymentRequest({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                setState((prev) => ({
                  ...prev,
                  confirmation: result.appointment,
                  step: "confirmed",
                }));
                resolve();
              } catch (err) {
                reject(
                  err instanceof Error
                    ? err
                    : new Error("Payment verification failed"),
                );
              }
            })();
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        }).catch(reject);
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message !== "Payment cancelled") {
        setSubmitError(message);
      } else {
        setSubmitError("Payment was cancelled. You can try again when ready.");
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [state, options?.patientEmail, options?.patientName]);

  return {
    state,
    detailsError,
    submitError,
    submitting,
    selectDoctor,
    selectDate,
    selectSlot,
    goToDetails,
    goBackToSlot,
    goBackToDoctor,
    goBackToDetails,
    setReason,
    setNotes,
    goToPayment,
    payAndConfirm,
  };
}
