import type { ReactNode } from "react";

import { marketingContainerClass } from "@/features/marketing/constants/layout";

type MarketingContainerProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingContainer({
  children,
  className,
}: MarketingContainerProps) {
  return (
    <div className={`${marketingContainerClass} ${className ?? ""}`}>
      {children}
    </div>
  );
}
