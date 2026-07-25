-- Align existing WIP booking tables with HAS7 schema.
-- (doctors / appointments / appointment_status already existed in a partial form)

-- doctors: add specialty + active flag required by MVP listing
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "specialization" VARCHAR(120);
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "doctors" SET "specialization" = 'General Physician' WHERE "specialization" IS NULL;
ALTER TABLE "doctors" ALTER COLUMN "specialization" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "doctors_specialization_idx" ON "doctors"("specialization");
CREATE INDEX IF NOT EXISTS "doctors_is_active_idx" ON "doctors"("is_active");

-- appointments: rename time columns and add booking fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'start_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE "appointments" RENAME COLUMN "start_time" TO "starts_at";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'end_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE "appointments" RENAME COLUMN "end_time" TO "ends_at";
  END IF;
END $$;

-- Ensure enum exists (may already be present from prior WIP)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE "appointment_status" AS ENUM ('CONFIRMED');
  END IF;
END $$;

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booking_reference" VARCHAR(20);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "status" "appointment_status" NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reason_for_visit" VARCHAR(200);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "additional_notes" VARCHAR(500);

UPDATE "appointments"
SET
  "booking_reference" = COALESCE(
    "booking_reference",
    'HM-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 6))
  ),
  "reason_for_visit" = COALESCE("reason_for_visit", 'General consultation')
WHERE "booking_reference" IS NULL OR "reason_for_visit" IS NULL;

ALTER TABLE "appointments" ALTER COLUMN "booking_reference" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "reason_for_visit" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_booking_reference_key"
  ON "appointments"("booking_reference");
CREATE INDEX IF NOT EXISTS "appointments_patient_id_starts_at_idx"
  ON "appointments"("patient_id", "starts_at");
CREATE INDEX IF NOT EXISTS "appointments_doctor_id_starts_at_idx"
  ON "appointments"("doctor_id", "starts_at");
CREATE INDEX IF NOT EXISTS "appointments_status_idx"
  ON "appointments"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_doctor_id_starts_at_key"
  ON "appointments"("doctor_id", "starts_at");

-- Global working hours (MVP defaults). Prior WIP used slot_configurations; left in place unused.
CREATE TABLE IF NOT EXISTS "working_hours" (
    "id" SMALLINT GENERATED ALWAYS AS IDENTITY,
    "day_of_week" SMALLINT NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "slot_duration_minutes" SMALLINT NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "working_hours_day_of_week_key"
  ON "working_hours"("day_of_week");
