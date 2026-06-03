import { CtaSection } from './CtaSection';
import { FeatureGridSection } from './FeatureGridSection';
import { PlatformFeaturesSection } from './PlatformFeaturesSection';
import { ForDoctorsSection } from './ForDoctorsSection';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { MarketingFooter } from './MarketingFooter';
import { MarketingNav } from './MarketingNav';
import { SocialProofSection } from './SocialProofSection';

export function LandingPage() {
  return (
    <div className="marketing-landing min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <MarketingNav />
      <main>
        <HeroSection />
        <SocialProofSection />
        <PlatformFeaturesSection />
        <FeatureGridSection />
        <HowItWorksSection />
        <ForDoctorsSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
