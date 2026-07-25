import { useQuery } from "@tanstack/react-query";
import { SlotConfigurationModel } from "@/lib/prisma";

export default function useSlotConfigurations(
  doctorId: string,
  dateFrom: Date,
  dateUntil: Date,
) {
  return useQuery({
    queryKey: ["doctorSlotConfigurations", doctorId, dateFrom, dateUntil],
    queryFn: () => querySlotConfigurations(doctorId, dateFrom, dateUntil),
  });

  async function querySlotConfigurations(
    doctorId: string,
    dateFrom: Date,
    dateUntil: Date,
  ): Promise<SlotConfigurationModel[]> {
    const res = await fetch(
      `/api/doctor/appointments/slots?doctorId=${doctorId}&dateFrom=${dateFrom.toISOString()}&dateUntil=${dateUntil.toISOString()}`,
    );
    const data = (await res.json()) as { slots: SlotConfigurationModel[] };
    return data.slots;
  }
}
