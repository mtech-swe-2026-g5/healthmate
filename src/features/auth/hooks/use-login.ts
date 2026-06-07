'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import type { LoginInput } from '../types';

type ToastState = {
  message: string;
  variant: 'success' | 'error';
} | null;

type SubmitResult = {
  success: boolean;
};

const GENERIC_ERROR = 'Invalid email or password.';
const DEFAULT_REDIRECT = '/dashboard';

export function useLogin() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);

  const submitLogin = async (data: LoginInput): Promise<SubmitResult> => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        role: data.role,
        rememberMe: String(data.rememberMe),
        redirect: false,
      });

      if (!result || result.error) {
        setToast({ message: GENERIC_ERROR, variant: 'error' });
        return { success: false };
      }

      router.push(DEFAULT_REDIRECT);
      router.refresh();
      return { success: true };
    } catch {
      setToast({
        message: 'Network error. Please check your connection and try again.',
        variant: 'error',
      });
      return { success: false };
    }
  };

  return { toast, setToast, submitLogin };
}
