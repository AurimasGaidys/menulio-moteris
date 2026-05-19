import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { LocationForm } from './location-form'

export default async function LocationPage() {
  const { dbUser } = await getOnboardingData()
  if (!dbUser) redirect('/onboarding')

  return (
    <StepShell
      title="Kur gyveni?"
      description="Padės rasti moterų iš tavo regiono"
      backHref="/onboarding/name"
    >
      <LocationForm initialLocation={dbUser?.location ?? ''} />
    </StepShell>
  )
}
