import {
  GetAppointmentSlotRequest,
  getAppointmentSlotSchema,
} from "@/features/doctor/appointments/types/request";
import { AppointmentSlotsResponse } from "@/features/doctor/appointments/types/response";
import { prisma, SlotConfigurationModel } from "@/lib/prisma";
import { DateTime } from "luxon";

export async function getSlotConfigurationByDoctor(
  request: GetAppointmentSlotRequest,
): Promise<AppointmentSlotsResponse | null> {
  const validatedRequest = getAppointmentSlotSchema.parse(request);
  const slotConfigurations = await getAppointmentSlotFor(validatedRequest);
  return toHateosResponse(validatedRequest, slotConfigurations);
}

async function getAppointmentSlotFor(
  validatedRequest: GetAppointmentSlotRequest,
): Promise<SlotConfigurationModel[]> {
  return prisma.slotConfiguration.findMany({
    where: {
      AND: [
        {
          active: true,
        },
        {
          OR: [
            {
              doctorId: validatedRequest.doctorId,
            },
            {
              doctorId: null,
            },
          ],
        },
        {
          validFrom: {
            lte: validatedRequest.dateFrom,
          },
        },
        {
          OR: [
            {
              validUntil: {
                gte: validatedRequest.dateUntil,
              },
            },
            {
              validUntil: null,
            },
          ],
        },
      ],
    },
    orderBy: [{ validFrom: "asc" }, { dayOfWeek: "asc" }],
  });
}

function toHateosResponse(
  validatedRequest: GetAppointmentSlotRequest,
  slotConfiguration: SlotConfigurationModel[],
): AppointmentSlotsResponse {
  const currentWeek = DateTime.fromJSDate(validatedRequest.dateFrom).startOf(
    "week",
  );
  const prevWeek = currentWeek.minus({ week: 1 });
  const nextWeek = currentWeek.plus({ week: 1 });

  const baseUrl = `/api/doctor/appointments/slots`;

  return {
    _metadata: {
      links: {
        self: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${validatedRequest.dateFrom.toISOString()}&dateUntil=${validatedRequest.dateUntil.toISOString()}`,
        prevWeek: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${prevWeek.startOf("week").toJSDate().toISOString()}&dateUntil=${prevWeek.endOf("week").toJSDate().toISOString()}`,
        nextWeek: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${nextWeek.startOf("week").toJSDate().toISOString()}&dateUntil=${nextWeek.endOf("week").toJSDate().toISOString()}`,
      },
    },
    slots: slotConfiguration,
  };
}
