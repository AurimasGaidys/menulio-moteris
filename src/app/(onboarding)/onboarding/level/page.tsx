import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { LevelForm } from './level-form'

export default async function LevelPage() {
  const { dbUser, profile } = await getOnboardingData()
  if (!dbUser) redirect('/onboarding')

  return (
    <StepShell
      title="Koks tavo lygis?"
      description="Kiek laiko praktikuoji dvasines praktikas"
      backHref="/onboarding/topics"
    >
      <LevelForm initialLevel={profile?.level ?? 3} />
    </StepShell>
  )
}
