import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/features/auth/services/permissions";
import { createAppointment } from "@/features/appointments/services/appointments";
import { getActiveDoctor } from "@/features/appointments/services/doctors";
import { generateSlots } from "@/features/appointments/services/slots";

import { getConsultationFeeInr, inrToPaise } from "../lib/fee";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayWebhookSecret,
} from "../lib/razorpay-client";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../lib/signature";
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  type CreatePaymentOrderInput,
} from "../types";

export function assertPatientRole(role: string | undefined): void {
  if (!role) throw new Error("Unauthorized");
  requireRole(role, ["patient"]);
}

async function getPatientIdForUser(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }
  return patient.id;
}

async function assertSlotAvailable(
  doctorId: string,
  date: string,
  startTime: string,
): Promise<void> {
  const doctor = await getActiveDoctor(doctorId);
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const slots = await generateSlots(doctorId, date);
  const slot = slots.find((s) => s.startTime === startTime);
  if (!slot) {
    throw new AppError("Invalid time slot for selected date", 400);
  }
  if (slot.status === "booked") {
    throw new AppError("Slot already booked", 409);
  }
  if (slot.status !== "available") {
    throw new AppError("Slot is not available", 400);
  }
}

export async function createPaymentOrder(
  userId: string,
  role: string | undefined,
  rawInput: unknown,
) {
  assertPatientRole(role);
  const input: CreatePaymentOrderInput =
    createPaymentOrderSchema.parse(rawInput);
  const patientId = await getPatientIdForUser(userId);

  await assertSlotAvailable(input.doctorId, input.date, input.startTime);

  const feeInr = getConsultationFeeInr();
  const amountInPaise = inrToPaise(feeInr);
  const razorpay = getRazorpayClient();

  const notes = input.additionalNotes?.trim()
    ? input.additionalNotes.trim()
    : null;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `hm_${Date.now()}`.slice(0, 40),
    notes: {
      doctorId: input.doctorId,
      date: input.date,
      startTime: input.startTime,
      patientId,
    },
  });

  await prisma.payment.create({
    data: {
      patientId,
      razorpayOrderId: order.id,
      amountInPaise,
      currency: "INR",
      status: "CREATED",
      doctorId: input.doctorId,
      appointmentDate: input.date,
      startTime: input.startTime,
      reasonForVisit: input.reasonForVisit.trim(),
      additionalNotes: notes,
    },
  });

  return {
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: getRazorpayKeyId(),
    feeInr,
  };
}

export async function verifyAndCompletePayment(
  userId: string,
  role: string | undefined,
  rawInput: unknown,
) {
  assertPatientRole(role);
  const input = verifyPaymentSchema.parse(rawInput);
  const patientId = await getPatientIdForUser(userId);

  const secret = getRazorpayKeySecret();
  const ok = verifyPaymentSignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
    secret,
  );

  if (!ok) {
    throw new AppError("Invalid payment signature", 400);
  }

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.razorpay_order_id },
  });

  if (!payment || payment.patientId !== patientId) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status === "CAPTURED" && payment.appointmentId) {
    const { getAppointmentForPatient } =
      await import("@/features/appointments/services/appointments");
    return {
      appointment: await getAppointmentForPatient(
        userId,
        role,
        payment.appointmentId,
      ),
      alreadyCaptured: true,
    };
  }

  await assertSlotAvailable(
    payment.doctorId,
    payment.appointmentDate,
    payment.startTime,
  );

  const appointment = await createAppointment(userId, role, {
    doctorId: payment.doctorId,
    date: payment.appointmentDate,
    startTime: payment.startTime,
    reasonForVisit: payment.reasonForVisit,
    additionalNotes: payment.additionalNotes ?? undefined,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "CAPTURED",
      razorpayPaymentId: input.razorpay_payment_id,
      appointmentId: appointment.id,
    },
  });

  return { appointment, alreadyCaptured: false };
}

/**
 * Idempotent fulfillment when payment is already CAPTURED.
 */
async function fulfillCapturedPayment(razorpayOrderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
  });

  if (!payment) return;

  if (payment.status === "CAPTURED" && payment.appointmentId) {
    return;
  }

  const patient = await prisma.patient.findUnique({
    where: { id: payment.patientId },
    select: { userId: true },
  });
  if (!patient) return;

  try {
    await assertSlotAvailable(
      payment.doctorId,
      payment.appointmentDate,
      payment.startTime,
    );
  } catch {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return;
  }

  const appointment = await createAppointment(patient.userId, "patient", {
    doctorId: payment.doctorId,
    date: payment.appointmentDate,
    startTime: payment.startTime,
    reasonForVisit: payment.reasonForVisit,
    additionalNotes: payment.additionalNotes ?? undefined,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "CAPTURED",
      appointmentId: appointment.id,
    },
  });
}

export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string | null,
) {
  if (!signature) {
    throw new AppError("Missing webhook signature", 400);
  }

  const secret = getRazorpayWebhookSecret();
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    throw new AppError("Invalid webhook signature", 400);
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          order_id?: string;
          id?: string;
        };
      };
    };
  };

  if (event.event === "payment.captured") {
    const orderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;
    if (!orderId) return { handled: false };

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });
    if (!payment) return { handled: false };

    if (payment.status === "CAPTURED" && payment.appointmentId) {
      return { handled: true, idempotent: true };
    }

    if (paymentId && !payment.razorpayPaymentId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { razorpayPaymentId: paymentId },
      });
    }

    await fulfillCapturedPayment(orderId);
    return { handled: true };
  }

  if (event.event === "payment.failed") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (!orderId) return { handled: false };

    await prisma.payment.updateMany({
      where: { razorpayOrderId: orderId, status: "CREATED" },
      data: { status: "FAILED" },
    });
    return { handled: true };
  }

  return { handled: false };
}
