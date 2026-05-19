import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { PhotoForm } from './photo-form'

export default async function PhotoPage() {
  const { dbUser } = await getOnboardingData()
  if (!dbUser) redirect('/onboarding')

  return (
    <StepShell
      title="Tavo nuotrauka"
      description="Pridėk profilį puošiančią nuotrauką"
      backHref="/onboarding/level"
    >
      <PhotoForm currentAvatarUrl={dbUser?.avatar_url ?? null} />
    </StepShell>
  )
}
