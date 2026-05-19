import Link from 'next/link'

interface StepShellProps {
  title: string
  description?: string
  backHref?: string
  children: React.ReactNode
}

export function StepShell({ title, description, backHref, children }: StepShellProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1
          className="font-[family-name:var(--font-playfair)] text-3xl font-semibold"
          style={{ color: 'var(--brand-green)' }}
        >
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
      {backHref && (
        <div className="text-center">
          <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
            ← Atgal
          </Link>
        </div>
      )}
    </div>
  )
}
