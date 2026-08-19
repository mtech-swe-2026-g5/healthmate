import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PatientAppointments from "@/features/doctor/appointments/components/PatientAppointments";
import { Appointment } from "@/features/doctor/appointments/types/response";
import * as AppointmentsHookModule from "@/features/doctor/appointments/hooks/use-appointments";
import * as SlotConfigurationsHookModule from "@/features/doctor/appointments/hooks/use-slot-configurations";
import type { DoctorCalendarEvent } from "@/features/doctor/calendar/types";
import { SlotConfigurationModel } from "@/lib/prisma";
import { UseQueryResult } from "@tanstack/react-query";

const mockAppointments: Appointment[] = [
  {
    id: "apt1",
    patient: {
      id: "pat1",
      firstName: "John",
      lastName: "Doe",
      age: 30,
      gender: "male",
      phoneNumber: "+1234567890",
      bloodGroup: "O+",
    },
    start: new Date("2026-07-14T10:00:00"),
    end: new Date("2026-07-14T11:00:00"),
  },
  {
    id: "apt2",
    patient: {
      id: "pat2",
      firstName: "Jane",
      lastName: "Smith",
      age: 28,
      gender: "female",
      phoneNumber: "+9876543210",
      bloodGroup: "A+",
    },
    start: new Date("2026-07-14T14:00:00"),
    end: new Date("2026-07-14T15:00:00"),
  },
];

vi.mock("@/features/doctor/appointments/hooks/use-appointments", () => ({
  default: vi.fn(() => ({
    data: mockAppointments,
    isFetched: true,
  })),
}));

const mockSlotConfigurations: SlotConfigurationModel[] = [
  {
    id: "slot-1",
    doctorId: "doc123",
    dayOfWeek: 1,
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
    timezone: "Asia/Kolkata",
    validFrom: new Date("2026-01-01T00:00:00.000Z"),
    validUntil: null,
    active: true,
    label: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock("@/features/doctor/appointments/hooks/use-slot-configurations", () => ({
  default: vi.fn(() => ({
    data: mockSlotConfigurations,
    isFetched: true,
  })),
}));

vi.mock("@/features/doctor/calendar/components/DoctorWeekCalendar", () => ({
  DoctorWeekCalendar: vi.fn(
    ({
      events,
      onWeekChange,
      onEventSelect,
      isLoading,
      className,
      slotConfigurations,
    }) => (
      <div data-testid="doctor-week-calendar-mock" className={className}>
        <div data-testid="calendar-loading">
          {isLoading ? "Loading" : "Loaded"}
        </div>
        <div data-testid="calendar-events-count">{events?.length || 0}</div>
        <div data-testid="calendar-slot-configurations-count">
          {slotConfigurations?.length || 0}
        </div>
        <div data-testid="calendar-slot-configuration-day">
          {slotConfigurations?.[0]?.dayOfWeek}
        </div>
        <div data-testid="calendar-slot-configuration-valid-from">
          {slotConfigurations?.[0]?.validFrom ? "set" : "unset"}
        </div>
        <div data-testid="calendar-slot-configuration-valid-until">
          {slotConfigurations?.[0]?.validUntil ? "set" : "unset"}
        </div>
        {events?.map((event: DoctorCalendarEvent) => (
          <div
            key={event.id}
            data-testid={`calendar-event-${event.id}`}
            onClick={() => onEventSelect?.(event)}
          >
            {event.title}
          </div>
        ))}
        <button
          data-testid="range-change-btn"
          onClick={() => {
            const newStart = new Date("2026-07-15");
            const newEnd = new Date("2026-07-16");
            onWeekChange?.(newStart, newEnd);
          }}
        >
          Change Range
        </button>
        <button
          data-testid="select-unknown-event-btn"
          onClick={() =>
            onEventSelect?.({
              id: "non-existent-id",
              title: "Unknown",
              start: new Date(),
              end: new Date(),
              variant: "appointment",
            })
          }
        >
          Select Unknown Event
        </button>
      </div>
    ),
  ),
}));

vi.mock("@/features/doctor/appointments/components/AppointmentModel", () => ({
  default: vi.fn(({ patient, isModelOpen, onClose }) => (
    <div data-testid="appointment-model-mock">
      {isModelOpen && <div data-testid="model-open">Model Open</div>}
      {patient && (
        <div data-testid="model-patient">
          {patient.firstName} {patient.lastName}
        </div>
      )}
      <button data-testid="model-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  )),
}));

describe("PatientAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render DoctorWeekCalendar component", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("doctor-week-calendar-mock")).toBeDefined();
  });

  it("should render AppointmentModel component", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("appointment-model-mock")).toBeDefined();
  });

  it("should call useAppointments hook with correct parameters", () => {
    render(<PatientAppointments doctorId="doc123" />);

    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);
    expect(useAppointmentsMock).toHaveBeenCalledWith(
      "doc123",
      expect.any(Date),
      expect.any(Date),
    );

    const [, startDate] = useAppointmentsMock.mock.calls[0] as [
      string,
      Date,
      Date,
    ];
    expect(startDate.getDay()).toBe(0);
  });

  it("should call useSlotConfigurations hook with correct parameters", () => {
    render(<PatientAppointments doctorId="doc123" />);

    const useSlotConfigurationsMock = vi.mocked(
      SlotConfigurationsHookModule.default,
    );
    expect(useSlotConfigurationsMock).toHaveBeenCalledWith(
      "doc123",
      expect.any(Date),
      expect.any(Date),
    );
  });

  it("should transform appointments to calendar events", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-events-count").textContent).toBe("2");
  });

  it("should transform slot configurations for the calendar", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(
      screen.getByTestId("calendar-slot-configurations-count").textContent,
    ).toBe("1");
    expect(
      screen.getByTestId("calendar-slot-configuration-day").textContent,
    ).toBe("1");
    expect(
      screen.getByTestId("calendar-slot-configuration-valid-from").textContent,
    ).toBe("set");
    expect(
      screen.getByTestId("calendar-slot-configuration-valid-until").textContent,
    ).toBe("unset");
  });

  it("should transform a slot configuration without validFrom and with validUntil", () => {
    const useSlotConfigurationsMock = vi.mocked(
      SlotConfigurationsHookModule.default,
    );
    useSlotConfigurationsMock.mockReturnValueOnce({
      data: [
        {
          ...mockSlotConfigurations[0],
          validFrom: null as unknown as Date,
          validUntil: new Date("2026-12-31T23:59:59.999Z"),
        },
      ],
      isFetched: true,
    } as UseQueryResult<NoInfer<SlotConfigurationModel[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(
      screen.getByTestId("calendar-slot-configuration-valid-from").textContent,
    ).toBe("unset");
    expect(
      screen.getByTestId("calendar-slot-configuration-valid-until").textContent,
    ).toBe("set");
  });

  it("should handle undefined slot configuration data gracefully", () => {
    const useSlotConfigurationsMock = vi.mocked(
      SlotConfigurationsHookModule.default,
    );
    useSlotConfigurationsMock.mockReturnValueOnce({
      data: undefined as unknown as SlotConfigurationModel[],
      isFetched: true,
    } as UseQueryResult<NoInfer<SlotConfigurationModel[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(
      screen.getByTestId("calendar-slot-configurations-count").textContent,
    ).toBe("0");
  });

  it("should show loading state when slot configurations have not been fetched yet", () => {
    const useSlotConfigurationsMock = vi.mocked(
      SlotConfigurationsHookModule.default,
    );
    useSlotConfigurationsMock.mockReturnValueOnce({
      data: [] as SlotConfigurationModel[],
      isFetched: false,
    } as UseQueryResult<NoInfer<SlotConfigurationModel[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-loading").textContent).toBe("Loading");
  });

  it("should display appointment titles with patient names", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Jane Smith")).toBeDefined();
  });

  it("should open model when appointment is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    // Initially model open div should not exist
    expect(screen.queryByTestId("model-open")).toBeNull();

    // Click on first appointment
    await user.click(screen.getByTestId("calendar-event-apt1"));

    // Model should now be open
    await waitFor(
      () => {
        expect(screen.getByTestId("model-open")).toBeDefined();
      },
      { timeout: 1000 },
    );
  });

  it("should display correct patient in model when appointment is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    await user.click(screen.getByTestId("calendar-event-apt1"));

    await waitFor(
      () => {
        const patientElement = screen.queryByTestId("model-patient");
        expect(patientElement).toBeDefined();
        expect(patientElement?.textContent).toContain("John Doe");
      },
      { timeout: 1000 },
    );
  });

  it("should switch patient details when different appointment is clicked", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    // Click first appointment
    await user.click(screen.getByTestId("calendar-event-apt1"));
    await waitFor(
      () => {
        const patientElement = screen.queryByTestId("model-patient");
        expect(patientElement?.textContent).toContain("John Doe");
      },
      { timeout: 1000 },
    );

    // Click second appointment
    await user.click(screen.getByTestId("calendar-event-apt2"));
    await waitFor(
      () => {
        const patientElement = screen.queryByTestId("model-patient");
        expect(patientElement?.textContent).toContain("Jane Smith");
      },
      { timeout: 1000 },
    );
  });

  it("should close model when onClose is called", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    // Open model
    await user.click(screen.getByTestId("calendar-event-apt1"));
    await waitFor(
      () => {
        expect(screen.getByTestId("model-open")).toBeDefined();
      },
      { timeout: 1000 },
    );

    // Close model
    await user.click(screen.getByTestId("model-close-btn"));
    await waitFor(
      () => {
        expect(screen.queryByTestId("model-open")).toBeNull();
      },
      { timeout: 1000 },
    );
  });

  it("should handle empty appointments list", () => {
    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);
    useAppointmentsMock.mockReturnValueOnce({
      data: [] as Appointment[],
      isFetched: true,
    } as UseQueryResult<NoInfer<Appointment[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-events-count").textContent).toBe("0");
  });

  it("should show loading state", () => {
    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);
    useAppointmentsMock.mockReturnValueOnce({
      data: [] as Appointment[],
      isFetched: false,
    } as UseQueryResult<NoInfer<Appointment[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-loading").textContent).toBe("Loading");
  });

  it("should show loaded state", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-loading").textContent).toBe("Loaded");
  });

  it("should pass calendar event properties correctly", () => {
    render(<PatientAppointments doctorId="doc123" />);

    const eventElement = screen.getByTestId("calendar-event-apt1");
    expect(eventElement.textContent).toBe("John Doe");
  });

  it("should handle range change", async () => {
    const user = userEvent.setup();
    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);

    render(<PatientAppointments doctorId="doc123" />);

    await user.click(screen.getByTestId("range-change-btn"));

    // Verify hook is called again with new dates
    await waitFor(() => {
      expect(useAppointmentsMock).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle undefined appointment data gracefully", () => {
    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);
    useAppointmentsMock.mockReturnValueOnce({
      data: undefined as unknown as Appointment[],
      isFetched: true,
    } as UseQueryResult<NoInfer<Appointment[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-events-count").textContent).toBe("0");
  });

  it("should clear patient details when model is closed", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    // Open model with patient
    await user.click(screen.getByTestId("calendar-event-apt1"));
    await waitFor(
      () => {
        expect(screen.getByTestId("model-patient")).toBeDefined();
      },
      { timeout: 1000 },
    );

    // Close model
    await user.click(screen.getByTestId("model-close-btn"));
    await waitFor(
      () => {
        // After close, model-open div should not exist
        expect(screen.queryByTestId("model-open")).toBeNull();
      },
      { timeout: 1000 },
    );
  });

  it("should not open model when non-existent appointment is clicked", async () => {
    const useAppointmentsMock = vi.mocked(AppointmentsHookModule.default);
    useAppointmentsMock.mockReturnValueOnce({
      data: [] as Appointment[],
      isFetched: true,
    } as UseQueryResult<NoInfer<Appointment[]>, Error>);

    render(<PatientAppointments doctorId="doc123" />);

    // No appointments to click, so model should not open
    expect(screen.queryByTestId("model-open")).toBeNull();
  });

  it("should not open model when the selected event id does not match any appointment", async () => {
    const user = userEvent.setup();
    render(<PatientAppointments doctorId="doc123" />);

    await user.click(screen.getByTestId("select-unknown-event-btn"));

    expect(screen.queryByTestId("model-open")).toBeNull();
    expect(screen.queryByTestId("model-patient")).toBeNull();
  });
});
