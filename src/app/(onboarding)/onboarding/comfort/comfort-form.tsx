'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveComfort } from './actions'

const LABELS: Record<number, string> = {
  1: 'Man reikia daug erdvės',
  2: 'Mieliau mažos grupelės',
  3: 'Tinka ir vienas, ir kitas',
  4: 'Lengvai bendrauji su naujais žmonėmis',
  5: 'Energizuoja didelės grupės',
}

export function ComfortForm({ initialComfort }: { initialComfort: number }) {
  const [state, formAction, isPending] = useActionState(saveComfort, { error: null })
  const [value, setValue] = useState(initialComfort)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Introvertė</span>
          <span>Ekstrovertė</span>
        </div>
        <input
          type="range"
          name="comfort_level"
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
