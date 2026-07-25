-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('CREATED', 'CAPTURED', 'FAILED');

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patient_id" UUID NOT NULL,
    "razorpay_order_id" VARCHAR(64) NOT NULL,
    "razorpay_payment_id" VARCHAR(64),
    "amount_in_paise" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "payment_status" NOT NULL DEFAULT 'CREATED',
    "doctor_id" UUID NOT NULL,
    "appointment_date" VARCHAR(10) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "reason_for_visit" VARCHAR(200) NOT NULL,
    "additional_notes" VARCHAR(500),
    "appointment_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_appointment_id_key" ON "payments"("appointment_id");

-- CreateIndex
CREATE INDEX "payments_patient_id_idx" ON "payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
