import { CtaSection } from '../components/CtaSection'
import { FeatureGrid } from '../components/FeatureGrid'
import { HeroSection } from '../components/HeroSection'
import { WorkflowSection } from '../components/WorkflowSection'
import styles from './LandingPage.module.css'

export function LandingPage() {
  return (
    <div className={styles.page}>
      <HeroSection />
      <FeatureGrid />
      <WorkflowSection />
      <CtaSection />
    </div>
  )
}
