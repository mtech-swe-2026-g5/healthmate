"use client";

import { useCallback, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLock,
} from "react-icons/md";

import { Toast } from "@/components/ui/Toast";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import AppointmentModel from "@/features/doctor/appointments/components/AppointmentModel";
import useAppointments from "@/features/doctor/appointments/hooks/use-appointments";
import useSlotConfigurations from "@/features/doctor/appointments/hooks/use-slot-configurations";
import { initialDoctorWeekRange } from "@/features/doctor/appointments/lib/dashboard-stats";
import { Patient } from "@/features/doctor/appointments/types/response";
import { DoctorWeekCalendar } from "@/features/doctor/calendar/components/DoctorWeekCalendar";
import {
  mapAppointmentsToCalendarEvents,
  mapBlocksToCalendarEvents,
  filterBlocksForRange,
  mapSlotConfigurations,
  mergeCalendarEvents,
} from "@/features/doctor/calendar/lib/map-calendar-data";
import type { DoctorCalendarEvent } from "@/features/doctor/calendar/types";
import { AvailabilitySettingsPanel } from "@/features/doctor/schedule/components/AvailabilitySettingsPanel";
import {
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
} from "@/features/doctor/schedule/hooks/use-doctor-schedule";
import type { UpdateScheduleSettingsInput } from "@/features/doctor/schedule/types/schemas";
import { getCalendarWeekRange, shiftCalendarWeek } from "@/lib/calendar-week";

const CARD =
  "rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

export type DoctorScheduleViewProps = {
  doctorId: string;
};

function formatWeekLabel(start: Date, end: Date): string {
  const s = DateTime.fromJSDate(start).setZone(CLINIC_TIMEZONE);
  const e = DateTime.fromJSDate(end).setZone(CLINIC_TIMEZONE);
  return `${s.toFormat("MMM d")} – ${e.toFormat("MMM d, yyyy")}`;
}

export function DoctorScheduleView({ doctorId }: DoctorScheduleViewProps) {
  const initialWeek = useMemo(() => initialDoctorWeekRange(), []);
  const [weekStart, setWeekStart] = useState(initialWeek.start);
  const [weekEnd, setWeekEnd] = useState(initialWeek.end);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [isModelOpen, setModelOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const scheduleQuery = useDoctorSchedule();
  const updateSchedule = useUpdateDoctorSchedule();
  const createBlock = useCreateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();

  const appointmentsQuery = useAppointments(doctorId, weekStart, weekEnd);
  const slotQuery = useSlotConfigurations(doctorId, weekStart, weekEnd);

  const onWeekChange = useCallback((start: Date, end: Date) => {
    setWeekStart(start);
    setWeekEnd(end);
  }, []);

  const shiftWeek = useCallback(
    (weeks: number) => {
      const next = shiftCalendarWeek(weekStart, weeks);
      setWeekStart(next.start);
      setWeekEnd(next.end);
    },
    [weekStart],
  );

  const goToToday = useCallback(() => {
    const current = getCalendarWeekRange(
      DateTime.now().setZone(CLINIC_TIMEZONE).toJSDate(),
    );
    setWeekStart(current.start);
    setWeekEnd(current.end);
  }, []);

  const events = useMemo(
    () =>
      mergeCalendarEvents(
        mapAppointmentsToCalendarEvents(appointmentsQuery.data),
        mapBlocksToCalendarEvents(
          filterBlocksForRange(
            scheduleQuery.data?.blocks ?? [],
            weekStart,
            weekEnd,
          ),
        ),
      ),
    [appointmentsQuery.data, scheduleQuery.data?.blocks, weekStart, weekEnd],
  );

  const onEventSelect = useCallback(
    (event: DoctorCalendarEvent) => {
      if (!event.id || event.id.startsWith("block-")) return;
      const appointment = appointmentsQuery.data?.find(
        (a) => a.id === event.id,
      );
      if (appointment) {
        setPatientDetails(appointment.patient);
        setModelOpen(true);
      }
    },
    [appointmentsQuery.data],
  );

  const handleSaveSettings = async (input: UpdateScheduleSettingsInput) => {
    try {
      await updateSchedule.mutateAsync(input);
      setToast({ message: "Schedule settings saved.", variant: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Could not save settings.",
        variant: "error",
      });
    }
  };

  const handleAddBlock = async (input: {
    dateFrom: string;
    dateTo: string;
    reason: string;
  }) => {
    const result = await createBlock.mutateAsync(input);
    const cancelled = (result as { cancelledAppointments?: number })
      .cancelledAppointments ?? 0;
    const suffix =
      cancelled > 0
        ? ` ${cancelled} appointment${cancelled > 1 ? "s" : ""} auto-cancelled and patients notified.`
        : "";
    setToast({
      message: `Closed dates added to your calendar.${suffix}`,
      variant: "success",
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock.mutateAsync(blockId);
      setToast({ message: "Closed dates removed.", variant: "success" });
    } catch {
      setToast({ message: "Could not remove closed dates.", variant: "error" });
    }
  };

  const isLoading =
    !appointmentsQuery.isFetched ||
    !slotQuery.isFetched ||
    scheduleQuery.isLoading;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto flex w-full flex-col px-4 md:px-8 lg:px-12 space-y-8 py-4 lg:space-y-10 lg:py-6">
        <h1 className="font-dm-sans text-headline-md text-[var(--color-primary)]">
          My Schedule
        </h1>
        <AvailabilitySettingsPanel
          schedule={scheduleQuery.data}
          isSaving={updateSchedule.isPending}
          deletingBlockId={deleteBlock.isPending ? (deleteBlock.variables as string) : null}
          onSave={handleSaveSettings}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
        />

        <section className="flex min-w-0 flex-col" aria-labelledby="week-calendar-heading">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2
                id="week-calendar-heading"
                className="font-dm-sans text-headline-md text-[var(--color-primary)]"
              >
                Weekly Calendar
              </h2>
              <div className="flex items-center rounded-xl bg-[var(--color-surface-container-high)] p-1">
                <span className="rounded-lg bg-[var(--color-surface-container-lowest)] px-4 py-2 font-dm-sans text-label-md font-bold text-[var(--color-primary)] shadow-sm">
                  Week
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="rounded-full p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)]"
                aria-label="Previous week"
              >
                <MdChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="font-dm-sans text-title-lg text-[var(--color-on-surface)] hover:text-[var(--color-primary)]"
              >
                {formatWeekLabel(weekStart, weekEnd)}
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                className="rounded-full p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)]"
                aria-label="Next week"
              >
                <MdChevronRight size={22} />
              </button>
            </div>
          </header>

          <div className="mb-3 flex flex-wrap gap-4">
            <LegendDot
              color="bg-[var(--color-primary-container)]"
              label="Appointment"
            />
            <LegendDot
              color="striped-bg border border-[var(--color-outline-variant)]/30"
              label="Blocked / Break"
              icon={<MdLock size={12} className="opacity-60" />}
            />
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <DoctorWeekCalendar
              className="doctor-schedule-calendar h-[480px] md:h-[720px] w-full"
              weekStart={weekStart}
              events={events}
              slotConfigurations={mapSlotConfigurations(slotQuery.data)}
              isLoading={isLoading}
              onEventSelect={onEventSelect}
              onWeekChange={onWeekChange}
              showNavigation={false}
            />
          </div>
        </section>
      </div>

      <AppointmentModel
        patient={patientDetails}
        isModelOpen={isModelOpen}
        onClose={() => {
          setModelOpen(false);
          setPatientDetails(null);
        }}
      />
    </>
  );
}

function LegendDot({
  color,
  label,
  icon,
}: {
  color: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
      <span
        className={`inline-flex h-3 w-3 items-center justify-center rounded-sm ${color}`}
      >
        {icon}
      </span>
      {label}
    </span>
  );
}
