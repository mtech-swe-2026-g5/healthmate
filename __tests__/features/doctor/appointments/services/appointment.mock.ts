import { faker } from "@faker-js/faker/locale/en";

// Mock data
const mockDoctor1 = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  firstName: "Dr. John",
  lastName: "Doe",
  gender: "male",
  phoneNumber: "+1234567890",
  profilePictureUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoctor2 = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  firstName: "Dr. John",
  lastName: "Doe",
  gender: "male",
  phoneNumber: "+1234567890",
  profilePictureUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPatient1 = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  firstName: "Jane",
  lastName: "Smith",
  dateOfBirth: new Date("1990-05-20"),
  gender: "female",
  phoneNumber: "+919876543210",
  profilePictureUrl: null,
  bloodGroup: "O+",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPatient2 = {
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1985-03-15"),
  gender: "male",
  phoneNumber: "+919876543211",
  profilePictureUrl: null,
  bloodGroup: "A+",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAppointment1 = {
  id: faker.string.uuid(),
  patientId: mockPatient1.userId,
  doctorId: mockDoctor1.userId,
  startTime: new Date("2026-06-08T09:00:00Z"),
  endTime: new Date("2026-06-08T09:30:00Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAppointment2 = {
  id: "appointment-uuid-2",
  patientId: mockPatient2.userId,
  doctorId: mockDoctor2.userId,
  startTime: new Date("2026-06-09T14:00:00Z"),
  endTime: new Date("2026-06-09T14:30:00Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export {
  mockDoctor1,
  mockDoctor2,
  mockPatient1,
  mockPatient2,
  mockAppointment1,
  mockAppointment2,
};
