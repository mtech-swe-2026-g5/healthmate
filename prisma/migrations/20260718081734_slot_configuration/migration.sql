-- CreateTable
CREATE TABLE "slot_configurations" (
    "id" UUID NOT NULL,
    "doctor_id" UUID,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_slot_config_lookup" ON "slot_configurations"("doctor_id", "valid_from", "valid_until", "active");

-- AddForeignKey
ALTER TABLE "slot_configurations" ADD CONSTRAINT "slot_configurations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
