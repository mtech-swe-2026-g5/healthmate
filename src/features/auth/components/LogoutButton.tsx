"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { MdLogout } from "react-icons/md";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { signalRoutePending } from "@/components/ui/navigation-signal";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

/**
 * Signs the user out (clears the session cookie via Auth.js) and returns them
 * to the login page. Client component so it works in any nav/header without a
 * server action, and it pulls only the client-safe `next-auth/react` entry.
 */
export function LogoutButton({
  className,
  label = "Log out",
}: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => {
        setPending(true);
        signalRoutePending("/login");
        void signOut({ callbackUrl: "/login" }).catch(() => {
          setPending(false);
        });
      }}
      className={`inline-flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-surface-container-highest)] disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {pending ? (
        <LoadingSpinner size={16} label="Signing out" />
      ) : (
        <MdLogout size={18} aria-hidden />
      )}
      {pending ? "Signing out…" : label}
    </button>
  );
}
