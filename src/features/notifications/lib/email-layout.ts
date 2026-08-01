import { siteConfig } from "@/config/site";

/**
 * Shared HealthMate email shell.
 *
 * Email clients strip <style> blocks and CSS variables, so the brand tokens
 * from `.ai-agent-rules/brand-guidelines.md` are inlined here as literals and
 * the layout is table-based for Outlook/Gmail compatibility.
 */
const BRAND = {
  primary: "#1a6b72",
  primaryForeground: "#ffffff",
  surface: "#fcf9f8",
  surfaceContainerLow: "#ffffff",
  surfaceOn: "#1a1a1a",
  surfaceOnVariant: "#5c5c5c",
  secondaryContainer: "#d4ede8",
  secondaryContainerForeground: "#1a4a50",
  outlineVariant: "#c8c5c5",
  radius: "8px",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
} as const;

export type EmailDetailRow = { label: string; value: string };

export type EmailLayoutInput = {
  /** Inbox preview line, shown before the body copy is opened. */
  preheader: string;
  badge: string;
  heading: string;
  greeting: string;
  intro: string;
  rows: EmailDetailRow[];
  ctaLabel: string;
  ctaUrl: string;
  outro: string;
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** All template copy passes through here — patient notes are user-supplied. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function renderRow({ label, value }: EmailDetailRow): string {
  return `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${BRAND.outlineVariant};font-family:${BRAND.fontFamily};font-size:14px;font-weight:500;color:${BRAND.surfaceOnVariant};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
                <td style="padding:8px 0 8px 16px;border-bottom:1px solid ${BRAND.outlineVariant};font-family:${BRAND.fontFamily};font-size:15px;color:${BRAND.surfaceOn};text-align:right;">${escapeHtml(value)}</td>
              </tr>`;
}

export function renderEmailHtml(input: EmailLayoutInput): string {
  const year = siteConfig.copyrightYear;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.surface};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.surface};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:16px;font-family:${BRAND.fontFamily};font-size:18px;font-weight:700;color:${BRAND.primary};">🩺 ${escapeHtml(siteConfig.name)}</td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.surfaceContainerLow};border:1px solid ${BRAND.outlineVariant};border-radius:${BRAND.radius};padding:24px;">
              <span style="display:inline-block;background-color:${BRAND.secondaryContainer};color:${BRAND.secondaryContainerForeground};border-radius:${BRAND.radius};padding:4px 12px;font-family:${BRAND.fontFamily};font-size:12px;font-weight:600;">${escapeHtml(input.badge)}</span>
              <h1 style="margin:16px 0 0;font-family:${BRAND.fontFamily};font-size:22px;font-weight:700;color:${BRAND.surfaceOn};">${escapeHtml(input.heading)}</h1>
              <p style="margin:16px 0 0;font-family:${BRAND.fontFamily};font-size:16px;line-height:1.625;color:${BRAND.surfaceOn};">${escapeHtml(input.greeting)}</p>
              <p style="margin:8px 0 0;font-family:${BRAND.fontFamily};font-size:16px;line-height:1.625;color:${BRAND.surfaceOnVariant};">${escapeHtml(input.intro)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">${input.rows.map(renderRow).join("")}
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:${BRAND.primary};border-radius:${BRAND.radius};">
                    <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:12px 24px;font-family:${BRAND.fontFamily};font-size:15px;font-weight:500;color:${BRAND.primaryForeground};text-decoration:none;">${escapeHtml(input.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-family:${BRAND.fontFamily};font-size:14px;line-height:1.625;color:${BRAND.surfaceOnVariant};">${escapeHtml(input.outro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;font-family:${BRAND.fontFamily};font-size:12px;line-height:1.625;color:${BRAND.surfaceOnVariant};">
              This is an automated message from ${escapeHtml(siteConfig.name)} — please do not reply.<br />
              &copy; ${year} ${escapeHtml(siteConfig.name)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailText(input: EmailLayoutInput): string {
  const rows = input.rows.map((row) => `${row.label}: ${row.value}`).join("\n");

  return [
    `${siteConfig.name} — ${input.badge}`,
    "",
    input.heading,
    "",
    input.greeting,
    input.intro,
    "",
    rows,
    "",
    `${input.ctaLabel}: ${input.ctaUrl}`,
    "",
    input.outro,
    "",
    `This is an automated message from ${siteConfig.name} — please do not reply.`,
  ].join("\n");
}
