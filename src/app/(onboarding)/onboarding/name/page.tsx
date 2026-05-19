import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { NameForm } from './name-form'

export default async function NamePage() {
  const { dbUser, user } = await getOnboardingData()
  const initialName = dbUser?.name ?? user.email?.split('@')[0] ?? ''

  return (
    <StepShell title="Koks tavo vardas?" description="Kaip tave vadinti bendruomenėje">
      <NameForm initialName={initialName} />
    </StepShell>
  )
}
