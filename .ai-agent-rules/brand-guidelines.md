# HealthMate – Brand Guidelines

**Design System:** Clinical Precision  
**Brand Personality:** Trustworthy, Calm, Efficient, HIPAA-Compliant Professionalism

This document is the **definitive reference** for all design and development decisions throughout the HealthMate project. All components, colors, typography, spacing, layout patterns, and interactions must strictly adhere to these guidelines to maintain brand consistency and visual coherence across marketing pages, patient/doctor portals, and booking flows.

---

## Brand Overview

- **Positioning**: A modern, reliable clinic appointment scheduling system built for patients and doctors.
- **Visual Feel**: Clean, professional, trustworthy; clear hierarchy; calming deep teal on warm neutral surfaces — clinical precision without cold sterility.
- **Tone**: Reassuring and efficient. Every screen should feel HIPAA-aware: structured, legible, and respectful of sensitive data.

---

## Visual Identity & Design Tokens

> **All hex values below are exact and must be used precisely as specified.** Map tokens to Tailwind CSS custom properties in `globals.css` where possible.

### Color Palette

#### Primary — Deep Teal
| Token | Hex | Tailwind (approx.) | Role |
|-------|-----|-------------------|------|
| `--color-primary` | `#1a6b72` | Custom | Primary actions, branding, active states, links |
| `--color-primary-hover` | `#155a60` | Custom | Hover state for primary buttons and nav |
| `--color-primary-foreground` | `#ffffff` | `white` | Text on primary backgrounds |

**Usage:**
- Logo accent and brand mark ("🩺HealthMate")
- Primary action buttons (Book Appointment, Confirm, Submit)
- Active navigation and sidebar items
- Focus rings (2px ring in Primary Teal)
- Interactive text links

#### Surface & Background
| Token | Hex | Role |
|-------|-----|------|
| `--color-surface` | `#fcf9f8` | Primary page background — warm neutral white to reduce clinical coldness |
| `--color-surface-dim` | `#dcd9d9` | Secondary backgrounds, subtle borders, dividers |
| `--color-surface-container-low` | `#ffffff` | Card and elevated container backgrounds |
| `--color-surface-on` | `#1a1a1a` | Primary text on surface backgrounds |
| `--color-surface-on-variant` | `#5c5c5c` | Headlines, secondary emphasis, metadata |

**Usage:**
- Page and portal backgrounds: `surface`
- Dashboard panels, form sections: `surface` or `surface-container-low`
- Table borders, card outlines: `surface-dim` or `outline-variant`

#### Secondary Container — Soft Teal / Mint
| Token | Hex | Role |
|-------|-----|------|
| `--color-secondary-container` | `#d4ede8` | Badges, highlights, subtle active backgrounds |
| `--color-secondary-container-foreground` | `#1a4a50` | Text on secondary container backgrounds |

**Usage:**
- Status badges (e.g., "Upcoming", "In Progress")
- Highlighted list rows
- Sidebar hover states (non-active)
- KPI card accent backgrounds

#### Outline & Borders
| Token | Hex | Role |
|-------|-----|------|
| `--color-outline-variant` | `#c8c5c5` | 1px card borders, input outlines, structural dividers |

#### Status Colors
| Token | Hex | Tailwind (approx.) | Usage |
|-------|-----|-------------------|-------|
| `--color-success` | `#059669` | `emerald-600` | Completed, Confirmed, availability indicators |
| `--color-success-container` | `#d1fae5` | `emerald-100` | Success badge backgrounds |
| `--color-warning` | `#d97706` | `amber-600` | Pending appointments, scheduling conflicts |
| `--color-warning-container` | `#fef3c7` | `amber-100` | Warning badge backgrounds |
| `--color-error` | `#c45c5c` | Custom soft red | Cancelled, validation errors, Delete Account |
| `--color-error-container` | `#fde8e8` | Custom | Error badge and inline alert backgrounds |
| `--color-info` | `#0e7490` | `cyan-700` | Informational banners, reminders, help tooltips |

**Status color rules:**
- Use consistently for appointment states throughout the app
- Never rely on color alone — pair with text labels and icons (see Accessibility)
- Reserve `--color-error` for destructive actions and failure states only

### Color Usage Rules

- **Accessibility**: Maintain at least **4.5:1** contrast ratio for body text (WCAG AA); **3:1** for UI components and large text
- **Primary Teal**: Reserve for interactive elements, branding, and active states
- **Warm Surfaces**: Prefer `surface` over pure white for page backgrounds; use `surface-container-low` (white) for cards to create subtle depth
- **White Space**: Use generous spacing for a calm, medical/professional feel
- **HIPAA Compliance**: Mask or truncate sensitive patient data in lists and previews (e.g., partial names, obscured identifiers) unless the user is authorized and viewing a detail screen

### Shape & Geometry

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `ROUND_EIGHT` | `8px` | `rounded-lg` | Cards, buttons, inputs, badges, modals |
| Elevation | Flat + subtle | `shadow-sm` | Cards, dropdowns, sticky header — define layer depth without clutter |
| Border width | `1px` | `border` | Cards, inputs, dividers |

**Rules:**
- Do not mix border radii arbitrarily — default to `rounded-lg` (8px) across all interactive and container elements
- Avoid heavy shadows (`shadow-lg`, `shadow-xl`) except for modals and overlays
- Prefer flat design with outline borders over skeuomorphic depth

---

## Typography

### Font Family
- **Primary**: `DM Sans` (sans-serif) — load via `next/font/google`
- **Monospace**: Geist Mono or `DM Mono` — for appointment IDs, timestamps, codes
- **CSS Variable**: `--font-dm-sans` (primary), `--font-geist-mono` (monospace)
- **Fallback**: `"DM Sans", Arial, Helvetica, sans-serif`

### Hierarchy

| Role | Weight | Color | Usage |
|------|--------|-------|-------|
| **Headlines** | Semi-bold / Bold (`font-semibold`–`font-bold`) | Primary teal or `surface-on-variant` | Page titles, section headings, card titles |
| **Body** | Regular (`font-normal`) | `surface-on` or `surface-on-variant` | Clinical notes, descriptions, form copy — optimized line-height for legibility |
| **Labels** | Medium (`font-medium`) | `surface-on-variant` | Navigation items, metadata, form labels, table headers |

### Typography Scale

#### Headlines

##### H1 — Page Titles
- **Desktop**: `text-4xl` to `text-5xl` (36–48px)
- **Font Weight**: `font-bold` (700)
- **Color**: `surface-on` or primary teal for marketing hero text

##### H2 — Section Headings
- **Desktop**: `text-2xl` to `text-3xl` (24–30px)
- **Font Weight**: `font-bold` (700)
- **Color**: `surface-on`

##### H3 — Card Titles / Subsections
- **Size**: `text-base` to `text-lg` (16–18px)
- **Font Weight**: `font-semibold` (600)
- **Color**: `surface-on`

#### Body Text

##### Primary Body
- **Size**: `text-base` (16px)
- **Line Height**: `leading-relaxed` (1.625) — optimized for clinical notes and long-form content
- **Color**: `surface-on`

##### Secondary / Small
- **Size**: `text-sm` (14px)
- **Line Height**: `leading-relaxed`
- **Color**: `surface-on-variant`

---

## Core Components

### Top Navigation Bar
- **Brand**: `🩺HealthMate` — primary teal, `font-bold`
- **Layout**: Search on the **left**; Profile and Notifications on the **right**
- **Style**: Sticky top bar with blurred background (`backdrop-blur-md`), minimal bottom border (`border-b border-outline-variant`)
- **Background**: Semi-transparent `surface` or white with blur (`bg-surface/80` or `bg-white/80`)
- **Height**: Consistent across portal and marketing contexts (~64px)

### Sidebar (Professional / Portal)
- **Width**: `264px` (`w-[264px]`) — fixed
- **Items**: Dashboard, Appointments, Schedule, Patients, Analytics, Settings
- **Default state**: `surface-on-variant` text, medium weight labels
- **Hover state**: `secondary-container` background or subtle `surface-dim` fill
- **Active state**: Primary teal background (`bg-primary`) with white text (`text-primary-foreground`), or primary teal left border accent with `secondary-container` fill
- **Behavior**: Fixed on desktop; collapsible drawer on mobile (`md:` breakpoint and below)

### Cards & Containers
- **Padding**: `p-6` (`p-lg`, ~24px) on desktop; `p-4` on mobile
- **Background**: `surface-container-low` (white) or `surface`
- **Border**: `1px solid outline-variant` (`border border-outline-variant`)
- **Border Radius**: `rounded-lg` (8px)
- **Elevation**: `shadow-sm` when elevated; flat with border only when nested inside other containers
- **Hover** (interactive cards): `hover:shadow-sm transition-shadow duration-200 ease-in-out`

### Buttons & CTAs

#### Primary Button
- **Background**: Primary teal (`#1a6b72`)
- **Hover**: `#155a60`
- **Text**: White, `font-medium`
- **Border Radius**: `rounded-lg` (8px)
- **Padding**: `px-6 py-2.5`
- **Transition**: `transition-colors duration-200 ease-in-out`

#### Secondary / Outline Button
- **Background**: White or transparent
- **Border**: `border border-outline-variant`
- **Text**: `surface-on`
- **Hover**: `bg-secondary-container` or `bg-surface-dim`

#### Destructive Button
- **Background**: Error soft red (`#c45c5c`)
- **Hover**: Darken by one step (`#a84a4a`)
- **Text**: White
- **Usage**: Cancel appointment, delete account — always require confirmation dialog

### Form Inputs
- **Style**: Outlined with `1px border-outline-variant`, `rounded-lg` (8px)
- **Background**: White or `surface-container-low`
- **Focus**: `ring-2 ring-primary ring-offset-2` — 2px ring in Primary Teal
- **Labels**: Medium weight, `surface-on-variant`
- **Validation**: Inline requirements with checkmark iconography (e.g., Reset Password screen) — success check in `--color-success`, error text in `--color-error`
- **Field spacing**: `space-y-4` between fields; `gap-2` between label and input

---

## Screen Architecture

### Portal Layout (Doctor / Patient Dashboards)
- **Grid**: 12-column responsive grid
- **Structure**: Fixed sidebar (264px) + scrollable content area with top header
- **Content max-width**: Constrain inner content where appropriate (`max-w-7xl` for data-heavy views)
- **Section spacing**: `px-6 py-8` (desktop), `px-4 py-6` (mobile)

### Marketing Layout
- Full-width sections on `surface` background
- Hero with primary teal accents and warm neutral white base
- Max content width: `max-w-6xl` (72rem) for readable prose sections

### Form Design Patterns
- Group related fields with clear section headings (H3)
- Multi-step flows use a visible progress indicator (steps 1–4)
- Inline validation feedback — never block submit silently
- Confirmation screens summarize all entered data before final action

### Detail Views
- **Split layout**: Primary entity info on the **left** (e.g., Patient Info); logistics and actions on the **right** (e.g., Appointment Details)
- Use cards within each column for logical grouping
- Sticky action bar on mobile for primary actions (Confirm, Reschedule, Cancel)

---

## Key Screens (Desktop Reference)

| Screen | Purpose | Layout Notes |
|--------|---------|--------------|
| **Marketing Landing Page** | High-conversion, brand-focused intro | Hero + feature grid + CTA; primary teal accents on warm surface |
| **Doctor Dashboard** | KPIs, upcoming appointments, quick actions | Sidebar + stat cards + appointment list |
| **Patient Dashboard** | Upcoming visits, booking shortcuts, history | Sidebar + task cards + booking CTA |
| **Booking Flow** | 4-step wizard: Doctor → Date/Time → Details → Confirmed | Modal or full-page wizard with step indicator |
| **Patient / Appointment Detail** | Full record view | Split layout: info left, logistics right |
| **Analytics** | Trends, heatmaps, utilization | Data-heavy charts using brand-compliant palette (primary teal, success emerald, surface-dim neutrals) |
| **Settings / Reset Password** | Account management | Form-heavy; inline validation with checkmark requirements |

### Booking Flow Steps
1. **Doctor Selection** — searchable list or grid of providers
2. **Date / Time** — calendar + time slot grid; unavailable slots visually muted
3. **Details** — patient info, reason for visit, notes
4. **Confirmed** — summary card with success state styling and next steps

---

## Development Guidelines

### Framework & Tooling
- **Styling**: Tailwind CSS 4 — utility-first; define design tokens in `@theme inline` within `globals.css`
- **Icons**: Material Symbols or Lucide — **consistent stroke weight** (prefer `stroke-width: 1.5` or `2` across the app; do not mix filled and outlined arbitrarily)
- **Components**: Server Components by default; Client Components only for interactivity

### Interactions & Motion
- **Default transition**: `duration-200 ease-in-out` for hover, focus, and state changes
- **Hover**: Buttons darken one shade; cards lift with `shadow-sm`; links underline or shift to primary teal
- **Focus**: Visible focus rings on all interactive elements — `ring-2 ring-primary ring-offset-2`
- **Disabled**: `opacity-50`, `cursor-not-allowed`, no hover effects
- **Loading**: Skeleton placeholders on `surface-dim`; spinners in primary teal

### Responsive Breakpoints

Use Tailwind defaults:
- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`

**Mobile-first:** Design for mobile, enhance for larger screens. Appointment booking must be fully usable on mobile devices. Sidebar collapses to drawer below `lg`.

### Spacing & Layout Tokens

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| `p-lg` | `p-6` | ~24px | Card padding (desktop) |
| Section padding | `px-6 py-20` / `px-4 py-12` | — | Marketing sections (desktop / mobile) |
| Portal section | `px-6 py-8` / `px-4 py-6` | — | Dashboard content area |
| Card gap | `gap-6` | 24px | Grid gaps between cards |
| Form field gap | `space-y-4` | 16px | Vertical spacing between form fields |

---

## Accessibility & Compliance

- Maintain **WCAG 2.1 Level AA** minimum (see `frontend-rules/accessibility-ux.md`)
- **4.5:1** contrast ratio for body text; **3:1** for UI components
- All images require descriptive `alt` text
- Interactive elements must be keyboard accessible with visible focus states
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<form>`, `<aside>`)
- Appointment status must not rely on color alone — add text labels and icons
- **HIPAA-aware UI**: Mask sensitive data in list views; show full details only on authorized detail screens; avoid logging PHI in client-side errors or analytics

---

## Token Quick Reference (CSS Custom Properties)

Implement these in `src/app/globals.css` under `:root` and `@theme inline`:

```css
:root {
  --color-primary: #1a6b72;
  --color-primary-hover: #155a60;
  --color-primary-foreground: #ffffff;
  --color-surface: #fcf9f8;
  --color-surface-dim: #dcd9d9;
  --color-surface-container-low: #ffffff;
  --color-surface-on: #1a1a1a;
  --color-surface-on-variant: #5c5c5c;
  --color-secondary-container: #d4ede8;
  --color-secondary-container-foreground: #1a4a50;
  --color-outline-variant: #c8c5c5;
  --color-success: #059669;
  --color-success-container: #d1fae5;
  --color-warning: #d97706;
  --color-warning-container: #fef3c7;
  --color-error: #c45c5c;
  --color-error-container: #fde8e8;
  --color-info: #0e7490;
  --radius-default: 8px;
}
```

---

**Reference**: Consult this document for all design and development decisions to ensure brand consistency across the HealthMate application. For accessibility specifics, see `frontend-rules/accessibility-ux.md`. For form validation patterns, see `frontend-rules/form-validation.md`.
