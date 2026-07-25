import Image from "next/image";
import Link from "next/link";
import { MdArrowForward, MdCheckCircle } from "react-icons/md";

import { roleHomes } from "@/config/routes";
import { authRoutes } from "@/config/site";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  marketingButtonPrimary,
  marketingTextLink,
  marketingTextLinkIcon,
} from "@/features/marketing/constants/interaction-styles";
import { HERO_DASHBOARD_IMAGE } from "@/features/marketing/constants/landing-content";

import { MarketingContainer } from "./MarketingContainer";

type HeroSectionProps = {
  isLoggedIn?: boolean;
  portalHref?: string;
};

export function HeroSection({
  isLoggedIn = false,
  portalHref = roleHomes.patient,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pb-hm-xxl pt-hm-xxl md:pb-32 md:pt-32">
      <MarketingContainer>
        <div className="grid grid-cols-1 items-center gap-hm-xxl lg:grid-cols-2">
          <div className="space-y-hm-lg text-center lg:text-left">
            <span className="inline-block rounded-full bg-secondary-container px-hm-md py-hm-xs font-dm-sans text-label-sm uppercase tracking-wide text-on-secondary-container">
              New: HIPAA-Ready Analytics
            </span>
            <h1 className="font-dm-sans text-display-lg leading-tight text-on-surface md:text-[56px]">
              Healthcare scheduling,{" "}
              <span className="italic text-primary-container">
                finally effortless.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl font-literata text-body-lg text-on-surface-variant lg:mx-0">
              The intelligent appointment platform that bridges the gap between
              patient expectations and clinical efficiency. Experience warm,
              human-centric care powered by surgical precision.
            </p>
            <div className="flex flex-col items-center justify-center gap-hm-md sm:flex-row lg:justify-start">
              <Link
                href={isLoggedIn ? portalHref : authRoutes.register}
                className={`${marketingButtonPrimary} w-full sm:w-auto`}
              >
                {isLoggedIn ? "Open portal" : "Book an Appointment"}
              </Link>
              <Link href="#for-doctors" className={marketingTextLink}>
                For Doctors
                <AppIcon
                  icon={MdArrowForward}
                  className={marketingTextLinkIcon}
                />
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-hm-xl">
            <div className="rotate-2 rounded-xl border border-outline-variant bg-white p-hm-sm shadow-lg transition-transform duration-500 ease-in-out hover:rotate-0 hover:shadow-xl md:p-hm-md">
              <Image
                src={HERO_DASHBOARD_IMAGE}
                alt="HealthMate dashboard showing a calendar view with patient appointment cards"
                width={800}
                height={600}
                className="aspect-[4/3] w-full rounded-lg object-cover grayscale-[0.1]"
                priority
              />
              <div className="absolute -bottom-6 -left-6 hidden max-w-[200px] rounded-lg border border-outline-variant bg-surface-bright p-hm-md shadow-xl md:block">
                <div className="mb-hm-xs flex items-center gap-hm-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed">
                    <AppIcon
                      icon={MdCheckCircle}
                      className="text-[20px] text-primary"
                    />
                  </div>
                  <span className="font-dm-sans text-label-md font-bold text-on-surface">
                    Confirmed
                  </span>
                </div>
                <p className="font-literata text-[12px] text-on-surface-variant">
                  Book your appointment and relax! We will remind you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
