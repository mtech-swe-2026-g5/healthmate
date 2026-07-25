import type { IconType } from "react-icons";
import {
  MdAutoAwesome,
  MdCalendarMonth,
  MdDashboard,
  MdEmergency,
  MdEventRepeat,
  MdHealthAndSafety,
  MdInsights,
  MdMedicalServices,
  MdNotificationsActive,
  MdPerson,
  MdVaccines,
  MdWarning,
} from "react-icons/md";

export const HERO_DASHBOARD_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC0jOpzw1h884-3JU4lrGoMyedyjUti01592YFttlqheuHtPE06yjLn_n597pI8Y5dXO_dcMv_6obba2IZ2TFKmiLJjUQ2AlpDpjgLuWfCvMkDuxrWJUG41mZZhMs_WulcXz-IarszX-tNwRQXD_ojU15JlZzt0mQzOwui5Amx--xgF-oypHBZzOJLXTOENZPQ1cwDQG9eMN7tUfQAk3tc6pr0PfPOuyUzz1UW5fnlIdJd6z2MHy-G7NWENedcGp0ERH9_WkFNmaTk";

export const DOCTOR_DASHBOARD_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDBCQ0Qc_erdLjBcOkRVx5aHl58mNDNJcQFZluNuNOv6G5qyCqgL9hm9WRh9gBvodN77F9WyRgfIY6hRdUbDbGDDaJaWUz70jyvSU5aXcK_TwIlJvvn2Ut1fZYN2wHqLRVjOpz4zI3YJZcrYF5cg4-F93og8C0tEQAVDN305qWypAJVbvrdM_EDQYR5kPfTfs0POt6aHFoQNKo_kBm2zIdnhtQ7j1QAnr4cBW5p65a7hGjrzdExruI0rqaJGd_KQLERj5CCne6AoRM";

export const platformFeatures: ReadonlyArray<{
  icon: IconType;
  title: string;
  description: string;
}> = [
  {
    icon: MdPerson,
    title: "Patient Registration & Login",
    description:
      "Secure accounts for patients to manage their appointments and health records.",
  },
  {
    icon: MdCalendarMonth,
    title: "Appointment Booking",
    description:
      "Effortless booking flow to schedule visits with the right doctor at the right time.",
  },
  {
    icon: MdMedicalServices,
    title: "Doctor Dashboard",
    description:
      "A clear schedule view for doctors to manage their day without the clutter.",
  },
  {
    icon: MdEventRepeat,
    title: "Cancellation & Rescheduling",
    description:
      "Flexible options to cancel or move appointments without friction.",
  },
  {
    icon: MdNotificationsActive,
    title: "SMS & Email Reminders",
    description:
      "Automated reminders to keep both patients and doctors informed and on time.",
  },
  {
    icon: MdInsights,
    title: "Analytics & Insights",
    description:
      "Understand appointment trends and clinic performance through simple reports.",
  },
];

export const socialProofClinics: ReadonlyArray<{
  icon: IconType;
  name: string;
}> = [
  { icon: MdHealthAndSafety, name: "HealthcareOne" },
  { icon: MdMedicalServices, name: "CityClinic" },
  { icon: MdEmergency, name: "PulseCare" },
  { icon: MdVaccines, name: "VitalityMed" },
];

type BentoFeature = {
  icon: IconType;
  title: string;
  description: string;
};

export const bentoFeatures: {
  large: BentoFeature;
  accent: BentoFeature;
  small: BentoFeature[];
} = {
  large: {
    icon: MdAutoAwesome,
    title: "Smart Scheduling",
    description:
      "Intelligent slots that optimize for doctor specialization and room availability, reducing downtime across your clinic.",
  },
  accent: {
    icon: MdNotificationsActive,
    title: "Automated Reminders",
    description:
      "Reduce no-shows with multi-channel SMS, Email, and Push notifications that patients actually love.",
  },
  small: [
    {
      icon: MdDashboard,
      title: "Doctor Dashboards",
      description:
        "Unified views for practitioners to manage daily rounds and patient files effortlessly.",
    },
    {
      icon: MdWarning,
      title: "Conflict Detection",
      description:
        "Real-time validation prevents double-booking and manages unexpected staff leave automatically.",
    },
    {
      icon: MdInsights,
      title: "Advanced Analytics",
      description:
        "Visualize patient flow, peak hours, and clinic performance with HIPAA-compliant data.",
    },
  ],
};

export const howItWorksSteps = [
  {
    step: "1",
    title: "Register",
    description:
      "Create your clinic profile and sync your existing medical records in minutes.",
  },
  {
    step: "2",
    title: "Book",
    description:
      "Patients select their preferred time through a beautiful, mobile-friendly portal.",
  },
  {
    step: "3",
    title: "Get Reminded",
    description:
      "Automated alerts ensure everyone is on the same page, at the right time.",
  },
] as const;

export const doctorBenefits = [
  "Custom consultation lengths for different specialties.",
  "Integrated telehealth links generated automatically for remote sessions.",
  "Real-time patient feedback and satisfaction scores per visit.",
] as const;
