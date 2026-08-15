# HAS7 — Appointment Booking Schema Design

Embed under the HAS7 epic page in Confluence after review.

## Overview

Patient appointment booking adds three domain tables on top of the existing identity model (`users`, `patients`, `roles`):

- **doctors** — clinical profile 1:1 with a `users` row (`role = doctor`)
- **working_hours** — global clinic hours used to derive bookable slots
- **appointments** — confirmed bookings with a human-readable booking reference
- **appointment_history** — immutable audit trail of cancellations and reschedules

```
users 1──1 patients 1──* appointments *──1 doctors 1──1 users
                              1──* appointment_history
working_hours (global, keyed by day_of_week)
```

## Tables

### doctors

| Column | Type | Notes |
|--------|------|--------|
| id | UUID PK | |
| user_id | UUID UNIQUE FK → users | Auth identity |
| first_name | VARCHAR(100) | Display name |
| last_name | VARCHAR(100) | |
| specialization | VARCHAR(120) | Shown on doctor cards |
| is_active | BOOLEAN | Inactive doctors omitted from list |
| created_at / updated_at | TIMESTAMPTZ | |

### working_hours

| Column | Type | Notes |
|--------|------|--------|
| id | SMALLINT PK | |
| day_of_week | SMALLINT UNIQUE | 0=Sunday … 6=Saturday |
| start_time | VARCHAR(5) | `"11:00"` |
| end_time | VARCHAR(5) | `"19:00"` (last slot starts 18:00) |
| slot_duration_minutes | SMALLINT | Default `60` |
| is_active | BOOLEAN | Sunday seeded inactive |

MVP seed: Mon–Sat active, 11:00–19:00, 60-minute slots.

### appointments

| Column | Type | Notes |
|--------|------|--------|
| id | UUID PK | |
| booking_reference | VARCHAR(20) UNIQUE | e.g. `HM-A1B2C3` |
| patient_id | UUID FK → patients | |
| doctor_id | UUID FK → doctors | |
| starts_at | TIMESTAMPTZ | Slot start; rewritten in place on reschedule |
| ends_at | TIMESTAMPTZ | Slot end (= start + duration) |
| status | enum `appointment_status` | `CONFIRMED` \| `CANCELLED` |
| reason_for_visit | VARCHAR(200) | Required |
| additional_notes | VARCHAR(500) NULL | Optional |
| cancelled_at | TIMESTAMPTZ NULL | Set when status becomes `CANCELLED` |
| created_at / updated_at | TIMESTAMPTZ | |

**Constraints**

- `UNIQUE (doctor_id, starts_at) WHERE status = 'CONFIRMED'` — prevents double-booking
- Indexes on `(patient_id, starts_at)`, `(doctor_id, starts_at)`, `status`

The uniqueness rule is a **partial** index. Cancelled rows are retained for
audit, so they keep occupying `(doctor_id, starts_at)`; an unfiltered unique
index would make a freed slot permanently unbookable. Prisma cannot express a
filtered index, so it is created in raw SQL and deliberately absent from
`prisma/models/appointment.prisma` — see the comment on the `Appointment` model.

### appointment_history

One immutable row per post-booking transition. Creation is already recorded by
`appointments.created_at`, so only changes are logged.

| Column | Type | Notes |
|--------|------|--------|
| id | UUID PK | |
| appointment_id | UUID FK → appointments | `ON DELETE CASCADE` |
| event | enum `appointment_history_event` | `RESCHEDULED` \| `CANCELLED` |
| previous_starts_at / previous_ends_at | TIMESTAMPTZ | Slot held before the change |
| new_starts_at / new_ends_at | TIMESTAMPTZ NULL | Null for a cancellation |
| changed_by_user_id | UUID | Actor who made the change |
| changed_by_role | VARCHAR(20) | `patient` today; doctor-initiated changes reuse the table |
| created_at | TIMESTAMPTZ | |

Index on `(appointment_id, created_at)` for chronological playback.

## State transitions

```
                 reschedule (starts_at / ends_at rewritten)
                 ┌───────────┐
                 ▼           │
   [booking] → CONFIRMED ────┘
                 │
                 │ cancel
                 ▼
             CANCELLED   (terminal; row retained, slot freed)
```

Rescheduling deliberately **keeps** the status at `CONFIRMED` rather than
introducing a `RESCHEDULED` state: slot derivation treats `CONFIRMED` as
"booked", so a separate status would make the new slot look free to the next
patient. The move is captured in `appointment_history` instead.

## Cut-off window

Cancel and reschedule share one rule: refused once the appointment starts within
`APPOINTMENT_CANCELLATION_CUTOFF_HOURS` (default `24`; `0` disables it). The same
predicate feeds the `canBeChanged` flag on serialized appointments, so the UI and
the API cannot disagree.

## Slot derivation

Slots are **not stored**. For a doctor + calendar date:

1. Look up `working_hours` for that weekday; if missing or inactive → no slots (Sundays).
2. Generate fixed 1-hour starts from `start_time` inclusive to `end_time` exclusive.
3. Mark a slot `booked` if a `CONFIRMED` appointment exists for that doctor at `starts_at`.
4. Mark past clock times on the current calendar day as non-selectable (`unavailable`).

Cancellations need no extra handling here: step 3 already filters on `CONFIRMED`,
so a cancelled booking releases its slot to both the patient booking grid and the
doctor's weekly calendar.

### payments

| Column | Type | Notes |
|--------|------|--------|
| id | UUID PK | |
| patient_id | UUID FK → patients | |
| razorpay_order_id | VARCHAR(64) UNIQUE | Razorpay order id |
| razorpay_payment_id | VARCHAR(64) UNIQUE NULL | Set after capture |
| amount_in_paise | INT | Server-computed fee |
| currency | VARCHAR(3) | Default `INR` |
| status | enum `payment_status` | `CREATED` \| `CAPTURED` \| `FAILED` |
| doctor_id | UUID | Booking draft |
| appointment_date | VARCHAR(10) | `YYYY-MM-DD` draft |
| start_time | VARCHAR(5) | `HH:mm` draft |
| reason_for_visit / additional_notes | | Copied into appointment on capture |
| appointment_id | UUID UNIQUE NULL FK → appointments | Set after successful pay |
| created_at / updated_at | TIMESTAMPTZ | |

Appointment is created only after payment is `CAPTURED` (verify path or webhook).

## Field length constraints

| Field | Max | Enforced |
|-------|-----|----------|
| reason_for_visit | 200 | DB + Zod (UI & API) |
| additional_notes | 500 | DB + Zod (UI & API) |

## Migration

`prisma/migrations/20260725050000_add_appointment_booking/`  
`prisma/migrations/20260725090000_add_payments/`  
`prisma/migrations/20260815000000_add_appointment_cancellation_rescheduling/`
