import { z } from 'zod';

import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '@/features/auth/constants';

export const updatePatientProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (val) => !isNaN(new Date(val).getTime()) && new Date(val) < new Date(),
      { message: 'Date of birth must be a valid date in the past' },
    ),
  gender: z.enum(GENDER_OPTIONS, {
    error: 'Please select a gender',
  }),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  bloodGroup: z
    .enum(BLOOD_GROUP_OPTIONS, {
      error: 'Select a valid blood group',
    })
    .nullable()
    .optional(),
});

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;

export type PatientProfile = {
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string | null;
  phoneNumber: string | null;
  bloodGroup: string | null;
};
