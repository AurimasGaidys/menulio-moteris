'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from './actions'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, { error: null })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
          Naujas slaptažodis
        </CardTitle>
        <CardDescription>Įveskite naują slaptažodį savo paskyroje.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Naujas slaptažodis</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Pakartokite slaptažodį</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-green)' }}
            disabled={isPending}
          >
            {isPending ? 'Išsaugoma...' : 'Išsaugoti slaptažodį'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
