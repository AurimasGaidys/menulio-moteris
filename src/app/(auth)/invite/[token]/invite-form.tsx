'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAccountFromInvite } from './actions'

interface InviteFormProps {
  email: string
  token: string
}

export function InviteForm({ email, token }: InviteFormProps) {
  const [state, formAction, isPending] = useActionState(createAccountFromInvite, { error: null })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
          Sukurkite slaptažodį
        </CardTitle>
        <CardDescription>
          Buvote pakviesta į Menulio Moteris. Nustatykite slaptažodį, kad pradėtumėte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <Label>El. paštas</Label>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Slaptažodis</Label>
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
            {isPending ? 'Kuriama paskyra...' : 'Pradėti'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
