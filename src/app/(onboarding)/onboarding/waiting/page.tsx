import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'

export default async function WaitingPage() {
  const { dbUser } = await getOnboardingData()

  return (
    <StepShell title="Ačiū!">
      <div className="space-y-4 text-center">
        <p className="text-lg" style={{ color: 'var(--brand-green)' }}>
          Sveika, {dbUser?.name ?? 'drauge'} 🌙
        </p>
        <p className="text-muted-foreground">
          Tavo profilis peržiūrimas. Kai administratorė patvirtins, gausite laišką el. paštu.
        </p>
        <p className="text-sm text-muted-foreground">
          Paprastai tai užtrunka 1–3 darbo dienas.
        </p>
      </div>
    </StepShell>
  )
}
