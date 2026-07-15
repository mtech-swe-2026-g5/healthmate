"use client";

import { signOut } from "next-auth/react";

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
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className}
    >
      {label}
    </button>
  );
}
