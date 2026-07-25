export const siteConfig = {
  name: "HealthMate",
  title: "HealthMate | Healthcare Scheduling, Finally Effortless",
  description:
    "The intelligent appointment platform that bridges the gap between patient expectations and clinical efficiency.",
  copyrightYear: 2026,
} as const;

export const authRoutes = {
  login: "/login",
  register: "/register",
} as const;

export const marketingNavLinks = [
  { label: "Features", href: "#features" },
  { label: "For Doctors", href: "#for-doctors" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
] as const;

export const footerProductLinks = [
  { label: "Features", href: "#features" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Pricing", href: "#pricing" },
] as const;

export const footerDoctorLinks = [
  { label: "For Doctors", href: "#for-doctors" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
] as const;

export const footerLegalLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
] as const;
