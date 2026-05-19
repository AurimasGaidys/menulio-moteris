'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveLevel } from './actions'

const LABELS: Record<number, string> = {
  1: 'Pradedančioji',
  2: 'Žengiu pirmuosius žingsnius',
  3: 'Praktikuoju reguliariai',
  4: 'Pažengusi',
  5: 'Mokau kitas',
}

export function LevelForm({ initialLevel }: { initialLevel: number }) {
  const [state, formAction, isPending] = useActionState(saveLevel, { error: null })
  const [value, setValue] = useState(initialLevel)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pradedančioji</span>
          <span>Mokau kitas</span>
        </div>
        <input
          type="range"
          name="level"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--brand-green)' }}
        />
        <p className="text-center text-sm font-medium" style={{ color: 'var(--brand-green)' }}>
          {LABELS[value]}
        </p>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending}
      >
        {isPending ? 'Saugoma...' : 'Toliau →'}
      </Button>
    </form>
  )
}
