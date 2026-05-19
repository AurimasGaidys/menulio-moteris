import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { AvailabilityForm } from './availability-form'

export default async function AvailabilityPage() {
  const { dbUser, profile } = await getOnboardingData()
  if (!dbUser) redirect('/onboarding')

  return (
    <StepShell
      title="Kada esi laisva?"
      description="Pažymėk laikus, kada paprastai gali susitikti"
      backHref="/onboarding/photo"
    >
      <AvailabilityForm initialAvailability={(profile?.availability as Record<string, string[]>) ?? {}} />
    </StepShell>
  )
}
