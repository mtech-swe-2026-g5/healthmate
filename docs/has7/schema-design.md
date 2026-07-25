# HAS7 — Appointment Booking Schema Design

Embed under the HAS7 epic page in Confluence after review.

## Overview

Patient appointment booking adds three domain tables on top of the existing identity model (`users`, `patients`, `roles`):

- **doctors** — clinical profile 1:1 with a `users` row (`role = doctor`)
- **working_hours** — global clinic hours used to derive bookable slots
- **appointments** — confirmed bookings with a human-readable booking reference

```
users 1──1 patients 1──* appointments *──1 doctors 1──1 users
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
| starts_at | TIMESTAMPTZ | Slot start |
| ends_at | TIMESTAMPTZ | Slot end (= start + duration) |
| status | enum `appointment_status` | MVP: `CONFIRMED` only |
| reason_for_visit | VARCHAR(200) | Required |
| additional_notes | VARCHAR(500) NULL | Optional |
| created_at / updated_at | TIMESTAMPTZ | |

**Constraints**

- `UNIQUE (doctor_id, starts_at)` — prevents double-booking the same slot
- Indexes on `(patient_id, starts_at)`, `(doctor_id, starts_at)`, `status`

## Slot derivation

Slots are **not stored**. For a doctor + calendar date:

1. Look up `working_hours` for that weekday; if missing or inactive → no slots (Sundays).
2. Generate fixed 1-hour starts from `start_time` inclusive to `end_time` exclusive.
3. Mark a slot `booked` if a `CONFIRMED` appointment exists for that doctor at `starts_at`.
4. Mark past clock times on the current calendar day as non-selectable (`unavailable`).

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
