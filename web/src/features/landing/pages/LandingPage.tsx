import { CtaSection } from '../components/CtaSection'
import { FeatureGrid } from '../components/FeatureGrid'
import { HeroSection } from '../components/HeroSection'
import { WorkflowSection } from '../components/WorkflowSection'

export function LandingPage() {
  return (
    <div className="flex flex-col w-full gap-16 py-10 md:gap-24 md:py-16">
      <HeroSection />
      <FeatureGrid />
      <WorkflowSection />
      <CtaSection />
    </div>
  )
}
