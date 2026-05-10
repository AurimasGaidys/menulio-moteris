'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleButton } from '@/components/auth/google-button'
import { signUp, signUpWithGoogle } from './actions'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, { error: null, success: false })

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
            Patikrinkite el. paštą
          </CardTitle>
          <CardDescription>
            Išsiuntėme patvirtinimo nuorodą. Spustelėkite ją, kad aktyvuotumėte paskyrą.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
          Registruotis
        </CardTitle>
        <CardDescription>Sukurkite paskyrą ir prisijunkite prie bendruomenės</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton action={signUpWithGoogle} label="Registruotis su Google" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">arba</span>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">El. paštas</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
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
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-green)' }}
            disabled={isPending}
          >
            {isPending ? 'Kuriama paskyra...' : 'Registruotis'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Jau turite paskyrą?{' '}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: 'var(--brand-terracotta)' }}
          >
            Prisijungti
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
