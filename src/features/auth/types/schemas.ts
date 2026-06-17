import { z } from 'zod';

import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '../constants';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

/**
 * Client-side registration schema — includes confirmPassword for the form.
 */
export const registrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be 100 characters or fewer'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be 100 characters or fewer'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
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
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Server-side API schema — no confirmPassword, used for endpoint validation.
 */
export const registrationApiSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
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
    .optional(),
});

export type RegistrationApiInput = z.infer<typeof registrationApiSchema>;

/**
 * Roles selectable from the login screen's role toggle. `admin` is not a
 * self-service login surface, so it is excluded from the client schema.
 */
export const LOGIN_ROLES = ['patient', 'doctor'] as const;

/**
 * Client-side login schema. Password complexity is intentionally NOT
 * re-validated here — failed sign-ins must return a single generic error so
 * we never reveal which field was wrong.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  // Always supplied by the form (checkbox + role toggle have defaultValues),
  // so they are required here to keep the resolver input/output types aligned.
  rememberMe: z.boolean(),
  role: z.enum(LOGIN_ROLES),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Server-side schema for Auth.js `authorize`. Credentials arrive as strings
 * over the wire, so `rememberMe` is parsed from its string form (avoiding
 * `z.coerce.boolean`, which treats the string "false" as true).
 */
export const credentialsAuthorizeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  rememberMe: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === 'true'),
});

export type CredentialsAuthorizeInput = z.infer<
  typeof credentialsAuthorizeSchema
>;
