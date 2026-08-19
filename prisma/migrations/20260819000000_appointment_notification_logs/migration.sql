CREATE TYPE "appointment_notification_type" AS ENUM (
  'ACTION_BOOKED',
  'ACTION_CANCELLED',
  'ACTION_RESCHEDULED',
  'REMINDER_8AM',
  'REMINDER_60MIN',
  'REMINDER_30MIN'
);

CREATE TYPE "appointment_notification_status" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED'
);

CREATE TABLE "appointment_notification_logs" (
  "id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "recipient_user_id" UUID NOT NULL,
  "notification_type" "appointment_notification_type" NOT NULL,
  "dedupe_key" VARCHAR(120) NOT NULL,
  "status" "appointment_notification_status" NOT NULL DEFAULT 'PENDING',
  "error_message" VARCHAR(500),
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointment_notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_notification_once"
  ON "appointment_notification_logs"("appointment_id", "recipient_user_id", "notification_type", "dedupe_key");

CREATE INDEX "appointment_notification_logs_notification_type_status_created_at_idx"
  ON "appointment_notification_logs"("notification_type", "status", "created_at");

CREATE INDEX "appointment_notification_logs_recipient_user_id_created_at_idx"
  ON "appointment_notification_logs"("recipient_user_id", "created_at");

ALTER TABLE "appointment_notification_logs"
  ADD CONSTRAINT "appointment_notification_logs_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_notification_logs"
  ADD CONSTRAINT "appointment_notification_logs_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
