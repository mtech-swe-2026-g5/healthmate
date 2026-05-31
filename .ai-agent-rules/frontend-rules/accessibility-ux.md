# Accessibility & UX Standards

## WCAG Compliance

### Compliance Level
- Follow WCAG 2.1 Level AA guidelines minimum
- Aim for Level AAA where possible for critical paths (appointment booking)

### Key Requirements
- Ensure keyboard navigation works for all interactive elements
- Provide alternative text for images
- Maintain proper color contrast ratios (4.5:1 for text, 3:1 for UI components)
- Ensure all forms (especially booking forms) are fully accessible

### Semantic HTML
- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<section>`, etc.)
- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<label>` elements for form inputs
- Use `<fieldset>` and `<legend>` for form groups (e.g., appointment time selection)

## Accessibility Testing

### Testing Methods
- Use automated accessibility testing tools (axe, Lighthouse)
- Test with screen readers (VoiceOver on macOS)
- Test booking forms with keyboard-only navigation
- Conduct manual accessibility audits for critical flows

## Responsive Design

### Mobile-First Approach
- Implement mobile-first approach (patients often book from phones)
- Test on multiple devices and screen sizes
- Ensure touch targets are appropriately sized (minimum 44x44px)
- Ensure appointment booking works well on mobile devices

### Breakpoints
Use Tailwind defaults:
- **sm**: 640px
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (wide desktop)

## User Experience for HealthMate

### Appointment Booking Flow
- Make the booking process simple and clear (minimal steps)
- Provide clear progress indicators during multi-step booking
- Show available time slots visually (calendar/grid view)
- Implement loading states for slot availability checks
- Provide confirmation immediately after booking
- Show clear appointment details on confirmation

### Schedule View UX
- Display doctor schedules in a clear, scannable format
- Use color coding for appointment status (pending, confirmed, cancelled)
- Appointment status must not rely on color alone — add text labels or icons
- Support daily, weekly, and monthly views
- Show patient information clearly on each appointment card

### Cancellation & Rescheduling
- Allow easy cancellation with confirmation dialog
- Show rescheduling options inline when possible
- Communicate cancellation policies clearly
- Send confirmation of cancellation/rescheduling

## Form Accessibility

### Accessible Forms
- Use proper `<label>` elements for all inputs
- Associate error messages with inputs using `aria-describedby`
- Use `aria-required` for required fields
- Use `fieldset` and `legend` for grouped fields (date/time selection)
- Provide clear error messages accessible to screen readers

### Booking Form Example

```typescript
export function BookingForm() {
  return (
    <form aria-label="Appointment booking form">
      <fieldset>
        <legend>Select a Doctor</legend>
        <label htmlFor="doctor">
          Doctor <span aria-label="required">*</span>
        </label>
        <select
          id="doctor"
          aria-required="true"
          aria-describedby="doctor-help doctor-error"
        >
          {/* options */}
        </select>
        <div id="doctor-help">Choose a doctor for your appointment</div>
        <div id="doctor-error" role="alert" aria-live="polite">
          {/* Error message appears here */}
        </div>
      </fieldset>

      <fieldset>
        <legend>Appointment Date & Time</legend>
        <label htmlFor="dateTime">
          Date and Time <span aria-label="required">*</span>
        </label>
        <input
          id="dateTime"
          type="datetime-local"
          aria-required="true"
          aria-describedby="datetime-help"
        />
        <div id="datetime-help">Select your preferred date and time</div>
      </fieldset>
    </form>
  );
}
```

## Accessibility Basics

### ARIA Labels
- Add ARIA labels when needed
- Use `aria-label` for icon-only buttons
- Use `aria-labelledby` to reference labels
- Use `aria-describedby` for help text
- Use `aria-live` for dynamic content updates (e.g., slot availability changes)

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Provide visible focus indicators (`ring-2 ring-blue-500 ring-offset-2`)
- Use proper tab order
- Calendar/date picker components must support arrow-key navigation

### Color & Contrast
- Maintain sufficient color contrast (4.5:1 for text, 3:1 for UI)
- Don't rely on color alone to convey appointment status — always pair with text/icons
- Test with color blindness simulators
- Ensure focus indicators are visible

### Progressive Enhancement
- Core functionality (viewing appointments, basic booking) should work without JavaScript
- Use Server Actions for form submissions (built-in progressive enhancement)
- Provide fallbacks for interactive features

## Accessibility Checklist

- [ ] All images have alt text
- [ ] All forms have proper labels
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets WCAG AA standards
- [ ] Booking forms are accessible
- [ ] Error messages are clear and accessible
- [ ] Success messages are clear and accessible
- [ ] Touch targets are appropriately sized (min 44x44px)
- [ ] Text is resizable up to 200%
- [ ] Focus indicators are visible
- [ ] Heading hierarchy is logical
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA labels used where appropriate
- [ ] Form errors are associated with inputs
- [ ] Appointment status uses text/icons, not just color
