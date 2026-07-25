export {
  BookingWizard,
  AppointmentsList,
  ConfirmationView,
  AppointmentDetailView,
  PatientPortalShell,
  DoctorCardGrid,
  SlotCalendar,
  SlotGrid,
  AppointmentDetailsForm,
  StepIndicator,
} from "./components";

export { useDoctors, useSlots, useBookingWizard } from "./hooks";
export type { BookingWizardState } from "./hooks";

export {
  listActiveDoctors,
  getActiveDoctor,
  generateSlots,
  createAppointment,
  getAppointmentForPatient,
  listPatientAppointments,
  generateBookingReference,
  serializeAppointment,
} from "./services";

export {
  buildSlotStarts,
  combineDateAndTime,
  addMinutes,
  formatYmd,
  formatHm,
  dayOfWeekFromYmd,
  dateFromYmd,
} from "./lib/date-utils";
export type { TimeSlot } from "./lib/date-utils";
export type { DoctorListItem } from "./types/doctor";

export {
  appointmentDetailsSchema,
  createAppointmentSchema,
  slotsQuerySchema,
  DATE_REGEX,
  TIME_REGEX,
} from "./types";
export type { AppointmentDetailsInput, CreateAppointmentInput } from "./types";

export { BOOKING_STEPS, SLOT_STATUSES } from "./constants";
export type { BookingStepId, SlotStatus } from "./constants";
