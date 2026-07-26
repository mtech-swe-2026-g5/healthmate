"use client";

import {
  MdArrowBack,
  MdArrowForward,
  MdLocationOn,
  MdPerson,
} from "react-icons/md";

import { PaymentStep } from "@/features/payments/components/PaymentStep";

import { useBookingWizard } from "../hooks/use-booking-wizard";
import { useDoctors } from "../hooks/use-doctors";
import { useSlots } from "../hooks/use-slots";
import { formatClinicCalendarDate } from "../lib/date-utils";
import { AppointmentDetailsForm } from "./AppointmentDetailsForm";
import { ConfirmationView } from "./ConfirmationView";
import { DoctorCardGrid } from "./DoctorCardGrid";
import { SlotCalendar } from "./SlotCalendar";
import { SlotGrid } from "./SlotGrid";
import { StepIndicator } from "./StepIndicator";

type BookingWizardProps = {
  patientEmail?: string | null;
  patientName?: string | null;
  consultationFeeInr: number;
};

export function BookingWizard({
  patientEmail,
  patientName,
  consultationFeeInr,
}: BookingWizardProps) {
  const {
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
  } = useBookingWizard({ patientEmail, patientName });

  const {
    doctors,
    loading: doctorsLoading,
    error: doctorsError,
  } = useDoctors();
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useSlots(state.doctor?.id ?? null, state.date);

  const selectedDateLabel = state.date
    ? formatClinicCalendarDate(state.date)
    : null;

  return (
    <div>
      <StepIndicator current={state.step} />

      {state.step === "doctor" && (
        <section aria-labelledby="doctor-step-heading">
          <h2 id="doctor-step-heading" className="sr-only">
            Search for a doctor
          </h2>
          <DoctorCardGrid
            doctors={doctors}
            selectedId={state.doctor?.id ?? null}
            onSelect={selectDoctor}
            loading={doctorsLoading}
            error={doctorsError}
          />
        </section>
      )}

      {state.step === "slot" && state.doctor && (
        <section aria-labelledby="slot-step-heading">
          <h2 id="slot-step-heading" className="sr-only">
            Select date and time
          </h2>
          <div className="grid grid-cols-1 items-start gap-[var(--spacing-hm-xl)] lg:grid-cols-12">
            <aside className="flex flex-col gap-[var(--spacing-hm-lg)] lg:col-span-4">
              <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] shadow-sm">
                <div className="mb-[var(--spacing-hm-md)] flex items-center gap-[var(--spacing-hm-md)]">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container)]/15 font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
                    {`${state.doctor.firstName[0] ?? ""}${state.doctor.lastName[0] ?? ""}`.toUpperCase() || (
                      <MdPerson size={32} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                      Dr. {state.doctor.firstName} {state.doctor.lastName}
                    </h3>
                    <p className="font-dm-sans text-label-md text-[var(--color-primary)]">
                      {state.doctor.specialization}
                    </p>
                  </div>
                </div>
                <div className="mt-[var(--spacing-hm-md)] flex flex-col gap-2 border-t border-[var(--color-outline-variant)]/20 pt-[var(--spacing-hm-md)]">
                  <div className="flex items-center gap-[var(--spacing-hm-md)] text-[var(--color-on-surface-variant)]">
                    <MdLocationOn
                      className="text-[var(--color-primary)]"
                      size={20}
                      aria-hidden
                    />
                    <span className="font-dm-sans text-label-md">
                      HealthMate Clinic · In-person
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-sm lg:col-span-8">
              <div className="p-[var(--spacing-hm-lg)] md:p-[var(--spacing-hm-xl)]">
                <SlotCalendar
                  selectedDate={state.date}
                  onSelectDate={selectDate}
                />

                <div className="mb-[var(--spacing-hm-lg)] h-px w-full bg-[var(--color-outline-variant)]/20" />

                {state.date && (
                  <SlotGrid
                    slots={slots}
                    selectedStartTime={state.startTime}
                    onSelect={selectSlot}
                    loading={slotsLoading}
                    error={slotsError}
                    selectedDateLabel={selectedDateLabel}
                  />
                )}

                <div className="mt-[var(--spacing-hm-xl)] flex flex-wrap justify-end gap-[var(--spacing-hm-md)]">
                  <button
                    type="button"
                    onClick={goBackToDoctor}
                    className="inline-flex items-center gap-2 rounded-lg px-[var(--spacing-hm-xl)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
                  >
                    <MdArrowBack size={18} aria-hidden />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!state.date || !state.startTime}
                    onClick={goToDetails}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-[var(--spacing-hm-xxl)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    Continue
                    <MdArrowForward size={18} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {state.step === "details" &&
        state.doctor &&
        state.date &&
        state.startTime &&
        state.endTime && (
          <section aria-labelledby="details-step-heading">
            <h2 id="details-step-heading" className="sr-only">
              Appointment details
            </h2>
            <AppointmentDetailsForm
              doctor={state.doctor}
              date={state.date}
              startTime={state.startTime}
              endTime={state.endTime}
              reasonForVisit={state.reasonForVisit}
              additionalNotes={state.additionalNotes}
              reasonError={detailsError}
              submitError={submitError}
              submitting={submitting}
              submitLabel="Continue to payment"
              onReasonChange={setReason}
              onNotesChange={setNotes}
              onBack={goBackToSlot}
              onSubmit={() => {
                goToPayment();
              }}
            />
          </section>
        )}

      {state.step === "payment" &&
        state.doctor &&
        state.date &&
        state.startTime &&
        state.endTime && (
          <PaymentStep
            doctor={state.doctor}
            date={state.date}
            startTime={state.startTime}
            endTime={state.endTime}
            feeInr={consultationFeeInr}
            paying={submitting}
            error={submitError}
            onBack={goBackToDetails}
            onPay={() => {
              void payAndConfirm();
            }}
          />
        )}

      {state.step === "confirmed" && state.confirmation && (
        <ConfirmationView
          appointment={state.confirmation}
          patientEmail={patientEmail}
        />
      )}
    </div>
  );
}
