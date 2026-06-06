'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MdVisibility, MdVisibilityOff, MdWarning } from 'react-icons/md';

import { BrandMark } from '@/components/ui/BrandMark';
import { Toast } from '@/components/ui/Toast';

import { registrationSchema } from '../types';
import type { RegistrationInput } from '../types';
import {
  GENDER_OPTIONS,
  GENDER_LABELS,
  BLOOD_GROUP_OPTIONS,
} from '../constants';
import { useRegistration } from '../hooks/use-registration';

const INPUT_BASE =
  'peer w-full h-14 px-[var(--spacing-hm-md)] pt-2 border rounded-lg outline-none transition-all font-literata text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)]';

const INPUT_FOCUS =
  'focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]';

const INPUT_NORMAL = `${INPUT_BASE} border-[var(--color-outline-variant)] ${INPUT_FOCUS}`;
const INPUT_ERROR = `${INPUT_BASE} border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]`;

const SELECT_BASE =
  'w-full h-14 px-[var(--spacing-hm-md)] border rounded-lg outline-none transition-all font-literata text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)] appearance-none';

function inputClass(hasError: boolean) {
  return hasError ? INPUT_ERROR : INPUT_NORMAL;
}

function selectClass(hasError: boolean) {
  return `${SELECT_BASE} ${
    hasError
      ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]'
      : `border-[var(--color-outline-variant)] ${INPUT_FOCUS}`
  }`;
}

export function RegistrationForm() {
  const { toast, setToast, submitRegistration } = useRegistration();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationInput) => {
    await submitRegistration(data, setError);
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Brand anchor */}
      <div className="mb-[var(--spacing-hm-xl)]">
        <BrandMark variant="badge" href="/" className="mb-[var(--spacing-hm-lg)]" />
        <h1 className="font-dm-sans text-headline-lg text-[var(--color-on-surface)] mb-[var(--spacing-hm-xs)]">
          Create your account
        </h1>
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Register to access healthcare services securely.
        </p>
      </div>

      {/* Registration form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-[var(--spacing-hm-lg)]"
        noValidate
        aria-label="Patient registration form"
      >
        {/* Name row */}
        <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] sm:grid-cols-2">
          <FloatingField
            id="firstName"
            label="First name"
            error={errors.firstName?.message}
            required
          >
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              placeholder=" "
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={!!errors.firstName}
              aria-describedby={
                errors.firstName ? 'firstName-error' : undefined
              }
              className={inputClass(!!errors.firstName)}
            />
          </FloatingField>

          <FloatingField
            id="lastName"
            label="Last name"
            error={errors.lastName?.message}
            required
          >
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              placeholder=" "
              autoComplete="family-name"
              aria-required="true"
              aria-invalid={!!errors.lastName}
              aria-describedby={
                errors.lastName ? 'lastName-error' : undefined
              }
              className={inputClass(!!errors.lastName)}
            />
          </FloatingField>
        </div>

        <FloatingField
          id="email"
          label="Email address"
          error={errors.email?.message}
          required
        >
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder=" "
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputClass(!!errors.email)}
          />
        </FloatingField>

        {/* Password row */}
        <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] sm:grid-cols-2">
          <FloatingField
            id="password"
            label="Password"
            error={errors.password?.message}
            required
          >
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder=" "
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? 'password-error' : undefined
              }
              className={`${inputClass(!!errors.password)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <MdVisibilityOff size={20} />
              ) : (
                <MdVisibility size={20} />
              )}
            </button>
          </FloatingField>

          <FloatingField
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword?.message}
            required
          >
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder=" "
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
              className={`${inputClass(!!errors.confirmPassword)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirmPassword ? (
                <MdVisibilityOff size={20} />
              ) : (
                <MdVisibility size={20} />
              )}
            </button>
          </FloatingField>
        </div>

        {/* Gender + DOB */}
        <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] sm:grid-cols-2">
          <SelectField
            id="gender"
            label="Gender"
            error={errors.gender?.message}
            required
          >
            <select
              {...register('gender')}
              id="gender"
              aria-required="true"
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? 'gender-error' : undefined}
              className={selectClass(!!errors.gender)}
              defaultValue=""
            >
              <option value="" disabled>
                Select gender
              </option>
              {GENDER_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {GENDER_LABELS[value]}
                </option>
              ))}
            </select>
          </SelectField>

          <SelectField
            id="dateOfBirth"
            label="Date of birth"
            error={errors.dateOfBirth?.message}
            required
          >
            <input
              {...register('dateOfBirth')}
              id="dateOfBirth"
              type="date"
              autoComplete="bday"
              aria-required="true"
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={
                errors.dateOfBirth ? 'dateOfBirth-error' : undefined
              }
              className={selectClass(!!errors.dateOfBirth)}
            />
          </SelectField>
        </div>

        {/* Phone + Blood group */}
        <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] sm:grid-cols-2">
          <FloatingField
            id="phoneNumber"
            label="Phone number"
            error={errors.phoneNumber?.message}
            required
          >
            <input
              {...register('phoneNumber')}
              id="phoneNumber"
              type="tel"
              placeholder=" "
              autoComplete="tel"
              aria-required="true"
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={
                errors.phoneNumber ? 'phoneNumber-error' : undefined
              }
              className={inputClass(!!errors.phoneNumber)}
            />
          </FloatingField>

          <div>
            <select
              {...register('bloodGroup')}
              id="bloodGroup"
              aria-label="Blood group"
              aria-invalid={!!errors.bloodGroup}
              aria-describedby={
                errors.bloodGroup ? 'bloodGroup-error' : undefined
              }
              className={selectClass(!!errors.bloodGroup)}
              defaultValue=""
            >
              <option value="">Blood group</option>
              {BLOOD_GROUP_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {errors.bloodGroup?.message && (
              <FieldError id="bloodGroup-error">
                {errors.bloodGroup.message}
              </FieldError>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-[var(--color-primary)] text-white rounded-lg font-dm-sans text-label-md font-bold hover:bg-[var(--color-primary-container)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-[var(--spacing-hm-xl)] text-center">
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--color-primary)] font-bold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}

/* ── Shared sub-components ──────────────────────────────────── */

function FieldError({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-center gap-1 text-label-sm text-[var(--color-error)]"
    >
      <MdWarning size={14} className="shrink-0" />
      {children}
    </p>
  );
}

type FloatingFieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function FloatingField({
  id,
  label,
  error,
  required,
  children,
}: FloatingFieldProps) {
  return (
    <div>
      <div className={`floating-label-group ${error ? 'has-error' : ''}`}>
        {children}
        <label htmlFor={id} className="font-dm-sans text-label-md">
          {label}
          {required && (
            <span className="text-[var(--color-error)]" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function SelectField({
  id,
  label,
  error,
  required,
  children,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-dm-sans text-label-md text-[var(--color-on-surface-variant)] mb-1.5"
      >
        {label}
        {required && (
          <span className="text-[var(--color-error)]" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
