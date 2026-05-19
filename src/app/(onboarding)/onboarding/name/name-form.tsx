'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveName } from './actions'

export function NameForm({ initialName }: { initialName: string }) {
  const [state, formAction, isPending] = useActionState(saveName, { error: null })

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Vardas</Label>
        <Input id="name" name="name" defaultValue={initialName} placeholder="Jūsų vardas" autoFocus />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" style={{ backgroundColor: 'var(--brand-green)' }} disabled={isPending}>
        {isPending ? 'Saugoma...' : 'Toliau →'}
      </Button>
    </form>
  )
}
