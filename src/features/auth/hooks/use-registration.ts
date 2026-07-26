"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signalRoutePending } from "@/components/ui/navigation-signal";
import type { RegistrationInput } from "../types";

type ToastState = {
  message: string;
  variant: "success" | "error";
} | null;

type FieldError = {
  field: string;
  message: string;
};

type SubmitResult = {
  success: boolean;
  fieldErrors?: FieldError[];
};

export function useRegistration() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);

  const submitRegistration = async (
    data: RegistrationInput,
    setFieldError: (
      field: keyof RegistrationInput,
      error: { message: string },
    ) => void,
  ): Promise<SubmitResult> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = data;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        setToast({
          message: "Account created successfully!",
          variant: "success",
        });
        setTimeout(() => {
          signalRoutePending("/login");
          router.push("/login");
        }, 1500);
        return { success: true };
      }

      const body = await response.json();

      if (response.status === 409) {
        setFieldError("email", {
          message: body.error ?? "An account with this email already exists",
        });
        return { success: false };
      }

      if (response.status === 400 && body.issues) {
        const fieldErrors: FieldError[] = [];
        for (const issue of body.issues as {
          path: string;
          message: string;
        }[]) {
          const field = issue.path as keyof RegistrationInput;
          setFieldError(field, { message: issue.message });
          fieldErrors.push({ field: issue.path, message: issue.message });
        }
        return { success: false, fieldErrors };
      }

      setToast({
        message: body.error ?? "Something went wrong. Please try again.",
        variant: "error",
      });
      return { success: false };
    } catch {
      setToast({
        message: "Network error. Please check your connection and try again.",
        variant: "error",
      });
      return { success: false };
    }
  };

  return { toast, setToast, submitRegistration };
}
