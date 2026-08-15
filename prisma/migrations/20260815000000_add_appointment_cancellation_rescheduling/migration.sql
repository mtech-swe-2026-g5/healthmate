-- Appointment cancellation + rescheduling (HAS7 follow-up).
-- Adds the CANCELLED status, a cancellation timestamp, and an audit trail,
-- and replaces the double-booking constraint with a filtered one so a slot
-- freed by a cancellation becomes bookable again.

-- New status. Safe inside Prisma's migration transaction because the value is
-- not referenced anywhere else in this file (Postgres forbids that).
ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ;

-- Cancelled rows are retained for audit, so they keep occupying (doctor_id,
-- starts_at). An unfiltered unique index would therefore make the freed slot
-- permanently unbookable. Restrict uniqueness to live bookings instead.
DROP INDEX IF EXISTS "appointments_doctor_id_starts_at_key";

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_doctor_id_starts_at_confirmed_key"
  ON "appointments"("doctor_id", "starts_at")
  WHERE "status" = 'CONFIRMED';

-- Audit trail: one immutable row per post-booking transition.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_history_event') THEN
    CREATE TYPE "appointment_history_event" AS ENUM ('RESCHEDULED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "appointment_history" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "event" "appointment_history_event" NOT NULL,
    "previous_starts_at" TIMESTAMPTZ NOT NULL,
    "previous_ends_at" TIMESTAMPTZ NOT NULL,
    "new_starts_at" TIMESTAMPTZ,
    "new_ends_at" TIMESTAMPTZ,
    "changed_by_user_id" UUID NOT NULL,
    "changed_by_role" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "appointment_history_appointment_id_created_at_idx"
  ON "appointment_history"("appointment_id", "created_at");

ALTER TABLE "appointment_history"
  DROP CONSTRAINT IF EXISTS "appointment_history_appointment_id_fkey";

ALTER TABLE "appointment_history"
  ADD CONSTRAINT "appointment_history_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
