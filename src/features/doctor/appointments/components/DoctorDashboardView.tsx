"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  MdCalendarMonth,
  MdCancel,
  MdEventAvailable,
  MdEventNote,
  MdSchedule,
  MdTimer,
} from "react-icons/md";

import { DoctorWeekCalendar } from "@/features/doctor/calendar/components/DoctorWeekCalendar";
import {
  filterBlocksForRange,
  mapAppointmentsToCalendarEvents,
  mapBlocksToCalendarEvents,
  mapSlotConfigurations,
  mergeCalendarEvents,
} from "@/features/doctor/calendar/lib/map-calendar-data";
import type { DoctorCalendarEvent } from "@/features/doctor/calendar/types";
import { useDoctorSchedule } from "@/features/doctor/schedule/hooks/use-doctor-schedule";
import AppointmentModel from "@/features/doctor/appointments/components/AppointmentModel";
import useAppointments from "@/features/doctor/appointments/hooks/use-appointments";
import useSlotConfigurations from "@/features/doctor/appointments/hooks/use-slot-configurations";
import {
  buildTodaySchedule,
  buildUpcomingWeekList,
  CARD,
  computeDoctorDashboardStats,
  formatClinicTime,
  formatClinicTimeRange,
  formatHeaderDate,
  initialDoctorWeekRange,
} from "@/features/doctor/appointments/lib/dashboard-stats";
import type { TodayScheduleItem } from "@/features/doctor/appointments/lib/dashboard-stats";
import { Patient } from "@/features/doctor/appointments/types/response";

export type DoctorDashboardViewProps = {
  doctorId: string;
  doctorName: string;
  specialization: string;
};

export function DoctorDashboardView({
  doctorId,
  doctorName,
  specialization,
}: DoctorDashboardViewProps) {
  const currentWeek = useMemo(() => initialDoctorWeekRange(), []);
  const [calendarStart, setCalendarStart] = useState(currentWeek.start);
  const [calendarEnd, setCalendarEnd] = useState(currentWeek.end);
  const [isModelOpen, setModelOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);

  const overviewQuery = useAppointments(
    doctorId,
    currentWeek.start,
    currentWeek.end,
  );
  const calendarQuery = useAppointments(doctorId, calendarStart, calendarEnd);
  const slotQuery = useSlotConfigurations(doctorId, calendarStart, calendarEnd);
  const scheduleQuery = useDoctorSchedule();

  const calendarEvents = useMemo(
    () =>
      mergeCalendarEvents(
        mapAppointmentsToCalendarEvents(calendarQuery.data),
        mapBlocksToCalendarEvents(
          filterBlocksForRange(
            scheduleQuery.data?.blocks ?? [],
            calendarStart,
            calendarEnd,
          ),
        ),
      ),
    [calendarQuery.data, scheduleQuery.data?.blocks, calendarStart, calendarEnd],
  );

  const stats = useMemo(
    () => computeDoctorDashboardStats(overviewQuery.data),
    [overviewQuery.data],
  );
  const todaySchedule = useMemo(
    () => buildTodaySchedule(overviewQuery.data),
    [overviewQuery.data],
  );
  const upcomingWeek = useMemo(
    () => buildUpcomingWeekList(overviewQuery.data),
    [overviewQuery.data],
  );

  const onWeekChange = useCallback((nextStart: Date, nextEnd: Date) => {
    setCalendarStart(nextStart);
    setCalendarEnd(nextEnd);
  }, []);

  const openAppointment = useCallback(
    (appointmentId: string) => {
      const appointment =
        overviewQuery.data?.find((a) => a.id === appointmentId) ??
        calendarQuery.data?.find((a) => a.id === appointmentId);
      if (appointment) {
        setPatientDetails(appointment.patient);
        setModelOpen(true);
      }
    },
    [overviewQuery.data, calendarQuery.data],
  );

  const onAppointmentClick = useCallback(
    (event: DoctorCalendarEvent) => {
      if (event.id) openAppointment(event.id);
    },
    [openAppointment],
  );

  const onClose = useCallback(() => {
    setModelOpen(false);
    setPatientDetails(null);
  }, []);

  const isLoading =
    !overviewQuery.isFetched ||
    !slotQuery.isFetched ||
    !scheduleQuery.isFetched;
  const headerDate = formatHeaderDate();

  return (
    <div className="mx-auto w-full px-4 md:px-8 lg:px-12 space-y-8 py-4 lg:space-y-10 lg:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-dm-sans text-headline-md text-[var(--color-primary)]">
            Overview
          </h1>
          <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Welcome back, {doctorName.split(" ").slice(-1)[0] ?? doctorName}
            {specialization ? ` · ${specialization}` : ""}
          </p>
        </div>
        <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
          {headerDate}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <StatCard
          icon={MdCalendarMonth}
          label="Today's Appointments"
          value={stats.todayCount}
          badge="+ active"
          iconClass="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        />
        <StatCard
          icon={MdEventNote}
          label="This Week Total"
          value={stats.weekTotal}
          badge="Weekly"
          iconClass="bg-[var(--color-secondary-container)]/50 text-[var(--color-secondary)]"
        />
        <StatCard
          icon={MdSchedule}
          label="Upcoming Today"
          value={stats.upcomingToday}
          badge="Remaining"
          iconClass="bg-[var(--color-tertiary-fixed)]/30 text-[var(--color-tertiary)]"
        />
        <StatCard
          icon={MdCancel}
          label="Completed This Week"
          value={stats.completedThisWeek}
          iconClass="bg-[var(--color-error)]/10 text-[var(--color-error)]"
          valueClass="text-[var(--color-error)]/80"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <section
          className={`${CARD} lg:col-span-7 flex flex-col overflow-hidden`}
          aria-labelledby="today-schedule-heading"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] p-[var(--spacing-hm-lg)]">
            <h2
              id="today-schedule-heading"
              className="font-dm-sans text-title-lg text-[var(--color-primary)]"
            >
              Today&apos;s Schedule
            </h2>
            <Link
              href="/doctor/schedule"
              className="font-dm-sans text-label-md text-[var(--color-primary)] hover:underline"
            >
              Full Calendar
            </Link>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-[var(--spacing-hm-lg)]">
            {isLoading ? (
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                Loading today&apos;s appointments…
              </p>
            ) : todaySchedule.length === 0 ? (
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                No appointments scheduled for today.
              </p>
            ) : (
              <TodayScheduleTimeline
                items={todaySchedule}
                onSelect={openAppointment}
              />
            )}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-5 lg:space-y-6">
          <section
            className={`${CARD} flex flex-col`}
            aria-labelledby="upcoming-week-heading"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)]/30 p-[var(--spacing-hm-lg)]">
              <h2
                id="upcoming-week-heading"
                className="font-dm-sans text-title-lg text-[var(--color-on-surface)]"
              >
                Upcoming This Week
              </h2>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-container)] font-dm-sans text-xs font-bold text-[var(--color-on-primary-container)]">
                {upcomingWeek.length}
              </span>
            </div>
            <div className="space-y-[var(--spacing-hm-md)] p-[var(--spacing-hm-md)]">
              {isLoading ? (
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Loading…
                </p>
              ) : upcomingWeek.length === 0 ? (
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  No upcoming appointments this week.
                </p>
              ) : (
                upcomingWeek.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openAppointment(item.id)}
                    className="w-full rounded-lg border border-transparent bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)] text-left transition-colors hover:border-[var(--color-primary)]/20"
                  >
                    <p className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                      {item.when}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section
            className={`${CARD} flex flex-col overflow-hidden`}
            aria-labelledby="quick-actions-heading"
          >
            <div className="border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] p-[var(--spacing-hm-lg)]">
              <h2
                id="quick-actions-heading"
                className="font-dm-sans text-title-lg text-[var(--color-on-surface)]"
              >
                Quick Actions
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-outline-variant)]/20">
              <QuickAction
                icon={MdEventAvailable}
                title="View full schedule"
                subtitle="Week and day calendar views"
                href="/doctor/schedule"
              />
              <QuickAction
                icon={MdCalendarMonth}
                title="Patient list"
                subtitle="Browse your patients"
                href="/doctor/patients"
              />
            </div>
          </section>
        </aside>
      </div>

      <section
        className={`${CARD} overflow-hidden`}
        aria-labelledby="weekly-schedule-heading"
      >
        <div className="border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] p-[var(--spacing-hm-lg)]">
          <h2
            id="weekly-schedule-heading"
            className="font-dm-sans text-title-lg text-[var(--color-primary)]"
          >
            Weekly Schedule
          </h2>
        </div>
        <div className="p-[var(--spacing-hm-md)] md:p-[var(--spacing-hm-lg)]">
          <DoctorWeekCalendar
            weekStart={calendarStart}
            events={calendarEvents}
            slotConfigurations={mapSlotConfigurations(slotQuery.data)}
            isLoading={!calendarQuery.isFetched || !slotQuery.isFetched || !scheduleQuery.isFetched}
            onEventSelect={onAppointmentClick}
            onWeekChange={onWeekChange}
            showNavigation
          />
        </div>
      </section>

      <AppointmentModel
        patient={patientDetails}
        isModelOpen={isModelOpen}
        onClose={onClose}
      />
    </div>
  );
}

function TodayScheduleTimeline({
  items,
  onSelect,
}: {
  items: TodayScheduleItem[];
  onSelect: (appointmentId: string) => void;
}) {
  return (
    <ol className="m-0 list-none space-y-0 p-0">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const dotClass = item.isCurrent
          ? "bg-[var(--color-primary)]"
          : item.isPast
            ? "bg-[var(--color-outline-variant)]"
            : "bg-[var(--color-primary-container)]";

        return (
          <li
            key={item.id}
            className={`grid grid-cols-[4.75rem_1.25rem_minmax(0,1fr)] items-stretch gap-x-3 ${
              item.isPast && !item.isCurrent ? "opacity-70" : ""
            }`}
          >
            <time
              dateTime={item.start.toISOString()}
              className="pt-3 text-right font-dm-sans text-label-md text-[var(--color-on-surface-variant)]"
            >
              {formatClinicTime(item.start)}
            </time>

            <div className="relative flex justify-center">
              {!isFirst ? (
                <span
                  className="absolute top-0 bottom-1/2 w-px bg-[var(--color-outline-variant)]/50"
                  aria-hidden
                />
              ) : null}
              {!isLast ? (
                <span
                  className="absolute top-1/2 bottom-0 w-px bg-[var(--color-outline-variant)]/50"
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-10 mt-3 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-[var(--color-surface-container-lowest)] ${dotClass}`}
                aria-hidden
              />
            </div>

            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`mb-4 min-w-0 rounded-xl p-[var(--spacing-hm-md)] text-left transition-colors hover:border-[var(--color-primary)]/20 ${
                item.isCurrent
                  ? "border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/15"
                  : "border border-transparent bg-[var(--color-surface-container-low)]"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                  {item.patientName}
                </h3>
                {item.isCurrent ? (
                  <span className="shrink-0 rounded bg-[var(--color-error)] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                    Now
                  </span>
                ) : null}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-literata text-sm text-[var(--color-on-surface-variant)]">
                <span className="inline-flex items-center gap-1">
                  <MdTimer size={16} aria-hidden />
                  {item.durationMinutes} mins
                </span>
                <span>{formatClinicTimeRange(item.start, item.end)} IST</span>
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

type StatCardProps = {
  icon: typeof MdCalendarMonth;
  label: string;
  value: number;
  badge?: string;
  iconClass: string;
  valueClass?: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  badge,
  iconClass,
  valueClass,
}: StatCardProps) {
  return (
    <div
      className={`${CARD} group flex flex-col justify-between p-[var(--spacing-hm-lg)] transition-colors hover:border-[var(--color-primary)]/50`}
    >
      <div className="mb-[var(--spacing-hm-md)] flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={22} aria-hidden />
        </div>
        {badge ? (
          <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <span className="mb-1 block font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
          {label}
        </span>
        <span
          className={`font-dm-sans text-[32px] leading-none font-bold text-[var(--color-on-surface)] ${valueClass ?? ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

type QuickActionProps = {
  icon: typeof MdEventAvailable;
  title: string;
  subtitle: string;
  href: string;
};

function QuickAction({ icon: Icon, title, subtitle, href }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex gap-[var(--spacing-hm-md)] p-[var(--spacing-hm-md)] transition-colors hover:bg-[var(--color-surface-container-low)]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Icon size={18} aria-hidden />
      </div>
      <div>
        <p className="font-dm-sans text-sm text-[var(--color-on-surface)]">
          {title}
        </p>
        <span className="text-[10px] text-[var(--color-on-surface-variant)]">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
