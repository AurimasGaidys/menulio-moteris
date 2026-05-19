import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { TopicsForm } from './topics-form'

export default async function TopicsPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Kas tave domina?"
      description="Pasirink temas, kurios tau artimos"
      backHref="/onboarding/location"
    >
      <TopicsForm initialTopics={profile?.topics ?? []} />
    </StepShell>
  )
}
