# Notifications

Outbound email for appointment and account lifecycle events.

## Flow — appointments

```
createAppointment()                     ← booking becomes CONFIRMED
  └─ scheduleAppointmentNotifications('appointment.booked', id)
       └─ runAfterResponse()            ← next/server `after`, off the response path
            └─ sendAppointmentNotifications()
                 ├─ getAppointmentNotificationContext()   ← patient + doctor names/emails
                 ├─ templates['appointment.booked'].patient → sendEmail()
                 └─ templates['appointment.booked'].doctor  → sendEmail()
```

`sendEmail` retries transient SMTP failures up to `EMAIL_MAX_RETRIES` times
(4 attempts total) with exponential backoff, then logs the failure at
`severity: "critical"`. Nothing in this feature throws into its caller: a
booking never fails because email did.

## Flow — account registration

```
registerPatient()                       ← after the create transaction commits
  └─ scheduleWelcomeEmail({ email, firstName, role })
       └─ runAfterResponse()
            └─ sendWelcomeEmail()  →  renderWelcomeEmail()  →  sendEmail()
```

Registration data is already in hand when the account is created, so this path
skips the database round-trip the appointment path needs. It reuses the same
layout, mailer, retry, and scheduling. `getRoleHome()` picks the portal the
email links to, so a doctor sign-up flow works without template changes.

## Trigger points

| Event | Fires from |
|---|---|
| `appointment.booked` | `createAppointment()` in `features/appointments/services/appointments.ts` |
| `appointment.cancelled` | `cancelAppointment()` in `features/appointments/services/appointment-transitions.ts` |
| `appointment.rescheduled` | `rescheduleAppointment()` in `features/appointments/services/appointment-transitions.ts` |
| account registered | `registerPatient()` in `features/auth/services/registration.ts` |

`createAppointment()` is the single place an appointment row is created, so it
covers direct booking, Razorpay verification, and webhook fulfilment without
duplicate sends. `scheduleWelcomeEmail` sits after the registration transaction
commits, so a rolled-back sign-up sends nothing.

## Event details

Each transition dispatches only after its transaction commits, so a rolled-back
or lost-race change sends nothing.

Cancellation attributes the actor:

```ts
scheduleAppointmentNotifications('appointment.cancelled', appointment.id, {
  cancelledBy: 'patient', // or 'doctor'; omit for neutral copy
});
```

Reschedule captures the old slot **before** the update overwrites it — the
appointment row cannot supply it afterwards:

```ts
scheduleAppointmentNotifications('appointment.rescheduled', appointment.id, {
  previousStartsAt: appointment.startsAt,
  previousEndsAt: appointment.endsAt,
});
```

`AppointmentEventDetails` carries what the appointment row can no longer supply
once the transition has happened. Every field is optional: omit
`previousStartsAt`/`previousEndsAt` and the reschedule emails drop the
"Previous slot" row and fall back to neutral copy; omit `cancelledBy` and the
cancellation emails do not attribute the cancellation to either party.

## Adding a new event

1. Add it to `AppointmentNotificationEvent` in `types/types.ts`.
2. Create `templates/appointment-<event>-patient.ts` and
   `templates/appointment-<event>-doctor.ts` using `renderEmailHtml` /
   `renderEmailText` from `lib/email-layout.ts`.
3. Register both in `APPOINTMENT_EMAIL_TEMPLATES` in `templates/index.ts`.
4. Call `scheduleAppointmentNotifications('<event>', appointmentId, details)`.

An event with no registered template is a no-op with an info log, so step 4 can
land before the templates exist.

## Configuration

See `.env.sample` for `SMTP_*`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, and
`EMAIL_NOTIFICATIONS_ENABLED`. With `SMTP_HOST` unset, delivery is skipped and
logged — the intended state for local development and CI.

### Link host

`getAppUrl()` resolves the base URL for every link in every template:

1. `NEXT_PUBLIC_APP_URL` — explicit override, e.g. a custom domain. Ignored when
   it points at localhost *and* `VERCEL=1`, which is what happens when a local
   `.env` is pasted into Vercel.
2. `VERCEL_PROJECT_PRODUCTION_URL` — the stable production domain. Vercel
   injects it at runtime, so no rebuild is needed for it to apply.
3. `VERCEL_URL` — per-deployment host, used on previews.
4. `AUTH_URL`
5. `http://localhost:3000`

A Vercel deployment therefore links to itself with no configuration. Note that
`NEXT_PUBLIC_*` is inlined at build time, so changing it always requires a
redeploy — the Vercel variables do not.

## Conventions

- Brand tokens are inlined as literals in `lib/email-layout.ts`; email clients
  strip `<style>` blocks and CSS variables.
- All template copy is escaped in the layout — `reasonForVisit` and
  `additionalNotes` are patient-supplied.
- Logs carry masked addresses and the booking reference, never PHI.
