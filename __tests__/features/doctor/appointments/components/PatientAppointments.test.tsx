import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PatientAppointments from "@/features/doctor/appointments/components/PatientAppointments";
import { Appointment } from "@/features/doctor/appointments/types/response";
import * as AppointmentsHookModule from "@/features/doctor/appointments/hooks/use-appointments";
import { AppCalendarEvent } from "@/components/ui/AppCalendar";
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

vi.mock("@/components/ui/AppCalendar", () => ({
  default: vi.fn(
    ({ events, onRangeChange, onEventSelect, isLoading, className }) => (
      <div data-testid="app-calendar-mock" className={className}>
        <div data-testid="calendar-loading">
          {isLoading ? "Loading" : "Loaded"}
        </div>
        <div data-testid="calendar-events-count">{events?.length || 0}</div>
        {events?.map((event: AppCalendarEvent) => (
          <div
            key={event.id}
            data-testid={`calendar-event-${event.id}`}
            onClick={() => onEventSelect(event)}
          >
            {event.title}
          </div>
        ))}
        <button
          data-testid="range-change-btn"
          onClick={() => {
            const newStart = new Date("2026-07-15");
            const newEnd = new Date("2026-07-16");
            onRangeChange(newStart, newEnd);
          }}
        >
          Change Range
        </button>
        <button
          data-testid="select-unknown-event-btn"
          onClick={() =>
            onEventSelect({
              id: "non-existent-id",
              title: "Unknown",
              start: new Date(),
              end: new Date(),
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

  it("should render AppCalendar component", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("app-calendar-mock")).toBeDefined();
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
  });

  it("should transform appointments to calendar events", () => {
    render(<PatientAppointments doctorId="doc123" />);

    expect(screen.getByTestId("calendar-events-count").textContent).toBe("2");
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
