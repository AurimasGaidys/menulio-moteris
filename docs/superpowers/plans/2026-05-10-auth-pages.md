# Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete authentication UI — login, signup, forgot-password, reset-password, and invite pages — using Supabase Auth, server actions, and the brand design system.

**Architecture:** Next.js App Router with an `(auth)` route group that shares a centred-card layout. Each page is a `'use client'` component using React 19's `useActionState` for form state. Auth logic lives in co-located `actions.ts` files as `'use server'` functions. Google OAuth flows through a shared `/auth/callback` route handler.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (`@supabase/ssr`), React 19 `useActionState`, Zod v4, shadcn/ui (Button, Input, Label, Card), Tailwind CSS v4, Lithuanian copy throughout.

---

## Already done — do not redo

- `src/lib/supabase/client.ts` — browser client ✅
- `src/lib/supabase/server.ts` — server client ✅
- `src/lib/supabase/middleware.ts` — session refresh ✅
- `middleware.ts` — route protection ✅
- `supabase/migrations/` — users, profiles, invites tables ✅
- `src/components/ui/` — button, card, input, label, avatar, tabs ✅

---

## File Map

```
src/
  app/
    globals.css                          modify: add brand CSS tokens
    layout.tsx                           modify: title → "Menulio Moteris", lang → "lt"
    (auth)/
      layout.tsx                         create: centred card on cream bg
      login/
        page.tsx                         create: login form (email+password + Google)
        actions.ts                       create: signInWithPassword, signInWithGoogle
      signup/
        page.tsx                         create: signup form → "check email" success state
        actions.ts                       create: signUp
      forgot-password/
        page.tsx                         create: email form → success state
        actions.ts                       create: sendPasswordReset
      reset-password/
        page.tsx                         create: new password form
        actions.ts                       create: updatePassword
      invite/
        [token]/
          page.tsx                       create: server component validates token, renders InviteForm
          invite-form.tsx                create: client form (name + password)
          actions.ts                     create: createAccountFromInvite
    auth/
      callback/
        route.ts                         create: exchanges OAuth/email codes for sessions
  lib/
    supabase/
      admin.ts                           create: service-role client for invite account creation
  components/
    auth/
      google-button.tsx                  create: Google OAuth submit button
```

---

## Task 1: Brand tokens + layout metadata

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add brand CSS custom properties to `src/app/globals.css`**

Add these three lines inside the existing `:root { ... }` block, after the last variable:

```css
  --brand-green: oklch(0.28 0.09 155);
  --brand-cream: oklch(0.96 0.02 88);
  --brand-terracotta: oklch(0.58 0.14 35);
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace the full file content:

```tsx
import type { Metadata } from 'next'
import { Geist, Playfair_Display } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Menulio Moteris',
  description: 'Moterų bendruomenė',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/aurimasgaidys/wonderland/menulio-moteris && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add brand CSS tokens and update root layout metadata"
```

---

## Task 2: Auth layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Create `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--brand-cream)' }}
    >
      <div className="mb-8 text-center">
        <span
          className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-wide"
          style={{ color: 'var(--brand-green)' }}
        >
          Menulio Moteris
        </span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify layout renders**

```bash
npm run dev
```

Navigate to http://localhost:3000/login — should show the cream background (page.tsx is the default Next.js template, but the layout will apply). Expected: cream background, "Menulio Moteris" heading visible above the card area.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/layout.tsx
git commit -m "feat: add (auth) route group layout with brand styling"
```

---

## Task 3: OAuth callback route + admin client

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Create `src/app/auth/callback/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 2: Create `src/lib/supabase/admin.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/ src/lib/supabase/admin.ts
git commit -m "feat: add OAuth callback route and admin Supabase client"
```

---

## Task 4: Google OAuth button

**Files:**
- Create: `src/components/auth/google-button.tsx`

The button is a plain form that submits to a server action. No client state needed.

- [ ] **Step 1: Create `src/components/auth/google-button.tsx`**

```tsx
import { Button } from '@/components/ui/button'

interface GoogleButtonProps {
  action: () => Promise<never>
  label: string
}

export function GoogleButton({ action, label }: GoogleButtonProps) {
  return (
    <form action={action}>
      <Button type="submit" variant="outline" className="w-full gap-2">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {label}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/google-button.tsx
git commit -m "feat: add Google OAuth button component"
```

---

## Task 5: Login page

**Files:**
- Create: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/login/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.email('Neteisingas el. pašto adresas'),
  password: z.string().min(1, 'Įveskite slaptažodį'),
})

export async function signInWithPassword(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Neteisingi prisijungimo duomenys' }
  redirect('/dashboard')
}

export async function signInWithGoogle(): Promise<never> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error || !data.url) redirect('/login?error=google_failed')
  redirect(data.url)
}
```

- [ ] **Step 2: Create `src/app/(auth)/login/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify login page renders and form submits**

```bash
npm run dev
```

Navigate to http://localhost:3000/login. Expected:
- Cream background, "Menulio Moteris" heading, white card
- "Sveiki sugrįžę!" title
- Google button, divider, email+password form
- Submit with wrong credentials → shows "Neteisingi prisijungimo duomenys"

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/login/
git commit -m "feat: add login page with email/password and Google OAuth"
```

---

## Task 6: Signup page

**Files:**
- Create: `src/app/(auth)/signup/actions.ts`
- Create: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/signup/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.email('Neteisingas el. pašto adresas'),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
})

export async function signUp(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message, success: false }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })
  if (error) return { error: 'Nepavyko sukurti paskyros. Bandykite dar kartą.', success: false }
  return { error: null, success: true }
}

export async function signUpWithGoogle(): Promise<never> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })
  if (error || !data.url) redirect('/signup?error=google_failed')
  redirect(data.url)
}
```

- [ ] **Step 2: Create `src/app/(auth)/signup/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify signup page**

Navigate to http://localhost:3000/signup. Expected:
- Form renders correctly
- Submit with short password → shows "Slaptažodis turi būti bent 8 simbolių"
- Submit with valid data → shows "Patikrinkite el. paštą" success state

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/signup/
git commit -m "feat: add signup page with email verification flow"
```

---

## Task 7: Forgot password page

**Files:**
- Create: `src/app/(auth)/forgot-password/actions.ts`
- Create: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/forgot-password/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Neteisingas el. pašto adresas'),
})

export async function sendPasswordReset(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.issues[0].message, success: false }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })
  if (error) return { error: 'Nepavyko išsiųsti el. laiško. Bandykite dar kartą.', success: false }
  return { error: null, success: true }
}
```

- [ ] **Step 2: Create `src/app/(auth)/forgot-password/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify forgot-password page**

Navigate to http://localhost:3000/forgot-password. Expected:
- Email form renders
- Submit with invalid email → shows validation error
- Submit with valid email → shows "Patikrinkite el. paštą" state (email sent by Supabase)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/forgot-password/
git commit -m "feat: add forgot-password page"
```

---

## Task 8: Reset password page

**Files:**
- Create: `src/app/(auth)/reset-password/actions.ts`
- Create: `src/app/(auth)/reset-password/page.tsx`

The user arrives here after clicking the reset email link → Supabase redirects through `/auth/callback?next=/reset-password`, exchanging the code for a session. The page then shows a form to set a new password.

- [ ] **Step 1: Create `src/app/(auth)/reset-password/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z
  .object({
    password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

export async function updatePassword(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'Nepavyko atnaujinti slaptažodžio. Bandykite dar kartą.' }
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create `src/app/(auth)/reset-password/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/reset-password/
git commit -m "feat: add reset-password page"
```

---

## Task 9: Invite page

**Files:**
- Create: `src/lib/supabase/admin.ts` (already done in Task 3)
- Create: `src/app/(auth)/invite/[token]/actions.ts`
- Create: `src/app/(auth)/invite/[token]/invite-form.tsx`
- Create: `src/app/(auth)/invite/[token]/page.tsx`

The invite flow uses the admin client to create the user with `email_confirm: true` (bypasses email verification since the invite itself is the verification), then signs them in with the regular client.

- [ ] **Step 1: Create `src/app/(auth)/invite/[token]/actions.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z
  .object({
    email: z.email(),
    token: z.string().min(1),
    password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

export async function createAccountFromInvite(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, token, password } = parsed.data
  const admin = createAdminClient()

  // Re-validate token is still unused
  const { data: invite } = await admin
    .from('invites')
    .select('id')
    .eq('token', token)
    .is('used_at', null)
    .single()

  if (!invite) return { error: 'Kvietimas nebegalioja.' }

  // Create user via admin API — auto-confirms email
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) return { error: 'Nepavyko sukurti paskyros.' }

  // Mark invite as used
  await admin
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  // Sign user in with regular client
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: 'Paskyra sukurta. Prisijunkite rankiniu būdu.' }

  redirect('/onboarding')
}
```

- [ ] **Step 2: Create `src/app/(auth)/invite/[token]/invite-form.tsx`**

```tsx
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
          <input type="hidden" name="email" value={email} />
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
```

- [ ] **Step 3: Create `src/app/(auth)/invite/[token]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteForm } from './invite-form'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('invites')
    .select('email, used_at')
    .eq('token', token)
    .single()

  if (!invite || invite.used_at) notFound()

  return <InviteForm email={invite.email} token={token} />
}
```

- [ ] **Step 4: Verify invite page**

In Supabase dashboard, insert a test invite:
```sql
insert into public.invites (email, token, invited_by)
values ('test@example.com', 'test-invite-abc123', null);
```

Navigate to http://localhost:3000/invite/test-invite-abc123. Expected:
- Shows email address pre-filled (read-only)
- Password + confirm fields
- Submit → account created, signed in, redirected to /onboarding (which is a 404 for now — that's fine)

Navigate to http://localhost:3000/invite/bad-token. Expected: 404 page.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/invite/ src/lib/supabase/admin.ts
git commit -m "feat: add invite page with admin-backed account creation"
```

---

## Task 10: Final TypeScript check + smoke test

- [ ] **Step 1: Run TypeScript check across all new files**

```bash
cd /Users/aurimasgaidys/wonderland/menulio-moteris && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Smoke test all auth routes**

```bash
npm run dev
```

Checklist:
- [ ] `/login` — renders, wrong creds shows error, correct creds redirects to `/dashboard` (or wherever the session goes)
- [ ] `/signup` — renders, short password shows error, valid submit shows "Patikrinkite el. paštą"
- [ ] `/forgot-password` — renders, valid email submit shows success state
- [ ] `/reset-password` — renders (user needs to arrive via email link; directly visiting shows form but submit will fail without a session — acceptable)
- [ ] `/invite/[valid-token]` — renders with email, form works
- [ ] `/invite/[invalid-token]` — 404

- [ ] **Step 3: Verify middleware still guards protected routes**

Without signing in, navigate to http://localhost:3000/dashboard. Expected: redirect to `/login`.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete auth pages — login, signup, forgot/reset password, invite"
```
