# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an 8-step profile wizard at `/onboarding` that collects new member info, saves each step to DB immediately, and ends at a pending-approval screen.

**Architecture:** Separate route per step under `(onboarding)` route group. Each step is a server component page (prefills from DB) + client form component (handles interaction) + server action (validates and saves). Shared layout with progress bar derived from `usePathname()`.

**Tech Stack:** Next.js 16 App Router, React 19 `useActionState`, Supabase SSR (`@supabase/ssr`), Zod v4, `react-image-crop`, tailwindcss + brand CSS tokens

---

## DB Schema Reference

```
public.users     — id, name NOT NULL, location text, avatar_url text, membership_status, role
public.profiles  — user_id FK→users, topics text[] DEFAULT '{}', availability jsonb DEFAULT '{}',
                   level int (1-5), comfort_level int (1-5), bio text
```

Steps 1, 2, 5 save to `users`. Steps 3, 4, 6, 7 save to `profiles`.

No schema migration needed — all columns already exist.

## DB Access Rules

- `users`: regular client can SELECT + UPDATE own row. INSERT requires admin client (no INSERT RLS policy).
- `profiles`: regular client can do all operations on own row (`for all using (auth.uid() = user_id)`).
- Google users have no `public.users` row on first visit — name step creates it via admin client.

## File Map

```
supabase/migrations/20260519000001_avatars_bucket.sql  — storage bucket + policies
src/lib/onboarding.ts                                  — getOnboardingData() helper
src/components/onboarding/progress-bar.tsx             — usePathname() step progress
src/components/onboarding/step-shell.tsx               — shared title/back layout
src/app/(onboarding)/layout.tsx                        — brand header + progress bar
src/app/(onboarding)/onboarding/page.tsx               — redirect to first incomplete step
src/app/(onboarding)/onboarding/name/
  page.tsx, name-form.tsx, actions.ts
src/app/(onboarding)/onboarding/location/
  page.tsx, location-form.tsx, actions.ts
src/app/(onboarding)/onboarding/topics/
  page.tsx, topics-form.tsx, actions.ts
src/app/(onboarding)/onboarding/level/
  page.tsx, level-form.tsx, actions.ts
src/app/(onboarding)/onboarding/photo/
  page.tsx, photo-form.tsx, actions.ts
src/app/(onboarding)/onboarding/availability/
  page.tsx, availability-form.tsx, actions.ts
src/app/(onboarding)/onboarding/comfort/
  page.tsx, comfort-form.tsx, actions.ts
src/app/(onboarding)/onboarding/waiting/page.tsx
```

---

### Task 1: Storage bucket + react-image-crop

**Files:**
- Create: `supabase/migrations/20260519000001_avatars_bucket.sql`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260519000001_avatars_bucket.sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Anyone can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`
Expected: "Finished supabase db push."

- [ ] **Step 3: Install react-image-crop**

Run: `npm install react-image-crop`
Expected: package added, no peer dep warnings

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260519000001_avatars_bucket.sql package.json package-lock.json
git commit -m "feat: avatars storage bucket + react-image-crop"
```

---

### Task 2: Shared helpers and components

**Files:**
- Create: `src/lib/onboarding.ts`
- Create: `src/components/onboarding/progress-bar.tsx`
- Create: `src/components/onboarding/step-shell.tsx`

- [ ] **Step 1: Write `src/lib/onboarding.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingUser = {
  id: string
  name: string
  location: string | null
  avatar_url: string | null
}

export type OnboardingProfile = {
  topics: string[]
  level: number | null
  availability: Record<string, string[]>
  comfort_level: number | null
}

export async function getOnboardingData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, name, location, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('topics, level, availability, comfort_level')
    .eq('user_id', user.id)
    .single()

  return {
    user: { id: user.id, email: user.email },
    dbUser: dbUser as OnboardingUser | null,
    profile: profile as OnboardingProfile | null,
  }
}
```

- [ ] **Step 2: Write `src/components/onboarding/progress-bar.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `src/components/onboarding/step-shell.tsx`**

```tsx
import Link from 'next/link'

interface StepShellProps {
  title: string
  description?: string
  backHref?: string
  children: React.ReactNode
}

export function StepShell({ title, description, backHref, children }: StepShellProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1
          className="font-[family-name:var(--font-playfair)] text-3xl font-semibold"
          style={{ color: 'var(--brand-green)' }}
        >
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
      {backHref && (
        <div className="text-center">
          <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
            ← Atgal
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding.ts src/components/onboarding/
git commit -m "feat: onboarding shared helpers and components"
```

---

### Task 3: Layout and redirect page

**Files:**
- Create: `src/app/(onboarding)/layout.tsx`
- Create: `src/app/(onboarding)/onboarding/page.tsx`

- [ ] **Step 1: Write `src/app/(onboarding)/layout.tsx`**

```tsx
import { ProgressBar } from '@/components/onboarding/progress-bar'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--brand-cream)' }}>
      <header className="pt-6 pb-4 px-6">
        <span
          className="font-[family-name:var(--font-playfair)] text-xl font-semibold"
          style={{ color: 'var(--brand-green)' }}
        >
          Menulio Moteris
        </span>
      </header>
      <ProgressBar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/app/(onboarding)/onboarding/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'

export default async function OnboardingPage() {
  const { dbUser, profile } = await getOnboardingData()

  if (!dbUser) redirect('/onboarding/name')
  if (!dbUser.location) redirect('/onboarding/location')
  if (!profile || !profile.topics.length) redirect('/onboarding/topics')
  if (!profile.level) redirect('/onboarding/level')
  if (!dbUser.avatar_url) redirect('/onboarding/photo')
  if (!Object.keys(profile.availability).length) redirect('/onboarding/availability')
  if (!profile.comfort_level) redirect('/onboarding/comfort')

  redirect('/onboarding/waiting')
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(onboarding)/
git commit -m "feat: onboarding layout and redirect"
```

---

### Task 4: Step 1 — Name

**Files:**
- Create: `src/app/(onboarding)/onboarding/name/actions.ts`
- Create: `src/app/(onboarding)/onboarding/name/name-form.tsx`
- Create: `src/app/(onboarding)/onboarding/name/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  name: z.string().min(2, 'Vardas turi būti bent 2 simboliai'),
})

export async function saveName(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    const admin = createAdminClient()
    const { error } = await admin.from('users').insert({
      id: user.id,
      name: parsed.data.name,
      membership_status: 'pending',
      role: 'member',
    })
    if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }
  } else {
    const { error } = await supabase
      .from('users')
      .update({ name: parsed.data.name })
      .eq('id', user.id)
    if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }
  }

  // Ensure profile row exists (uses DB defaults for NOT NULL columns)
  await supabase
    .from('profiles')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  redirect('/onboarding/location')
}
```

- [ ] **Step 2: Write `name-form.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { NameForm } from './name-form'

export default async function NamePage() {
  const { dbUser, user } = await getOnboardingData()
  const initialName = dbUser?.name ?? user.email?.split('@')[0] ?? ''

  return (
    <StepShell title="Koks tavo vardas?" description="Kaip tave vadinti bendruomenėje">
      <NameForm initialName={initialName} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/(onboarding)/onboarding/name/
git commit -m "feat: onboarding step 1 — name"
```

---

### Task 5: Step 2 — Location

**Files:**
- Create: `src/app/(onboarding)/onboarding/location/actions.ts`
- Create: `src/app/(onboarding)/onboarding/location/location-form.tsx`
- Create: `src/app/(onboarding)/onboarding/location/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  location: z.string().min(1, 'Įveskite savo vietovę'),
})

export async function saveLocation(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ location: formData.get('location') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('users')
    .update({ location: parsed.data.location })
    .eq('id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/topics')
}
```

- [ ] **Step 2: Write `location-form.tsx`**

Uses browser Geolocation API + OpenStreetMap Nominatim for reverse geocoding. On permission denied, shows empty input immediately.

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveLocation } from './actions'

export function LocationForm({ initialLocation }: { initialLocation: string }) {
  const [state, formAction, isPending] = useActionState(saveLocation, { error: null })
  const [value, setValue] = useState(initialLocation)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (initialLocation || !navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=lt`
          )
          const data = await res.json()
          const city =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            ''
          if (city) setValue(city)
        } catch {
          // silent — user types manually
        } finally {
          setDetecting(false)
        }
      },
      () => setDetecting(false)
    )
  }, [initialLocation])

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="location">Miestas arba rajonas</Label>
        <Input
          id="location"
          name="location"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={detecting ? 'Nustatoma...' : 'pvz. Vilnius'}
          disabled={detecting}
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending || detecting}
      >
        {isPending ? 'Saugoma...' : 'Toliau →'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { LocationForm } from './location-form'

export default async function LocationPage() {
  const { dbUser } = await getOnboardingData()

  return (
    <StepShell
      title="Kur gyveni?"
      description="Padės rasti moterų iš tavo regiono"
      backHref="/onboarding/name"
    >
      <LocationForm initialLocation={dbUser?.location ?? ''} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/location/
git commit -m "feat: onboarding step 2 — location"
```

---

### Task 6: Step 3 — Topics

**Files:**
- Create: `src/app/(onboarding)/onboarding/topics/actions.ts`
- Create: `src/app/(onboarding)/onboarding/topics/topics-form.tsx`
- Create: `src/app/(onboarding)/onboarding/topics/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  topics: z.array(z.string()).min(1, 'Pasirinkite bent vieną temą'),
})

export async function saveTopics(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ topics: formData.getAll('topics') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ topics: parsed.data.topics })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/level')
}
```

- [ ] **Step 2: Write `topics-form.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveTopics } from './actions'

const ALL_TOPICS = [
  'Menstruacinis ciklas', 'Joga', 'Meditacija', 'Dvasingumas',
  'Žolelės ir natūrali medicina', 'Energetinės praktikos',
  'Moters sveikata', 'Kūno intuicija', 'Ritualai',
  'Motinystė', 'Savęs pažinimas', 'Gyvenimo ritmai',
]

export function TopicsForm({ initialTopics }: { initialTopics: string[] }) {
  const [state, formAction, isPending] = useActionState(saveTopics, { error: null })
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTopics))

  function toggle(topic: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(topic) ? next.delete(topic) : next.add(topic)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ALL_TOPICS.map((topic) => {
          const active = selected.has(topic)
          return (
            <button
              key={topic}
              type="button"
              onClick={() => toggle(topic)}
              className="px-3 py-1.5 rounded-full text-sm border transition-colors"
              style={
                active
                  ? { backgroundColor: 'var(--brand-green)', color: 'white', borderColor: 'var(--brand-green)' }
                  : { backgroundColor: 'white', borderColor: 'var(--border)' }
              }
            >
              {topic}
            </button>
          )
        })}
      </div>
      {Array.from(selected).map((t) => (
        <input key={t} type="hidden" name="topics" value={t} />
      ))}
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
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { TopicsForm } from './topics-form'

export default async function TopicsPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Kas tave domina?"
      description="Pasirink temas, kurios tau artimos"
      backHref="/onboarding/location"
    >
      <TopicsForm initialTopics={profile?.topics ?? []} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/topics/
git commit -m "feat: onboarding step 3 — topics"
```

---

### Task 7: Step 4 — Level

**Files:**
- Create: `src/app/(onboarding)/onboarding/level/actions.ts`
- Create: `src/app/(onboarding)/onboarding/level/level-form.tsx`
- Create: `src/app/(onboarding)/onboarding/level/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  level: z.coerce.number().int().min(1).max(5),
})

export async function saveLevel(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ level: formData.get('level') })
  if (!parsed.success) return { error: 'Pasirinkite lygį nuo 1 iki 5' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ level: parsed.data.level })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/photo')
}
```

- [ ] **Step 2: Write `level-form.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { LevelForm } from './level-form'

export default async function LevelPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Koks tavo lygis?"
      description="Kiek laiko praktikuoji dvasines praktikas"
      backHref="/onboarding/topics"
    >
      <LevelForm initialLevel={profile?.level ?? 3} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/level/
git commit -m "feat: onboarding step 4 — level"
```

---

### Task 8: Step 5 — Photo

**Files:**
- Create: `src/app/(onboarding)/onboarding/photo/actions.ts`
- Create: `src/app/(onboarding)/onboarding/photo/photo-form.tsx`
- Create: `src/app/(onboarding)/onboarding/photo/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function savePhoto(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { error: 'Pasirinkite nuotrauką' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Nuotrauka negali viršyti 5 MB' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const path = `${user.id}/${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) return { error: 'Nepavyko įkelti nuotraukos' }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)
  if (updateError) return { error: 'Nepavyko išsaugoti' }

  redirect('/onboarding/availability')
}
```

- [ ] **Step 2: Write `photo-form.tsx`**

Uses `react-image-crop` for square crop. Calls `dispatch(formData)` directly with the cropped blob — valid in React 19.

```tsx
'use client'

import { useActionState, useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { savePhoto } from './actions'

function initCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 80 }, 1, w, h), w, h)
}

export function PhotoForm({ currentAvatarUrl }: { currentAvatarUrl: string | null }) {
  const [state, dispatch, isPending] = useActionState(savePhoto, { error: null })
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [clientError, setClientError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setClientError('Nuotrauka negali viršyti 5 MB'); return }
    setClientError(null)
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setCrop(initCrop(w, h))
  }

  function handleSubmit() {
    if (!imgRef.current || !crop) return
    const canvas = document.createElement('canvas')
    const SIZE = 400
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    const img = imgRef.current
    const sx = (crop.x / 100) * img.naturalWidth
    const sy = (crop.y / 100) * img.naturalHeight
    const sw = (crop.width / 100) * img.naturalWidth
    const sh = (crop.height / 100) * img.naturalHeight
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE)
    canvas.toBlob((blob) => {
      if (!blob) return
      const fd = new FormData()
      fd.append('photo', blob, 'avatar.jpg')
      dispatch(fd)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="space-y-6">
      {currentAvatarUrl && !src && (
        <div className="flex justify-center">
          <img src={currentAvatarUrl} alt="Dabartinė nuotrauka" className="w-24 h-24 rounded-full object-cover" />
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium">{src ? 'Apkarpykite nuotrauką' : 'Pasirinkite nuotrauką'}</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-sm" />
      </div>
      {src && (
        <ReactCrop crop={crop} onChange={setCrop} aspect={1} circularCrop className="max-w-full">
          <img ref={imgRef} src={src} onLoad={onImageLoad} alt="Apkarpyti" className="max-w-full" />
        </ReactCrop>
      )}
      {(clientError ?? state.error) && (
        <p className="text-sm text-destructive">{clientError ?? state.error}</p>
      )}
      <Button
        type="button"
        onClick={handleSubmit}
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending || !src}
      >
        {isPending ? 'Įkeliama...' : 'Toliau →'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { PhotoForm } from './photo-form'

export default async function PhotoPage() {
  const { dbUser } = await getOnboardingData()

  return (
    <StepShell
      title="Tavo nuotrauka"
      description="Pridėk profilį puošiančią nuotrauką"
      backHref="/onboarding/level"
    >
      <PhotoForm currentAvatarUrl={dbUser?.avatar_url ?? null} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/photo/
git commit -m "feat: onboarding step 5 — photo"
```

---

### Task 9: Step 6 — Availability

**Files:**
- Create: `src/app/(onboarding)/onboarding/availability/actions.ts`
- Create: `src/app/(onboarding)/onboarding/availability/availability-form.tsx`
- Create: `src/app/(onboarding)/onboarding/availability/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

Reads checkboxes named `mon_morning`, `mon_afternoon`, etc. Builds jsonb structure.

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TIMES = ['morning', 'afternoon', 'evening']

export async function saveAvailability(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const availability: Record<string, string[]> = {}
  for (const day of DAYS) {
    const slots = TIMES.filter((t) => formData.get(`${day}_${t}`) === '1')
    if (slots.length) availability[day] = slots
  }

  if (!Object.keys(availability).length) return { error: 'Pasirinkite bent vieną laiką' }
  const parsed = z.record(z.array(z.string())).safeParse(availability)
  if (!parsed.success) return { error: 'Pasirinkite bent vieną laiką' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ availability: parsed.data })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/comfort')
}
```

- [ ] **Step 2: Write `availability-form.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveAvailability } from './actions'

const DAYS = [
  { key: 'mon', label: 'Pr' },
  { key: 'tue', label: 'An' },
  { key: 'wed', label: 'Tr' },
  { key: 'thu', label: 'Ke' },
  { key: 'fri', label: 'Pe' },
  { key: 'sat', label: 'Še' },
  { key: 'sun', label: 'Se' },
]
const TIMES = [
  { key: 'morning', label: 'Rytas' },
  { key: 'afternoon', label: 'Popietė' },
  { key: 'evening', label: 'Vakaras' },
]

type Selected = Set<string>

function initSelected(availability: Record<string, string[]>): Selected {
  const s = new Set<string>()
  for (const [day, times] of Object.entries(availability)) {
    for (const t of times) s.add(`${day}_${t}`)
  }
  return s
}

export function AvailabilityForm({ initialAvailability }: { initialAvailability: Record<string, string[]> }) {
  const [state, formAction, isPending] = useActionState(saveAvailability, { error: null })
  const [selected, setSelected] = useState<Selected>(() => initSelected(initialAvailability))

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-normal text-muted-foreground pb-2 pr-2" />
              {DAYS.map((d) => (
                <th key={d.key} className="text-center font-normal text-muted-foreground pb-2 px-1 min-w-[2.5rem]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((t) => (
              <tr key={t.key}>
                <td className="text-muted-foreground pr-3 py-1 whitespace-nowrap">{t.label}</td>
                {DAYS.map((d) => {
                  const key = `${d.key}_${t.key}`
                  const active = selected.has(key)
                  return (
                    <td key={d.key} className="text-center py-1 px-1">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="w-8 h-8 rounded transition-colors border"
                        style={
                          active
                            ? { backgroundColor: 'var(--brand-green)', borderColor: 'var(--brand-green)' }
                            : { backgroundColor: 'white', borderColor: 'var(--border)' }
                        }
                        aria-label={`${d.label} ${t.label}`}
                        aria-pressed={active}
                      />
                      {active && <input type="hidden" name={key} value="1" />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { AvailabilityForm } from './availability-form'

export default async function AvailabilityPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Kada esi laisva?"
      description="Pažymėk laikus, kada paprastai gali susitikti"
      backHref="/onboarding/photo"
    >
      <AvailabilityForm initialAvailability={(profile?.availability as Record<string, string[]>) ?? {}} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/availability/
git commit -m "feat: onboarding step 6 — availability"
```

---

### Task 10: Step 7 — Comfort

**Files:**
- Create: `src/app/(onboarding)/onboarding/comfort/actions.ts`
- Create: `src/app/(onboarding)/onboarding/comfort/comfort-form.tsx`
- Create: `src/app/(onboarding)/onboarding/comfort/page.tsx`

- [ ] **Step 1: Write `actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  comfort_level: z.coerce.number().int().min(1).max(5),
})

export async function saveComfort(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ comfort_level: formData.get('comfort_level') })
  if (!parsed.success) return { error: 'Pasirinkite lygį nuo 1 iki 5' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ comfort_level: parsed.data.comfort_level })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/waiting')
}
```

- [ ] **Step 2: Write `comfort-form.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'
import { ComfortForm } from './comfort-form'

export default async function ComfortPage() {
  const { profile } = await getOnboardingData()

  return (
    <StepShell
      title="Kiek komfortiškai jauti bendraudama?"
      description="Padės suderinti tave su tinkamomis grupėmis"
      backHref="/onboarding/availability"
    >
      <ComfortForm initialComfort={profile?.comfort_level ?? 3} />
    </StepShell>
  )
}
```

- [ ] **Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/(onboarding)/onboarding/comfort/
git commit -m "feat: onboarding step 7 — comfort"
```

---

### Task 11: Step 8 — Waiting

**Files:**
- Create: `src/app/(onboarding)/onboarding/waiting/page.tsx`

- [ ] **Step 1: Write `page.tsx`**

```tsx
import { getOnboardingData } from '@/lib/onboarding'
import { StepShell } from '@/components/onboarding/step-shell'

export default async function WaitingPage() {
  const { dbUser } = await getOnboardingData()

  return (
    <StepShell title="Ačiū!">
      <div className="space-y-4 text-center">
        <p className="text-lg" style={{ color: 'var(--brand-green)' }}>
          Sveika, {dbUser?.name ?? 'drauge'} 🌙
        </p>
        <p className="text-muted-foreground">
          Tavo profilis peržiūrimas. Kai administratorė patvirtins, gausite laišką el. paštu.
        </p>
        <p className="text-sm text-muted-foreground">
          Paprastai tai užtrunka 1–3 darbo dienas.
        </p>
      </div>
    </StepShell>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(onboarding)/onboarding/waiting/
git commit -m "feat: onboarding step 8 — waiting screen"
```

---

### Task 12: Middleware — protect onboarding routes

**Files:**
- Modify: `middleware.ts`

The middleware already redirects unauthenticated users to `/login` for all non-public paths. `/onboarding/*` is not in `PUBLIC_PATHS`, so unauthenticated users are already blocked. No changes needed — verify this manually.

- [ ] **Step 1: Verify middleware covers onboarding**

Open `middleware.ts`. Confirm `/onboarding` is not in `PUBLIC_PATHS` and does not match `pathname.startsWith('/invite/')` or `pathname.startsWith('/events/')`. It should not — no changes needed.

- [ ] **Step 2: Final type check**

Run: `npx tsc --noEmit`
Expected: no errors across entire project

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: onboarding wizard complete"
```
