'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordReset, {
    error: null,
    success: false,
  })

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
            Patikrinkite el. paštą
          </CardTitle>
          <CardDescription>
            Išsiuntėme slaptažodžio atkūrimo nuorodą. Patikrinkite gautuosius.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm hover:underline"
            style={{ color: 'var(--brand-terracotta)' }}
          >
            ← Grįžti į prisijungimą
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-playfair)] text-2xl">
          Pamiršote slaptažodį?
        </CardTitle>
        <CardDescription>
          Įveskite el. pašto adresą — atsiųsime atkūrimo nuorodą.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">El. paštas</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--brand-green)' }}
            disabled={isPending}
          >
            {isPending ? 'Siunčiama...' : 'Siųsti nuorodą'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline">
            ← Grįžti į prisijungimą
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
