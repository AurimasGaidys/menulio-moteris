import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { ComfortForm } from './comfort-form'

export default async function ComfortPage() {
  const { dbUser, profile } = await getOnboardingData()
  if (!dbUser) redirect('/onboarding')

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
