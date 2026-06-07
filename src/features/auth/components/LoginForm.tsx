'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MdVisibility, MdVisibilityOff, MdWarning } from 'react-icons/md';

import { BrandMark } from '@/components/ui/BrandMark';
import { Toast } from '@/components/ui/Toast';

import { loginSchema, LOGIN_ROLES } from '../types';
import type { LoginInput } from '../types';
import { useLogin } from '../hooks';

const INPUT_BASE =
  'peer w-full h-14 px-[var(--spacing-hm-md)] pt-2 border rounded-lg outline-none transition-all font-literata text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)]';

const INPUT_FOCUS =
  'focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]';

const INPUT_NORMAL = `${INPUT_BASE} border-[var(--color-outline-variant)] ${INPUT_FOCUS}`;
const INPUT_ERROR = `${INPUT_BASE} border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]`;

const ROLE_LABELS: Record<(typeof LOGIN_ROLES)[number], string> = {
  patient: 'Patient',
  doctor: 'Doctor',
};

function inputClass(hasError: boolean) {
  return hasError ? INPUT_ERROR : INPUT_NORMAL;
}

export function LoginForm() {
  const { toast, setToast, submitLogin } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const [selectedRole, setSelectedRole] =
    useState<(typeof LOGIN_ROLES)[number]>('patient');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'patient', rememberMe: false },
  });

  const handleRoleChange = (role: (typeof LOGIN_ROLES)[number]) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    await submitLogin(data);
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
          Welcome back
        </h1>
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Access your healthcare dashboard securely.
        </p>
      </div>

      {/* Role toggle */}
      <div
        role="radiogroup"
        aria-label="Account type"
        className="inline-flex p-1 bg-[var(--color-surface-container)] rounded-full mb-[var(--spacing-hm-xl)] w-fit"
      >
        {LOGIN_ROLES.map((role) => {
          const isActive = selectedRole === role;
          return (
            <button
              key={role}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleRoleChange(role)}
              className={`px-[var(--spacing-hm-xl)] py-2 rounded-full font-dm-sans text-label-md transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          );
        })}
      </div>

      {/* Login form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-[var(--spacing-hm-lg)]"
        noValidate
        aria-label="Login form"
      >
        <FloatingField
          id="email"
          label="Email address"
          error={errors.email?.message}
        >
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder=" "
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputClass(!!errors.email)}
          />
        </FloatingField>

        <FloatingField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder=" "
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
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

        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-on-surface)]">
              Remember me
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-[var(--color-primary)] text-white rounded-lg font-dm-sans text-label-md font-bold hover:bg-[var(--color-primary-container)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-[var(--spacing-hm-xl)] text-center">
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[var(--color-primary)] font-bold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}

/* ── Shared sub-components ──────────────────────────────────── */

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
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
  children: React.ReactNode;
};

function FloatingField({ id, label, error, children }: FloatingFieldProps) {
  return (
    <div>
      <div className={`floating-label-group ${error ? 'has-error' : ''}`}>
        {children}
        <label htmlFor={id} className="font-dm-sans text-label-md">
          {label}
        </label>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
