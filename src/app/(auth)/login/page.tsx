'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleButton } from '@/components/auth/google-button'
import { signInWithPassword, signInWithGoogle } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInWithPassword, { error: null })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
          Sveiki sugrįžę!
        </CardTitle>
        <CardDescription>Prisijunkite prie savo paskyros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton action={signInWithGoogle} label="Tęsti su Google" />

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
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-green)' }}
            disabled={isPending}
          >
            {isPending ? 'Jungiamasi...' : 'Prisijungti'}
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/forgot-password" className="hover:underline">
              Pamiršote slaptažodį?
            </Link>
          </p>
          <p>
            Neturite paskyros?{' '}
            <Link
              href="/signup"
              className="font-medium hover:underline"
              style={{ color: 'var(--brand-terracotta)' }}
            >
              Registruotis
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
