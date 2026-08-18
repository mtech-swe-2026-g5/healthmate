import { getRoleHome } from "@/config/routes";

import { getAppUrl } from "../lib/email-config";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailLayoutInput,
} from "../lib/email-layout";
import type { EmailMessage, WelcomeEmailInput } from "../types";

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Administrator",
};

const ROLE_INTROS: Record<string, string> = {
  patient:
    "Your HealthMate account is ready. You can book appointments with our doctors and track them from your portal.",
  doctor:
    "Your HealthMate account is ready. You can manage your schedule and review incoming appointments from your portal.",
};

/** Account confirmation sent once, after registration succeeds. */
export function renderWelcomeEmail(input: WelcomeEmailInput): EmailMessage {
  const roleLabel = ROLE_LABELS[input.role] ?? "Member";

  const layout: EmailLayoutInput = {
    preheader: `Your ${roleLabel.toLowerCase()} account is ready`,
    badge: "Account created",
    heading: "Welcome to HealthMate",
    greeting: `Hi ${input.firstName},`,
    intro: ROLE_INTROS[input.role] ?? "Your HealthMate account is ready.",
    rows: [
      { label: "Sign-in email", value: input.email },
      { label: "Account type", value: roleLabel },
    ],
    ctaLabel: "Go to your portal",
    ctaUrl: `${getAppUrl()}${getRoleHome(input.role)}`,
    outro:
      "If you did not create this account, contact the clinic so we can remove it.",
  };

  return {
    to: input.email,
    subject: "Welcome to HealthMate — your account is ready",
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
