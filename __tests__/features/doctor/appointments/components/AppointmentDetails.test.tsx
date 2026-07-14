import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import AppointmentDetails from '@/features/doctor/appointments/components/AppointmentDetails';
import { Patient } from '@/features/doctor/appointments/types/response';

describe('AppointmentDetails', () => {
  beforeEach(() => {
    // Setup before each test
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

  it('should render empty fragment when patient is null', () => {
    const { container } = render(<AppointmentDetails patient={null} />);
    // Empty fragment renders as an empty div
    expect(container.querySelector('table')).toBeNull();
  });

  it('should render patient details table when patient is provided', () => {
    render(<AppointmentDetails patient={mockPatient} />);
    
    expect(screen.getByText(`${mockPatient.firstName} ${mockPatient.lastName}`)).toBeDefined();
    expect(screen.getByText(mockPatient.age.toString())).toBeDefined();
    expect(screen.getByText(mockPatient.gender)).toBeDefined();
    expect(screen.getByText(mockPatient.bloodGroup)).toBeDefined();
    expect(screen.getByText(mockPatient.phoneNumber)).toBeDefined();
  });

  it('should render table with all required rows', () => {
    const { container } = render(<AppointmentDetails patient={mockPatient} />);
    const rows = container.querySelectorAll('tr');
    
    expect(rows.length).toBe(5);
    expect(rows[0].textContent).toContain('Name');
    expect(rows[1].textContent).toContain('Age');
    expect(rows[2].textContent).toContain('Gender');
    expect(rows[3].textContent).toContain('Blood Group');
    expect(rows[4].textContent).toContain('Phone Number');
  });

  it('should render table with correct patient data in cells', () => {
    const { container } = render(<AppointmentDetails patient={mockPatient} />);
    const cells = container.querySelectorAll('td');
    
    expect(cells[1].textContent).toBe(`${mockPatient.firstName} ${mockPatient.lastName}`);
    expect(cells[3].textContent).toBe(mockPatient.age.toString());
    expect(cells[5].textContent).toBe(mockPatient.gender);
    expect(cells[7].textContent).toBe(mockPatient.bloodGroup);
    expect(cells[9].textContent).toBe(mockPatient.phoneNumber);
  });

  it('should handle patient with different blood group', () => {
    const patientWithAB = { ...mockPatient, bloodGroup: 'AB-' as Patient['bloodGroup'] };
    render(<AppointmentDetails patient={patientWithAB} />);
    
    expect(screen.getByText('AB-')).toBeDefined();
  });

  it('should handle patient with different gender', () => {
    const patientFemale = { ...mockPatient, gender: 'female' as Patient['gender'] };
    render(<AppointmentDetails patient={patientFemale} />);
    
    expect(screen.getByText('female')).toBeDefined();
  });

  it('should format full name correctly', () => {
    const patientWithDifferentName = {
      ...mockPatient,
      firstName: 'Jane',
      lastName: 'Smith',
    };
    render(<AppointmentDetails patient={patientWithDifferentName} />);
    
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });
});
