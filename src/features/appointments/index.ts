export {
  BookingWizard,
  AppointmentsList,
  ConfirmationView,
  AppointmentDetailView,
  AppointmentActions,
  RescheduleView,
  PatientPortalShell,
  DoctorCardGrid,
  SlotCalendar,
  SlotGrid,
  AppointmentDetailsForm,
  StepIndicator,
} from "./components";

export {
  useDoctors,
  useSlots,
  useBookingWizard,
  useCancelAppointment,
  useRescheduleAppointment,
} from "./hooks";
export type { BookingWizardState } from "./hooks";

export {
  listActiveDoctors,
  getActiveDoctor,
  generateSlots,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
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
export {
  buildCutoffMessage,
  getCancellationCutoffHours,
  hasCancellationCutoffPassed,
} from "./lib/cancellation-window";
export {
  CANCELLED_STATUS,
  excludeCancelled,
  getAppointmentPresentation,
  isCancelled,
} from "./lib/appointment-status";
export type { AppointmentPresentation } from "./lib/appointment-status";
export type { DoctorListItem } from "./types/doctor";

export {
  appointmentDetailsSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  slotsQuerySchema,
  DATE_REGEX,
  TIME_REGEX,
} from "./types";
export type {
  AppointmentDetailsInput,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
} from "./types";

export {
  BOOKING_STEPS,
  SLOT_STATUSES,
  DEFAULT_CANCELLATION_CUTOFF_HOURS,
} from "./constants";
export type { BookingStepId, SlotStatus } from "./constants";
