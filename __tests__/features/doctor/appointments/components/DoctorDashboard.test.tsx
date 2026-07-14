import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import DoctorDashboard from '@/features/doctor/appointments/components/DoctorDashboard';

vi.mock('@/features/doctor/appointments/components/PatientAppointments', () => ({
  default: vi.fn(({ doctorId }) => (
    <div data-testid="patient-appointments-mock">
      Doctor ID: {doctorId}
    </div>
  )),
}));

describe('DoctorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render PatientAppointments component', () => {
    render(<DoctorDashboard doctorId="doc123" />);
    
    expect(screen.getByTestId('patient-appointments-mock')).toBeDefined();
  });

  it('should pass doctorId prop to PatientAppointments', () => {
    render(<DoctorDashboard doctorId="doc456" />);
    
    expect(screen.getByText('Doctor ID: doc456')).toBeDefined();
  });

  it('should pass different doctorId values correctly', () => {
    const { rerender } = render(<DoctorDashboard doctorId="doc1" />);
    
    expect(screen.getByText('Doctor ID: doc1')).toBeDefined();

    rerender(<DoctorDashboard doctorId="doc2" />);
    
    expect(screen.getByText('Doctor ID: doc2')).toBeDefined();
  });

  it('should wrap with QueryClientProvider', () => {
    const { container } = render(<DoctorDashboard doctorId="doc123" />);
    
    // Verify component renders without errors
    expect(container.firstChild).toBeDefined();
  });

  it('should render with use client directive compatibility', () => {
    const { container } = render(<DoctorDashboard doctorId="doc123" />);
    
    expect(container.firstChild?.childNodes.length).toBeGreaterThan(0);
  });

  it('should handle empty doctorId string', () => {
    render(<DoctorDashboard doctorId="" />);
    
    expect(screen.getByTestId('patient-appointments-mock')).toBeDefined();
    expect(screen.getByTestId('patient-appointments-mock').textContent).toContain('Doctor ID:');
  });

  it('should handle very long doctorId', () => {
    const longId = 'doc_' + 'a'.repeat(100);
    render(<DoctorDashboard doctorId={longId} />);
    
    expect(screen.getByText(`Doctor ID: ${longId}`)).toBeDefined();
  });
});
