import { Container } from '../../../components/ui'
import { CtaSection } from '../components/CtaSection'
import { FeatureGrid } from '../components/FeatureGrid'
import { HeroSection } from '../components/HeroSection'
import { WorkflowSection } from '../components/WorkflowSection'

export function LandingPage() {
  return (
    <Container className="flex flex-col gap-16 py-10 pt-[calc(var(--layout-header-height-public)+2.5rem)] md:gap-24 md:pt-[calc(var(--layout-header-height-public)+4rem)] md:pb-16">
      <HeroSection />
      <FeatureGrid />
      <WorkflowSection />
      <CtaSection />
    </Container>
  )
}
