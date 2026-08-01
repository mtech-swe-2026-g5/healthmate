/**
 * Sends the notification templates to one address using sample data — no
 * database, no login, no booking, no slot consumed.
 *
 * Usage:
 *   pnpm email:test you@example.com                     # every template
 *   pnpm email:test you@example.com booked-patient      # one template
 *
 * Names: booked-patient, booked-doctor, cancelled-patient, cancelled-doctor,
 *        rescheduled-patient, rescheduled-doctor, welcome
 *
 * Exits non-zero if any send fails, so CI or a shell check can rely on it.
 */
import "dotenv/config";

import {
  combineDateAndTime,
  formatYmd,
} from "../src/features/appointments/lib/date-utils";
import { getSmtpConfig } from "../src/features/notifications/lib/email-config";
import { sendEmail } from "../src/features/notifications/lib/mailer";
import {
  renderAppointmentBookedDoctorEmail,
  renderAppointmentBookedPatientEmail,
  renderAppointmentCancelledDoctorEmail,
  renderAppointmentCancelledPatientEmail,
  renderAppointmentRescheduledDoctorEmail,
  renderAppointmentRescheduledPatientEmail,
  renderWelcomeEmail,
} from "../src/features/notifications/templates";
import type {
  AppointmentNotificationContext,
  EmailMessage,
} from "../src/features/notifications/types";

/**
 * Sample booking two days out at a real clinic slot, so the rendered times look
 * like a genuine appointment whatever hour the script runs at. Both parties use
 * the same address so a single inbox receives whichever templates were requested.
 */
function buildSampleContext(recipient: string): AppointmentNotificationContext {
  const date = formatYmd(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const previousDate = formatYmd(new Date(Date.now() + 24 * 60 * 60 * 1000));

  return {
    details: {
      previousStartsAt: combineDateAndTime(previousDate, "11:00"),
      previousEndsAt: combineDateAndTime(previousDate, "12:00"),
      cancelledBy: "patient",
    },
    appointment: {
      id: "00000000-0000-4000-8000-000000000000",
      bookingReference: "HM-TEST01",
      startsAt: combineDateAndTime(date, "14:00"),
      endsAt: combineDateAndTime(date, "15:00"),
      reasonForVisit: "Persistent headaches and fatigue",
      additionalNotes:
        "Sample note — this is a test message, not a real booking.",
    },
    patient: {
      firstName: "Priya",
      lastName: "Sharma",
      email: recipient,
    },
    doctor: {
      firstName: "Ananya",
      lastName: "Patel",
      specialization: "General Physician",
      email: recipient,
    },
  };
}

const TEMPLATES = {
  "booked-patient": (recipient: string) =>
    renderAppointmentBookedPatientEmail(buildSampleContext(recipient)),
  "booked-doctor": (recipient: string) =>
    renderAppointmentBookedDoctorEmail(buildSampleContext(recipient)),
  "cancelled-patient": (recipient: string) =>
    renderAppointmentCancelledPatientEmail(buildSampleContext(recipient)),
  "cancelled-doctor": (recipient: string) =>
    renderAppointmentCancelledDoctorEmail(buildSampleContext(recipient)),
  "rescheduled-patient": (recipient: string) =>
    renderAppointmentRescheduledPatientEmail(buildSampleContext(recipient)),
  "rescheduled-doctor": (recipient: string) =>
    renderAppointmentRescheduledDoctorEmail(buildSampleContext(recipient)),
  welcome: (recipient: string) =>
    renderWelcomeEmail({
      email: recipient,
      firstName: "Priya",
      role: "patient",
    }),
} as const satisfies Record<string, (recipient: string) => EmailMessage>;

type TemplateName = keyof typeof TEMPLATES;

const TEMPLATE_NAMES = Object.keys(TEMPLATES) as TemplateName[];

function parseArgs(): { recipient: string; templates: TemplateName[] } {
  const [recipient, template] = process.argv.slice(2);

  if (!recipient || !recipient.includes("@")) {
    throw new Error(
      `Usage: pnpm email:test <recipient@example.com> [${TEMPLATE_NAMES.join("|")}]`,
    );
  }

  if (template && !TEMPLATE_NAMES.includes(template as TemplateName)) {
    throw new Error(
      `Unknown template "${template}" — use one of: ${TEMPLATE_NAMES.join(", ")}`,
    );
  }

  return {
    recipient,
    templates: template ? [template as TemplateName] : TEMPLATE_NAMES,
  };
}

async function main(): Promise<void> {
  const { recipient, templates } = parseArgs();
  const config = getSmtpConfig();

  if (!config) {
    console.error(
      "SMTP is not configured. Set SMTP_HOST (and EMAIL_FROM or SMTP_USER) in .env, " +
        "and make sure EMAIL_NOTIFICATIONS_ENABLED is not 'false'.",
    );
    process.exit(1);
  }

  console.info(
    `Relay:  ${config.host}:${config.port} (secure: ${config.secure})`,
  );
  console.info(`From:   ${config.from}`);
  console.info(`To:     ${recipient}\n`);

  let failed = false;

  for (const name of templates) {
    const message = TEMPLATES[name](recipient);
    const result = await sendEmail(message, {
      template: name,
      source: "email:test",
    });

    console.info(
      `${name.padEnd(20)} ${result.status} after ${result.attempts} attempt(s) — "${message.subject}"`,
    );
    if (result.status !== "sent") failed = true;
  }

  if (failed) {
    console.error("\nAt least one send failed. See the logged error above.");
    process.exit(1);
  }

  console.info(
    "\nDone. Check the inbox (and the spam folder on a first send).",
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
