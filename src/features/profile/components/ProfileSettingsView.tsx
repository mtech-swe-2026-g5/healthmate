"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  MdBadge,
  MdCall,
  MdCampaign,
  MdClose,
  MdEdit,
  MdLock,
  MdMail,
  MdMedicalServices,
  MdPerson,
  MdSave,
  MdShield,
  MdSms,
} from "react-icons/md";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
import {
  BLOOD_GROUP_OPTIONS,
  GENDER_LABELS,
  GENDER_OPTIONS,
} from "@/features/auth/constants";
import type { PatientProfile } from "../types";

type ProfileSettingsViewProps = {
  initialProfile: PatientProfile;
};

function formatDisplayDate(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(date.getTime())) return ymd;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function genderLabel(value: string | null): string {
  if (!value) return "—";
  if (value in GENDER_LABELS) {
    return GENDER_LABELS[value as keyof typeof GENDER_LABELS];
  }
  return value;
}

const CARD =
  "rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] md:p-[var(--spacing-hm-xl)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

const INPUT =
  "w-full rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface)] px-[var(--spacing-hm-md)] py-3 font-literata text-body-md text-[var(--color-on-surface)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15";

const LABEL =
  "mb-1.5 block font-dm-sans text-label-md text-[var(--color-on-surface-variant)]";

const COMING_SOON =
  "inline-flex shrink-0 items-center rounded-md bg-[var(--color-secondary-container)] px-2 py-0.5 font-dm-sans text-[10px] font-bold tracking-wide text-[var(--color-primary)] uppercase";

function ComingSoonTag() {
  return <span className={COMING_SOON}>Coming soon</span>;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-[var(--color-outline-variant)]/20 py-3 last:border-b-0">
      <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
        {label}
      </p>
      <div className="mt-0.5 font-literata text-body-md text-[var(--color-on-surface)]">
        {children}
      </div>
    </div>
  );
}

export function ProfileSettingsView({
  initialProfile,
}: ProfileSettingsViewProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    phoneNumber: initialProfile.phoneNumber ?? "",
    dateOfBirth: initialProfile.dateOfBirth,
    gender: (initialProfile.gender ??
      "prefer_not_to_say") as (typeof GENDER_OPTIONS)[number],
    bloodGroup: initialProfile.bloodGroup ?? "",
  });
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const cancelEdit = () => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber ?? "",
      dateOfBirth: profile.dateOfBirth,
      gender: (profile.gender ??
        "prefer_not_to_say") as (typeof GENDER_OPTIONS)[number],
      bloodGroup: profile.bloodGroup ?? "",
    });
    setEditing(false);
  };

  const saveChanges = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phoneNumber,
            dateOfBirth: form.dateOfBirth,
            gender: form.gender,
            bloodGroup: form.bloodGroup || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setToast({
            message: data.error ?? "Could not save profile.",
            variant: "error",
          });
          return;
        }
        setProfile(data.profile);
        setForm({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phoneNumber: data.profile.phoneNumber ?? "",
          dateOfBirth: data.profile.dateOfBirth,
          gender: (data.profile.gender ??
            "prefer_not_to_say") as (typeof GENDER_OPTIONS)[number],
          bloodGroup: data.profile.bloodGroup ?? "",
        });
        setEditing(false);
        setToast({ message: "Profile saved.", variant: "success" });
      } catch {
        setToast({
          message: "Network error. Please try again.",
          variant: "error",
        });
      }
    });
  };

  return (
    <div className="w-full min-w-0 pb-10">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <header className="mb-[var(--spacing-hm-xl)]">
        <nav
          className="mb-1 flex items-center gap-1 text-[var(--color-on-surface-variant)]"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="font-dm-sans text-label-sm hover:text-[var(--color-primary)]"
          >
            Dashboard
          </Link>
          <span className="font-dm-sans text-label-sm" aria-hidden>
            /
          </span>
          <span className="font-dm-sans text-label-sm font-bold text-[var(--color-primary)]">
            Settings
          </span>
        </nav>
        <h1 className="font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
          Profile Settings
        </h1>
        <p className="mt-1 max-w-2xl font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Update your personal details used for appointments and clinic
          communication.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-[var(--spacing-hm-xl)] xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-[var(--spacing-hm-xl)] xl:col-span-8">
          <section className={CARD} aria-labelledby="personal-info-heading">
            <div className="mb-[var(--spacing-hm-lg)] flex flex-wrap items-center justify-between gap-3">
              <h2
                id="personal-info-heading"
                className="inline-flex items-center gap-2 font-dm-sans text-title-lg text-[var(--color-primary)]"
              >
                <MdBadge size={22} aria-hidden />
                Personal Information
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 font-dm-sans text-label-md text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5 disabled:opacity-50"
                    >
                      <MdClose size={18} aria-hidden />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={isPending}
                      aria-busy={isPending || undefined}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2 font-dm-sans text-label-md font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {isPending ? (
                        <LoadingSpinner size={16} onDark label="Saving" />
                      ) : (
                        <MdSave size={18} aria-hidden />
                      )}
                      {isPending ? "Saving…" : "Save changes"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-secondary-container)] px-4 py-2 font-dm-sans text-label-md text-[var(--color-primary)] transition-colors hover:bg-[var(--color-outline-variant)]/40"
                  >
                    <MdEdit size={18} aria-hidden />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[var(--spacing-hm-lg)] sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--color-surface-container)] bg-[var(--color-primary-container)]/15 font-dm-sans text-headline-md font-bold text-[var(--color-primary)]">
                  {initials || <MdPerson size={40} />}
                </div>
                {!editing && (
                  <p className="text-center font-dm-sans text-label-md font-bold text-[var(--color-on-surface)] sm:text-left">
                    {profile.fullName}
                  </p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First name" htmlFor="profile-first-name">
                      <input
                        id="profile-first-name"
                        className={INPUT}
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        autoComplete="given-name"
                      />
                    </Field>
                    <Field label="Last name" htmlFor="profile-last-name">
                      <input
                        id="profile-last-name"
                        className={INPUT}
                        value={form.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        autoComplete="family-name"
                      />
                    </Field>
                    <Field label="Email address">
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-[var(--spacing-hm-md)] py-3">
                        <span className="min-w-0 flex-1 break-all font-literata text-body-md text-[var(--color-on-surface)]">
                          {profile.email}
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 font-dm-sans text-[10px] font-bold tracking-wide uppercase ${
                            profile.emailVerified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)]"
                          }`}
                        >
                          {profile.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      <p className="mt-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                        Email cannot be changed here.
                      </p>
                    </Field>
                    <Field label="Phone number" htmlFor="profile-phone">
                      <input
                        id="profile-phone"
                        className={INPUT}
                        value={form.phoneNumber}
                        onChange={(e) =>
                          setField("phoneNumber", e.target.value)
                        }
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </Field>
                    <Field label="Date of birth" htmlFor="profile-dob">
                      <input
                        id="profile-dob"
                        className={INPUT}
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          setField("dateOfBirth", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Gender" htmlFor="profile-gender">
                      <select
                        id="profile-gender"
                        className={INPUT}
                        value={form.gender}
                        onChange={(e) =>
                          setField(
                            "gender",
                            e.target.value as (typeof GENDER_OPTIONS)[number],
                          )
                        }
                      >
                        {GENDER_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {GENDER_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Blood type" htmlFor="profile-blood">
                      <select
                        id="profile-blood"
                        className={INPUT}
                        value={form.bloodGroup}
                        onChange={(e) => setField("bloodGroup", e.target.value)}
                      >
                        <option value="">Not specified</option>
                        {BLOOD_GROUP_OPTIONS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[var(--color-surface-container-low)]/60 px-[var(--spacing-hm-md)] sm:px-[var(--spacing-hm-lg)]">
                    <ReadRow label="Email">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="break-all">{profile.email}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 font-dm-sans text-[10px] font-bold tracking-wide uppercase ${
                            profile.emailVerified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)]"
                          }`}
                        >
                          {profile.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </span>
                    </ReadRow>
                    <ReadRow label="Phone number">
                      {profile.phoneNumber || "—"}
                    </ReadRow>
                    <ReadRow label="Date of birth">
                      {formatDisplayDate(profile.dateOfBirth)}
                    </ReadRow>
                    <ReadRow label="Gender">
                      {genderLabel(profile.gender)}
                    </ReadRow>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={CARD} aria-labelledby="medical-info-heading">
            <h2
              id="medical-info-heading"
              className="mb-[var(--spacing-hm-lg)] inline-flex items-center gap-2 font-dm-sans text-title-lg text-[var(--color-primary)]"
            >
              <MdMedicalServices size={22} aria-hidden />
              Medical Information
            </h2>
            <div className="grid grid-cols-1 gap-[var(--spacing-hm-lg)] md:grid-cols-2">
              <div>
                <p className={LABEL}>Blood type</p>
                {profile.bloodGroup ? (
                  <div className="inline-flex h-12 min-w-12 items-center justify-center rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-container)]/40 px-3 font-dm-sans text-title-lg font-bold text-[var(--color-error)]">
                    {profile.bloodGroup}
                  </div>
                ) : (
                  <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                    Not on file
                    {!editing && (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="ml-2 font-dm-sans text-label-md text-[var(--color-primary)] hover:underline"
                      >
                        Add
                      </button>
                    )}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-dashed border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-low)]/50 p-[var(--spacing-hm-md)]">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                    Known allergies
                  </p>
                  <ComingSoonTag />
                </div>
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Allergy tracking will appear here in a future update.
                </p>
              </div>

              <div className="rounded-xl border border-dashed border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-low)]/50 p-[var(--spacing-hm-md)] md:col-span-2">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                    Emergency contact
                  </p>
                  <ComingSoonTag />
                </div>
                <p className="mb-2 font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Add a contact for clinic staff in an emergency.
                </p>
                <p className="flex items-center gap-1.5 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  <MdCall size={16} aria-hidden />
                  Not on file
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-[var(--spacing-hm-xl)] xl:col-span-4">
          <section className={CARD} aria-labelledby="notifications-heading">
            <div className="mb-[var(--spacing-hm-lg)] flex flex-wrap items-center justify-between gap-2">
              <h2
                id="notifications-heading"
                className="font-dm-sans text-title-lg text-[var(--color-primary)]"
              >
                Notifications
              </h2>
              <ComingSoonTag />
            </div>
            <ul className="space-y-4">
              {(
                [
                  {
                    icon: MdMail,
                    title: "Email reminders",
                    description: "Reminder 24h before your appointment.",
                  },
                  {
                    icon: MdSms,
                    title: "SMS reminders",
                    description: "Texts for booking changes.",
                  },
                  {
                    icon: MdCampaign,
                    title: "Promotional updates",
                    description: "Clinic news and health tips.",
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3 rounded-xl bg-[var(--color-surface-container-low)]/70 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <item.icon size={18} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                      {item.title}
                    </p>
                    <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
              Preference controls will unlock when delivery is available.
            </p>
          </section>

          <section className={CARD} aria-labelledby="security-heading">
            <div className="mb-[var(--spacing-hm-lg)] flex flex-wrap items-center justify-between gap-2">
              <h2
                id="security-heading"
                className="font-dm-sans text-title-lg text-[var(--color-primary)]"
              >
                Security & Account
              </h2>
              <ComingSoonTag />
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-container-low)]/70 p-3">
                <MdLock
                  size={20}
                  className="shrink-0 text-[var(--color-on-surface-variant)]"
                  aria-hidden
                />
                <span className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                  Change password
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-container-low)]/70 p-3">
                <MdShield
                  size={20}
                  className="shrink-0 text-[var(--color-on-surface-variant)]"
                  aria-hidden
                />
                <span className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                  Two-factor authentication
                </span>
              </li>
            </ul>
            <div className="mt-6 border-t border-[var(--color-outline-variant)]/25 pt-5">
              <p className="mb-2 font-dm-sans text-label-sm font-bold tracking-wide text-[var(--color-error)] uppercase">
                Danger zone
              </p>
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                Account deletion will be available in a later release.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
