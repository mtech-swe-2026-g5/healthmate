import {
  GetAppointmentSlotRequest,
  getAppointmentSlotSchema,
} from "@/features/doctor/appointments/types/request";
import { AppointmentSlotsResponse } from "@/features/doctor/appointments/types/response";
import { prisma, SlotConfigurationModel } from "@/lib/prisma";
import { shiftCalendarWeek } from "@/lib/calendar-week";

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
  const prevWeek = shiftCalendarWeek(validatedRequest.dateFrom, -1);
  const nextWeek = shiftCalendarWeek(validatedRequest.dateFrom, 1);

  const baseUrl = `/api/doctor/appointments/slots`;

  return {
    _metadata: {
      links: {
        self: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${validatedRequest.dateFrom.toISOString()}&dateUntil=${validatedRequest.dateUntil.toISOString()}`,
        prevWeek: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${prevWeek.start.toISOString()}&dateUntil=${prevWeek.end.toISOString()}`,
        nextWeek: `${baseUrl}?doctorId=${validatedRequest.doctorId}&dateFrom=${nextWeek.start.toISOString()}&dateUntil=${nextWeek.end.toISOString()}`,
      },
    },
    slots: slotConfiguration,
  };
}
