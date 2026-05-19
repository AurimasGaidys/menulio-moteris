import { ProgressBar } from '@/components/onboarding/progress-bar'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--brand-cream)' }}>
      <header className="pt-6 pb-4 px-6">
        <span
          className="font-[family-name:var(--font-playfair)] text-xl font-semibold"
          style={{ color: 'var(--brand-green)' }}
        >
          Menulio Moteris
        </span>
      </header>
      <ProgressBar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  )
}
