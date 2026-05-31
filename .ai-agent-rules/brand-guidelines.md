# HealthMate – Brand Guidelines

This document serves as the **definitive reference** for all design and development decisions throughout the HealthMate project. All components, colors, typography, spacing, and interactions should strictly adhere to these guidelines to maintain brand consistency and visual coherence.

## Brand Overview

- **Positioning**: A modern, reliable clinic appointment scheduling system built for patients and doctors.
- **Visual Feel**: Clean, professional, trustworthy; clear hierarchy; calming blues on crisp white backgrounds.
- **Font Family**: Geist Sans / Geist Mono (via `next/font/google`)

## Core Color Palette

> **All hex values below are exact and must be used precisely as specified.**

### Primary Colors

#### Primary Blue (Brand / CTA)
- **Hex**: `#2563EB` (Tailwind `blue-600`)
- **Role**: Main brand color, primary CTAs, active states, links
- **Usage**:
  - Logo accent color
  - Primary action buttons (Book Appointment, Confirm, Submit)
  - Active navigation items
  - Links and interactive text
- **Hover State**: `#1D4ED8` (`blue-700`)

#### Primary Navy
- **Hex**: `#111827` (Tailwind `gray-900`)
- **Role**: Primary text and headline color
- **Usage**:
  - All main headlines (H1, H2, H3)
  - Card titles
  - Navbar logo text
  - Important body text

### Secondary Colors

#### Body Text Gray
- **Hex**: `#6B7280` (Tailwind `gray-500`)
- **Role**: Supporting body copy and secondary text
- **Usage**:
  - Card descriptions
  - Form help text
  - Secondary labels
  - Status descriptions

#### Light Background
- **Hex**: `#F9FAFB` (Tailwind `gray-50`)
- **Role**: Section backgrounds, card containers
- **Usage**: Dashboard panels, form backgrounds, feature sections

#### Border / Divider
- **Hex**: `#F3F4F6` (Tailwind `gray-100`)
- **Role**: Card borders, section dividers
- **Usage**: Horizontal rules, card borders, table borders

### Status Colors

#### Success Green
- **Hex**: `#16A34A` (Tailwind `green-600`)
- **Usage**: Confirmed appointments, successful actions, availability indicators

#### Warning Amber
- **Hex**: `#D97706` (Tailwind `amber-600`)
- **Usage**: Pending appointments, scheduling conflicts, warnings

#### Danger Red
- **Hex**: `#DC2626` (Tailwind `red-600`)
- **Usage**: Cancelled appointments, errors, destructive actions

#### Info Blue
- **Hex**: `#0EA5E9` (Tailwind `sky-500`)
- **Usage**: Informational banners, reminder indicators, help tooltips

### Background Colors

#### Pure White
- **Hex**: `#FFFFFF`
- **Role**: Primary background and surface color
- **Usage**: Page background, navbar, card surfaces, form backgrounds

### Color Usage Rules

- **Accessibility**: Maintain at least 4.5:1 contrast ratio for body text
- **Blue Usage**: Reserve for interactive elements and primary actions
- **Gray Scale**: Use for text hierarchy and structural elements
- **Status Colors**: Use consistently for appointment states throughout the app
- **White Space**: Use generous white space for a clean, medical/professional feel

## Typography

### Font Family
- **Primary**: Geist Sans (variable: `--font-geist-sans`)
- **Monospace**: Geist Mono (variable: `--font-geist-mono`) — for codes, IDs, timestamps
- **Fallback**: `Arial, Helvetica, sans-serif`

### Typography Scale

#### Headlines

##### H1 - Page Titles
- **Desktop**: `text-4xl` to `text-6xl` (36–60px)
- **Font Weight**: `font-bold` (700)
- **Color**: `gray-900`

##### H2 - Section Headings
- **Desktop**: `text-2xl` to `text-3xl` (24–30px)
- **Font Weight**: `font-bold` (700)
- **Color**: `gray-900`

##### H3 - Card Titles / Subsections
- **Size**: `text-base` to `text-lg` (16–18px)
- **Font Weight**: `font-semibold` (600)
- **Color**: `gray-900`

#### Body Text

##### Primary Body
- **Size**: `text-base` to `text-lg` (16–18px)
- **Line Height**: `leading-relaxed`
- **Color**: `gray-500`

##### Secondary / Small
- **Size**: `text-sm` (14px)
- **Line Height**: `leading-relaxed`
- **Color**: `gray-500`

## Buttons & CTAs

### Primary Button
- **Background**: `blue-600`
- **Hover**: `blue-700`
- **Text**: White, `font-medium`
- **Border Radius**: `rounded-lg` or `rounded-xl`
- **Padding**: `px-6 py-2.5`

### Secondary / Outline Button
- **Background**: White or transparent
- **Border**: `border border-gray-200`
- **Text**: `gray-700`
- **Hover**: `bg-gray-50`

### Destructive Button
- **Background**: `red-600`
- **Hover**: `red-700`
- **Text**: White
- **Usage**: Cancel appointment, delete account

## Responsive Breakpoints

Use Tailwind defaults:
- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`

### Mobile-First
Design for mobile, enhance for larger screens. Appointment booking must be fully usable on mobile devices.

## Interactive States

### Hover
- Buttons: darken by one Tailwind shade
- Cards: `hover:shadow-sm` or subtle lift
- Links: underline or darken

### Focus
- Visible focus rings (`ring-2 ring-blue-500 ring-offset-2`)
- All interactive elements must show focus for keyboard navigation

### Disabled
- Reduced opacity (`opacity-50`)
- `cursor-not-allowed`
- No hover effects

## Spacing & Layout

- Use Tailwind spacing scale consistently
- Max content width: `max-w-6xl` (72rem)
- Section padding: `px-6 py-20` (desktop), `px-4 py-12` (mobile)
- Card padding: `p-6`
- Card gap: `gap-6`
- Form field gap: `space-y-4`

## Accessibility

- Maintain 4.5:1 contrast ratio minimum for text
- All images require descriptive `alt` text
- Interactive elements must be keyboard accessible
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<form>`)
- Appointment status must not rely on color alone (add text/icons)

---

**Reference**: This document should be consulted for all design and development decisions to ensure brand consistency across the HealthMate application.
