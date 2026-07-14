import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import AppointmentModel from '@/features/doctor/appointments/components/AppointmentModel';
import { Patient } from '@/features/doctor/appointments/types/response';
import * as ModelModule from '@/components/ui/Model';

vi.mock('@/components/ui/Model', () => ({
  default: vi.fn(({ title, content, isOpen, onClose }) => (
    <div data-testid="modal-mock">
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-content">{content}</div>
      <div data-testid="modal-is-open">{String(isOpen)}</div>
      <button onClick={onClose} data-testid="modal-close-btn">Close</button>
    </div>
  )),
}));

describe('AppointmentModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    gender: 'male',
    phoneNumber: '+1234567890',
    bloodGroup: 'O+',
  };

  it('should render model component with correct title', () => {
    const onClose = vi.fn();
    render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('modal-title')).toBeDefined();
    expect(screen.getByTestId('modal-title').textContent).toBe('Appointment Details');
  });

  it('should pass patient data to AppointmentDetails', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(container.textContent).toContain(`${mockPatient.firstName} ${mockPatient.lastName}`);
  });

  it('should pass isModelOpen as isOpen to Model component', () => {
    const onClose = vi.fn();
    render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('modal-is-open').textContent).toBe('true');
  });

  it('should pass isModelOpen false to Model component when closed', () => {
    const onClose = vi.fn();
    render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={false}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('modal-is-open').textContent).toBe('false');
  });

  it('should call onClose when Model closes', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    await user.click(screen.getByTestId('modal-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle null patient', () => {
    const onClose = vi.fn();
    render(
      <AppointmentModel 
        patient={null}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('modal-mock')).toBeDefined();
  });

  it('should pass correct props to Model component', () => {
    const onClose = vi.fn();
    render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    const modelMock = vi.mocked(ModelModule.default);
    expect(modelMock).toHaveBeenCalled();
    
    const callArgs = modelMock.mock.calls[0][0];
    expect(callArgs.title).toBe('Appointment Details');
    expect(callArgs.isOpen).toBe(true);
    expect(callArgs.onClose).toBe(onClose);
    expect(callArgs.content).toBeDefined();
  });

  it('should handle patient changes', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <AppointmentModel 
        patient={mockPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('John Doe')).toBeDefined();

    const updatedPatient: Patient = {
      ...mockPatient,
      firstName: 'Jane',
      lastName: 'Smith',
    };

    rerender(
      <AppointmentModel 
        patient={updatedPatient}
        isModelOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Jane Smith')).toBeDefined();
  });
});
