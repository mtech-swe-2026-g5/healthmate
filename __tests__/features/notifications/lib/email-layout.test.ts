import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  renderEmailHtml,
  renderEmailText,
  type EmailLayoutInput,
} from "@/features/notifications/lib/email-layout";

const layout: EmailLayoutInput = {
  preheader: "Dr. Ananya Patel on Monday, Aug 3, 2026",
  badge: "Appointment confirmed",
  heading: "Your appointment is confirmed",
  greeting: "Hi Priya,",
  intro: "Your consultation is booked.",
  rows: [
    { label: "Booking reference", value: "HM-A1B2C3" },
    { label: "Doctor", value: "Dr. Ananya Patel" },
  ],
  ctaLabel: "View appointment",
  ctaUrl: "https://healthmate.app/appointments/appt-1",
  outro: "Please arrive 10 minutes early.",
};

describe("escapeHtml", () => {
  it("escapes every HTML-significant character", () => {
    expect(escapeHtml(`<b>"x" & 'y'</b>`)).toBe(
      "&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;",
    );
  });
});

describe("renderEmailHtml", () => {
  it("renders the brand shell with heading, rows, and CTA", () => {
    const html = renderEmailHtml(layout);

    expect(html).toContain("Your appointment is confirmed");
    expect(html).toContain("Booking reference");
    expect(html).toContain("HM-A1B2C3");
    expect(html).toContain('href="https://healthmate.app/appointments/appt-1"');
    expect(html).toContain("View appointment");
  });

  it("uses the brand primary teal for the CTA", () => {
    expect(renderEmailHtml(layout)).toContain("background-color:#1a6b72");
  });

  it("declares support for both colour schemes", () => {
    const html = renderEmailHtml(layout);

    expect(html).toContain('name="color-scheme" content="light dark"');
    expect(html).toContain(
      'name="supported-color-schemes" content="light dark"',
    );
    expect(html).toContain("@media (prefers-color-scheme: dark)");
  });

  it("pins the CTA label colour so dark mode cannot hide it", () => {
    const html = renderEmailHtml(layout);
    const cta = html.slice(html.indexOf("<a href="));

    // Once on the anchor, once on the nested span — clients that override one
    // rarely override both.
    expect(cta.match(/color:#ffffff !important/g)).toHaveLength(2);
  });

  it("carries the CTA fill on both the cell and the anchor", () => {
    const html = renderEmailHtml(layout);

    expect(html).toContain('bgcolor="#1a6b72"');
    expect(html).toContain("<a href=");
  });

  it("prints the raw link for clients that drop the button", () => {
    const html = renderEmailHtml(layout);

    expect(html).toContain("Button not working?");
    expect(
      html.match(/https:\/\/healthmate\.app\/appointments\/appt-1/g)?.length,
    ).toBeGreaterThan(1);
  });

  it("escapes user-supplied row values", () => {
    const html = renderEmailHtml({
      ...layout,
      rows: [{ label: "Your notes", value: '<script>alert("x")</script>' }],
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("renderEmailText", () => {
  it("renders a plain-text alternative with the same details", () => {
    const text = renderEmailText(layout);

    expect(text).toContain("Your appointment is confirmed");
    expect(text).toContain("Booking reference: HM-A1B2C3");
    expect(text).toContain(
      "View appointment: https://healthmate.app/appointments/appt-1",
    );
    expect(text).not.toContain("<");
  });
});
