import Image from 'next/image';
import Link from 'next/link';
import { MdCheckCircle } from 'react-icons/md';

import { authRoutes } from '@/config/site';
import { AppIcon } from '@/components/ui/AppIcon';
import { marketingButtonContainerLg } from '@/features/marketing/constants/interaction-styles';
import {
  DOCTOR_DASHBOARD_IMAGE,
  doctorBenefits,
} from '@/features/marketing/constants/landing-content';

import { MarketingContainer } from './MarketingContainer';

export function ForDoctorsSection() {
  return (
    <section id="for-doctors" className="overflow-hidden section-py scroll-mt-20">
      <MarketingContainer>
        <div className="flex flex-col items-center gap-hm-lg sm:gap-hm-xxl rounded-xl border border-outline-variant/30 bg-surface-container-low p-hm-md sm:p-hm-lg md:p-hm-xxl lg:flex-row">
          <div className="w-full space-y-hm-md sm:space-y-hm-lg lg:w-1/2">
            <span className="font-dm-sans text-label-md font-bold uppercase tracking-widest text-primary">
              Practitioner Focus
            </span>
            <h2 className="font-dm-sans text-display-responsive text-on-surface">
              Control your practice, not just your calendar.
            </h2>
            <ul className="space-y-hm-md">
              {doctorBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-hm-md">
                  <AppIcon icon={MdCheckCircle} className="mt-1 shrink-0 text-primary" />
                  <p className="font-literata text-body-md text-on-surface-variant">{benefit}</p>
                </li>
              ))}
            </ul>
            <Link
              href={authRoutes.login}
              className={`${marketingButtonContainerLg} w-full sm:w-auto`}
            >
              View Doctor Features
            </Link>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-2xl">
              <Image
                src={DOCTOR_DASHBOARD_IMAGE}
                alt="Doctor using a tablet with HealthMate schedule and patient vitals interface"
                width={800}
                height={500}
                className="h-auto w-full"
              />
              <div className="border-t border-outline-variant bg-white p-hm-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-hm-sm">
                    <div className="h-10 w-10 rounded-full bg-surface-container-highest" />
                    <div>
                      <div className="h-3 w-24 rounded bg-surface-container-highest" />
                      <div className="mt-1 h-2 w-16 rounded bg-surface-container-highest" />
                    </div>
                  </div>
                  <div className="h-8 w-20 rounded-full bg-primary-container/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
