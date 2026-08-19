import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DoctorDashboard from "@/features/doctor/appointments/components/DoctorDashboard";

vi.mock(
  "@/features/doctor/appointments/components/DoctorDashboardView",
  () => ({
    DoctorDashboardView: vi.fn(({ doctorId, doctorName, specialization }) => (
      <div data-testid="doctor-dashboard-view-mock">
        {doctorId} · {doctorName} · {specialization}
      </div>
    )),
  }),
);

describe("DoctorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render DoctorDashboardView component", () => {
    render(
      <DoctorDashboard
        doctorId="doc123"
        doctorName="Dr. Smith"
        specialization="Cardiology"
      />,
    );

    expect(screen.getByTestId("doctor-dashboard-view-mock")).toBeDefined();
  });

  it("should pass doctor props to DoctorDashboardView", () => {
    render(
      <DoctorDashboard
        doctorId="doc456"
        doctorName="Dr. Jones"
        specialization="General Physician"
      />,
    );

    expect(
      screen.getByText("doc456 · Dr. Jones · General Physician"),
    ).toBeDefined();
  });

  it("should wrap with QueryClientProvider", () => {
    const { container } = render(
      <DoctorDashboard
        doctorId="doc123"
        doctorName="Dr. Smith"
        specialization="Cardiology"
      />,
    );

    expect(container.firstChild).toBeDefined();
  });
});
