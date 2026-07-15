"use client";

import { useCallback, useState } from "react";
import { MdCheck, MdShare } from "react-icons/md";

import { AppIcon } from "@/components/ui/AppIcon";
import { siteConfig } from "@/config/site";
import { marketingIconButton } from "@/features/marketing/constants/interaction-styles";

export function ShareSiteButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData: ShareData = {
      title: siteConfig.title,
      text: siteConfig.description,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link to share HealthMate:", url);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={marketingIconButton}
      aria-label={copied ? "Link copied to clipboard" : "Share HealthMate"}
      title={copied ? "Link copied!" : "Share HealthMate"}
    >
      <AppIcon icon={copied ? MdCheck : MdShare} className="text-xl" />
    </button>
  );
}
