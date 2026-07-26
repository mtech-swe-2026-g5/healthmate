"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

import { signalRoutePending } from "@/components/ui/navigation-signal";
import { resolvePostLoginRedirect } from "@/config/routes";
import type { LoginInput } from "../types";

type ToastState = {
  message: string;
  variant: "success" | "error";
} | null;

type SubmitResult = {
  success: boolean;
};

const GENERIC_ERROR = "Invalid email or password.";

export function useLogin() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);

  const submitLogin = async (
    data: LoginInput,
    callbackUrl?: string | null,
  ): Promise<SubmitResult> => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        rememberMe: String(data.rememberMe),
        redirect: false,
      });

      if (!result || result.error) {
        setToast({ message: GENERIC_ERROR, variant: "error" });
        return { success: false };
      }

      const session = await getSession();
      const destination = resolvePostLoginRedirect(
        session?.user?.role,
        callbackUrl,
      );

      signalRoutePending(destination);
      router.push(destination);
      router.refresh();
      return { success: true };
    } catch {
      setToast({
        message: "Network error. Please check your connection and try again.",
        variant: "error",
      });
      return { success: false };
    }
  };

  return { toast, setToast, submitLogin };
}
