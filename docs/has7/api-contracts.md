# HAS7 — Appointment Booking API Contracts

Embed under the API contracts Confluence page after review.

Base URL: `/api`  
Auth: Auth.js session cookie (middleware returns `401` when unauthenticated).  
Patient role required for create/list/get appointment endpoints and payment create/verify.

Booking wizard flow: Search → Schedule → Details → **Payment (Razorpay)** → Confirm.
Appointment `POST` still exists for internal/fulfillment use; the UI creates appointments via payment verify after Checkout succeeds.

Post-booking changes: `PATCH /api/appointments/{id}/cancel` and
`PATCH /api/appointments/{id}/reschedule`. Both obey the same cut-off window
(`APPOINTMENT_CANCELLATION_CUTOFF_HOURS`, default `24`) and dispatch email to
the patient and the doctor asynchronously after the response is flushed.

---

## GET `/api/doctors`

List active doctors for booking.

**Response `200`**

```json
{
  "doctors": [
    {
      "id": "uuid",
      "firstName": "Ananya",
      "lastName": "Patel",
      "specialization": "General Physician"
    }
  ]
}
```

---

## GET `/api/doctors/{id}/slots?date=YYYY-MM-DD`

Derive 1-hour slots for a doctor on a calendar date.

**Query**

| Param | Required | Notes |
|-------|----------|--------|
| date | yes | `YYYY-MM-DD`; Sundays / past dates rejected |

**Response `200`**

```json
{
  "date": "2026-07-27",
  "slots": [
    { "startTime": "11:00", "endTime": "12:00", "status": "available" },
    { "startTime": "12:00", "endTime": "13:00", "status": "booked" },
    { "startTime": "13:00", "endTime": "14:00", "status": "unavailable" }
  ]
}
```

| Status | Meaning |
|--------|---------|
| `available` | Selectable |
| `booked` | Confirmed appointment exists |
| `unavailable` | Past clock time on today |

**Errors:** `400` invalid/Sunday/past date, `404` doctor not found.

---

## POST `/api/appointments`

Create a confirmed appointment.

**Body**

```json
{
  "doctorId": "uuid",
  "date": "2026-07-27",
  "startTime": "14:00",
  "reasonForVisit": "Annual checkup",
  "additionalNotes": "Prefer morning follow-up"
}
```

| Field | Rules |
|-------|--------|
| reasonForVisit | required, trim, max 200 |
| additionalNotes | optional, trim, max 500 |

**Response `201`**

```json
{
  "appointment": {
    "id": "uuid",
    "bookingReference": "HM-A1B2C3",
    "startsAt": "2026-07-27T08:30:00.000Z",
    "endsAt": "2026-07-27T09:30:00.000Z",
    "status": "CONFIRMED",
    "reasonForVisit": "Annual checkup",
    "additionalNotes": "Prefer morning follow-up",
    "doctor": {
      "id": "uuid",
      "firstName": "Ananya",
      "lastName": "Patel",
      "specialization": "General Physician"
    },
    "timing": "upcoming",
    "canBeChanged": true
  }
}
```

| Field | Meaning |
|-------|---------|
| `status` | `CONFIRMED` \| `CANCELLED` |
| `timing` | `upcoming` when `startsAt` is in the future |
| `canBeChanged` | Server verdict: `CONFIRMED` **and** outside the cut-off window. The UI shows cancel/reschedule only when true, so the rule lives in one place. |

**Errors:** `400` validation / unavailable slot, `403` non-patient, `404` doctor/patient, `409` slot already booked.

---

## GET `/api/appointments`

List the authenticated patient’s appointments.

Cancelled appointments are included — the record is retained for audit — and are
distinguished by `status: "CANCELLED"`. They stay in the `upcoming` bucket while
their original start time is still in the future.

**Response `200`**

```json
{
  "upcoming": [ /* appointment objects */ ],
  "past": [ /* appointment objects */ ]
}
```

---

## GET `/api/appointments/{id}`

Booking confirmation / detail for an appointment owned by the patient.

**Response `200`:** `{ "appointment": { ... } }`  
**Errors:** `403`, `404`

---

## PATCH `/api/appointments/{id}/cancel`

Cancel a confirmed appointment owned by the authenticated patient.

No request body. The record is **never deleted**: `status` becomes `CANCELLED`,
`cancelled_at` is stamped, and an `appointment_history` row is written in the
same transaction. Because the double-booking index only covers `CONFIRMED` rows,
the slot is bookable by anyone else the moment this commits.

On success, cancellation email is dispatched asynchronously to both the patient
and the doctor (`cancelledBy: "patient"`).

> **Known gap — refunds.** The consultation fee is collected up front via
> Razorpay. Cancelling does **not** refund it: the `payments` row stays
> `CAPTURED` and keeps pointing at the now-cancelled appointment. Neither story
> covers refunds, so this is deliberately deferred to a separate story (which
> would add a `REFUNDED` payment status, a Razorpay refunds call, and refund
> webhook handling).

**Response `200`:** `{ "appointment": { …, "status": "CANCELLED", "canBeChanged": false } }`

| Status | Cause |
|--------|-------|
| `400` | Inside the cut-off window (default: within 24 h of the start time) |
| `401` | No session |
| `403` | Non-patient role |
| `404` | Appointment not found, or not owned by this patient |
| `409` | Already cancelled, or a concurrent request changed it first |

---

## PATCH `/api/appointments/{id}/reschedule`

Move a confirmed appointment to a different slot **with the same doctor**.

**Body**

```json
{
  "date": "2027-03-01",
  "startTime": "14:00"
}
```

| Field | Rules |
|-------|--------|
| date | `YYYY-MM-DD`, must exist on the calendar |
| startTime | `HH:mm`, must be an `available` slot from `GET /api/doctors/{id}/slots` |

The appointment keeps its id, booking reference, reason, notes, and `CONFIRMED`
status; only `starts_at` / `ends_at` / `updated_at` change, and the move is
recorded in `appointment_history`. The original slot is freed by the same
update. Reschedule email is dispatched asynchronously to both parties and
carries the previous slot.

**Concurrency:** the update is guarded on the `status` and `starts_at` the
request read (optimistic locking), and the partial unique index on
`(doctor_id, starts_at) WHERE status = 'CONFIRMED'` rejects two patients landing
on the same slot. Both raise `409`.

**Response `200`:** `{ "appointment": { … } }`

| Status | Cause |
|--------|-------|
| `400` | Validation, slot outside the doctor's schedule, slot not selectable, same slot as now, or inside the cut-off window |
| `401` | No session |
| `403` | Non-patient role |
| `404` | Appointment not found, or not owned by this patient |
| `409` | Target slot booked, appointment already cancelled, or a concurrent change won the race |

---

## POST `/api/payments/create-order`

Create a Razorpay order for the consultation fee and store a `CREATED` payment draft.

**Auth:** patient session required.

**Body**

```json
{
  "doctorId": "uuid",
  "date": "2026-07-27",
  "startTime": "14:00",
  "reasonForVisit": "Annual checkup",
  "additionalNotes": "optional"
}
```

**Response `201`**

```json
{
  "orderId": "order_xxx",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_xxx",
  "feeInr": 500
}
```

Amount is always computed server-side from `CONSULTATION_FEE_INR` (never from the client).

---

## POST `/api/payments/verify`

Verify Checkout HMAC signature, re-check slot availability, create `CONFIRMED` appointment, mark payment `CAPTURED`.

**Body**

```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "…"
}
```

**Response `200`:** `{ "appointment": { … }, "alreadyCaptured": false }`

---

## POST `/api/payments/webhook`

Razorpay webhook (no session). Authenticated via `X-Razorpay-Signature` + `RAZORPAY_WEBHOOK_SECRET`.

Handles `payment.captured` (idempotent fulfill) and `payment.failed`.

