'use client'

import { usePathname } from 'next/navigation'

const STEPS = ['name', 'location', 'topics', 'level', 'photo', 'availability', 'comfort', 'waiting']

export function ProgressBar() {
  const pathname = usePathname()
  const segment = pathname.split('/').at(-1) ?? ''
  const index = STEPS.indexOf(segment)
  const pct = index === -1 ? 0 : ((index + 1) / STEPS.length) * 100

  return (
    <div className="w-full h-1" style={{ backgroundColor: 'oklch(0.92 0 0)' }}>
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: 'var(--brand-green)' }}
      />
    </div>
  )
}
