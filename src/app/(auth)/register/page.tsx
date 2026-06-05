import type { Metadata } from 'next';

import { RegistrationForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create Account — HealthMate',
  description: 'Register a new patient account on HealthMate.',
};

export default function RegisterPage() {
  return <RegistrationForm />;
}
