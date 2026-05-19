import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { ComfortForm } from './comfort-form'

export default async function ComfortPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Kiek komfortiškai jauti bendraudama?"
      description="Padės suderinti tave su tinkamomis grupėmis"
      backHref="/onboarding/availability"
    >
      <ComfortForm initialComfort={profile?.comfort_level ?? 3} />
    </StepShell>
  )
}
