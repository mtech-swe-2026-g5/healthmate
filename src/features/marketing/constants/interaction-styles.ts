/** Shared hover, focus, and motion for marketing buttons and links. */
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const motion = "transition-all duration-200 ease-in-out";

/** Shared padding for nav action buttons (Log in + Get Started). */
export const marketingNavButtonPadding = "px-hm-lg py-hm-sm";

export const marketingButtonBase = `cursor-pointer ${motion} ${focusRing}`;

export const marketingButtonPrimary = `${marketingButtonBase} rounded-lg bg-primary px-hm-xl py-hm-md font-dm-sans text-label-md font-bold text-on-primary shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]`;

export const marketingButtonContainer = `${marketingButtonBase} rounded-lg bg-primary-container ${marketingNavButtonPadding} font-dm-sans text-label-md font-bold text-on-primary-container shadow-sm hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98]`;

export const marketingButtonContainerLg = `${marketingButtonBase} rounded-lg bg-primary-container px-hm-xl py-hm-md font-dm-sans text-label-md font-bold text-on-primary-container shadow-sm hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98]`;

export const marketingButtonLogin = `${marketingButtonBase} marketing-login-button group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-surface-container-low/80 ${marketingNavButtonPadding} font-dm-sans text-label-md font-semibold text-primary shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary hover:bg-secondary-container hover:shadow-[0_4px_16px_rgba(26,107,114,0.15)] active:translate-y-0 active:scale-[0.98]`;

export const marketingButtonCtaFilled = `${marketingButtonBase} rounded-lg bg-white px-hm-xl py-hm-md font-dm-sans text-label-md font-bold text-primary shadow-sm hover:-translate-y-0.5 hover:bg-surface-bright hover:shadow-md active:translate-y-0 active:scale-[0.98]`;

export const marketingButtonCtaOutline = `${marketingButtonBase} rounded-lg border border-white/30 px-hm-xl py-hm-md font-dm-sans text-label-md font-bold text-white hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 active:translate-y-0 active:scale-[0.98]`;

export const marketingBrandLink = `inline-block font-dm-sans text-headline-md font-bold text-primary ${motion} hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm`;

export const marketingNavLink =
  "marketing-nav-link font-dm-sans text-label-md font-medium text-on-surface-variant";

export const marketingNavLinkActive =
  "font-dm-sans text-label-md font-bold text-primary border-b-2 border-primary pb-1 transition-colors duration-200 ease-in-out hover:text-primary-container";

export const marketingTextLink = `group inline-flex items-center gap-hm-xs font-dm-sans text-label-md font-bold text-primary ${motion} hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm`;

export const marketingTextLinkIcon =
  "text-[18px] transition-transform duration-200 ease-in-out group-hover:translate-x-1";

export const marketingFooterLink = `marketing-footer-link font-dm-sans text-label-md text-on-surface-variant ${motion}`;

export const marketingIconButton = `marketing-icon-button cursor-pointer text-on-surface-variant ${motion} ${focusRing} rounded-sm`;
