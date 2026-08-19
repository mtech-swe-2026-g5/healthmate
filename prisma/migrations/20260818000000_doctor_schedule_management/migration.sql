-- Doctor schedule settings on profile
ALTER TABLE "doctors"
  ADD COLUMN "accepting_new_patients" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "buffer_minutes" SMALLINT NOT NULL DEFAULT 15,
  ADD COLUMN "slot_duration_minutes" SMALLINT NOT NULL DEFAULT 60;

-- Optional session label on recurring windows
ALTER TABLE "slot_configurations"
  ADD COLUMN "label" VARCHAR(80);

-- Blocked dates, breaks, and time off
CREATE TYPE "schedule_block_type" AS ENUM ('TIME_OFF', 'BREAK');

CREATE TABLE "schedule_blocks" (
  "id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "reason" VARCHAR(120),
  "block_type" "schedule_block_type" NOT NULL DEFAULT 'TIME_OFF',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "schedule_blocks_doctor_id_starts_at_ends_at_idx"
  ON "schedule_blocks"("doctor_id", "starts_at", "ends_at");

ALTER TABLE "schedule_blocks"
  ADD CONSTRAINT "schedule_blocks_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
