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
  primaryHover: "#155a60",
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

/**
 * Dark-mode handling.
 *
 * Clients that force-invert colours (Gmail, Outlook.com) rewrite `<a>` colours
 * and can leave button text unreadable against the teal fill. Three defences:
 *  - `color-scheme` meta tells supporting clients we handle both modes, which
 *    stops the blanket inversion
 *  - the CTA colour is set with `!important` on both the anchor and a nested
 *    `<span>`; clients that override one rarely override the other
 *  - the media query below repaints the card for clients that honour it
 *    (Apple Mail, iOS Mail), leaving the teal button untouched
 */
const DARK_MODE_STYLES = `
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .hm-body { background-color: #121212 !important; }
      .hm-card {
        background-color: #1e1e1e !important;
        border-color: #3a3a3a !important;
      }
      .hm-heading, .hm-text { color: #f2f2f2 !important; }
      .hm-muted, .hm-footer { color: #b8b8b8 !important; }
      .hm-row-label { color: #b8b8b8 !important; }
      .hm-row-value { color: #f2f2f2 !important; }
      .hm-row-label, .hm-row-value { border-color: #3a3a3a !important; }
      .hm-brand { color: #7fc4c9 !important; }
      .hm-cta-text { color: #ffffff !important; }
    }`;

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
                <td class="hm-row-label" style="padding:10px 0;border-bottom:1px solid ${BRAND.outlineVariant};font-family:${BRAND.fontFamily};font-size:14px;font-weight:500;color:${BRAND.surfaceOnVariant};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
                <td class="hm-row-value" style="padding:10px 0 10px 16px;border-bottom:1px solid ${BRAND.outlineVariant};font-family:${BRAND.fontFamily};font-size:15px;color:${BRAND.surfaceOn};text-align:right;">${escapeHtml(value)}</td>
              </tr>`;
}

/**
 * Bulletproof CTA button.
 *
 * The fill sits on the `<td>` (with a `bgcolor` attribute for Outlook) *and* on
 * the anchor, so the button survives a client stripping either one. The label
 * colour is pinned with `!important` in two places to stay readable when a
 * client force-inverts for dark mode.
 */
function renderCta(label: string, url: string): string {
  const href = escapeHtml(url);
  const text = escapeHtml(label);

  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                <tr>
                  <td align="center" bgcolor="${BRAND.primary}" style="border-radius:${BRAND.radius};background-color:${BRAND.primary};">
                    <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;min-width:180px;padding:14px 32px;border:1px solid ${BRAND.primaryHover};border-radius:${BRAND.radius};background-color:${BRAND.primary};font-family:${BRAND.fontFamily};font-size:15px;font-weight:600;line-height:20px;letter-spacing:0.01em;text-align:center;text-decoration:none;color:${BRAND.primaryForeground} !important;"><span class="hm-cta-text" style="color:${BRAND.primaryForeground} !important;text-decoration:none;">${text}</span></a>
                  </td>
                </tr>
              </table>
              <p class="hm-muted" style="margin:12px 0 0;font-family:${BRAND.fontFamily};font-size:12px;line-height:1.5;color:${BRAND.surfaceOnVariant};word-break:break-all;">Button not working? Paste this link into your browser:<br />${href}</p>`;
}

export function renderEmailHtml(input: EmailLayoutInput): string {
  const year = siteConfig.copyrightYear;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${escapeHtml(input.heading)}</title>
<style>${DARK_MODE_STYLES}
</style>
</head>
<body class="hm-body" style="margin:0;padding:0;background-color:${BRAND.surface};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="hm-body" style="background-color:${BRAND.surface};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td class="hm-brand" style="padding-bottom:16px;font-family:${BRAND.fontFamily};font-size:18px;font-weight:700;color:${BRAND.primary};">🩺 ${escapeHtml(siteConfig.name)}</td>
          </tr>
          <tr>
            <td class="hm-card" style="background-color:${BRAND.surfaceContainerLow};border:1px solid ${BRAND.outlineVariant};border-radius:${BRAND.radius};padding:28px 24px;">
              <span style="display:inline-block;background-color:${BRAND.secondaryContainer};color:${BRAND.secondaryContainerForeground} !important;border-radius:${BRAND.radius};padding:5px 12px;font-family:${BRAND.fontFamily};font-size:12px;font-weight:600;letter-spacing:0.02em;">${escapeHtml(input.badge)}</span>
              <h1 class="hm-heading" style="margin:16px 0 0;font-family:${BRAND.fontFamily};font-size:22px;font-weight:700;line-height:1.3;color:${BRAND.surfaceOn};">${escapeHtml(input.heading)}</h1>
              <p class="hm-text" style="margin:16px 0 0;font-family:${BRAND.fontFamily};font-size:16px;line-height:1.625;color:${BRAND.surfaceOn};">${escapeHtml(input.greeting)}</p>
              <p class="hm-muted" style="margin:8px 0 0;font-family:${BRAND.fontFamily};font-size:16px;line-height:1.625;color:${BRAND.surfaceOnVariant};">${escapeHtml(input.intro)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">${input.rows.map(renderRow).join("")}
              </table>${renderCta(input.ctaLabel, input.ctaUrl)}
              <p class="hm-muted" style="margin:24px 0 0;font-family:${BRAND.fontFamily};font-size:14px;line-height:1.625;color:${BRAND.surfaceOnVariant};">${escapeHtml(input.outro)}</p>
            </td>
          </tr>
          <tr>
            <td class="hm-footer" style="padding-top:16px;font-family:${BRAND.fontFamily};font-size:12px;line-height:1.625;color:${BRAND.surfaceOnVariant};">
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
