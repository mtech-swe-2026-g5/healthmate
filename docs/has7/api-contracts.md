# HAS7 — Appointment Booking API Contracts

Embed under the API contracts Confluence page after review.

Base URL: `/api`  
Auth: Auth.js session cookie (middleware returns `401` when unauthenticated).  
Patient role required for create/list/get appointment endpoints and payment create/verify.

Booking wizard flow: Search → Schedule → Details → **Payment (Razorpay)** → Confirm.
Appointment `POST` still exists for internal/fulfillment use; the UI creates appointments via payment verify after Checkout succeeds.

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
    "timing": "upcoming"
  }
}
```

**Errors:** `400` validation / unavailable slot, `403` non-patient, `404` doctor/patient, `409` slot already booked.

---

## GET `/api/appointments`

List the authenticated patient’s appointments.

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

