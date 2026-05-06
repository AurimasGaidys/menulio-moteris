# Plan 1: Project Setup + Auth + Onboarding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js + Supabase project, implement full auth (signup, login, forgot/reset password, invite flow), and the 8-step profile onboarding wizard.

**Architecture:** Next.js App Router with server components and server actions for data mutations. Supabase Auth handles sessions, email/password, Google OAuth, and invite token emails. All UI copy in Lithuanian. Auth middleware protects routes by role and membership status.

**Tech Stack:** Next.js 14+ (App Router), Supabase JS v2, TypeScript, Tailwind CSS, shadcn/ui, Zod (validation), next-intl (i18n optional — Lithuanian strings in constants file for now)

---

## File Map

```
menulio-moteris/
├── app/
│   ├── layout.tsx                          # Root layout, sidebar, top bar
│   ├── page.tsx                            # Landing page (public)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── invite/[token]/page.tsx
│   ├── (onboarding)/
│   │   └── onboarding/
│   │       ├── page.tsx                    # Wizard shell
│   │       └── steps/
│   │           ├── step-name.tsx
│   │           ├── step-location.tsx
│   │           ├── step-topics.tsx
│   │           ├── step-level.tsx
│   │           ├── step-photo.tsx
│   │           ├── step-availability.tsx
│   │           ├── step-comfort.tsx
│   │           └── step-pending.tsx
│   └── (app)/
│       └── dashboard/page.tsx              # Placeholder post-onboarding
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── top-bar.tsx
│   └── ui/                                 # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser client
│   │   ├── server.ts                       # Server client (cookies)
│   │   └── middleware.ts                   # Session refresh
│   ├── actions/
│   │   ├── auth.ts                         # Server actions: login, signup, logout
│   │   ├── invite.ts                       # Server actions: validate/use invite
│   │   └── onboarding.ts                   # Server actions: save each step
│   └── constants/
│       └── lt.ts                           # Lithuanian UI strings
├── middleware.ts                            # Route protection by role/membership
├── supabase/
│   └── migrations/
│       ├── 001_users.sql
│       ├── 002_profiles.sql
│       └── 003_invites.sql
├── .env.local                              # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, etc.
└── package.json
```

---

## Task 1: Scaffold Next.js project with Supabase

**Files:**
- Create: `package.json`, `app/layout.tsx`, `.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/aurimasgaidys/wonderland
npx create-next-app@latest menulio-moteris \
  --typescript --tailwind --eslint --app --src-dir=no \
  --import-alias="@/*"
cd menulio-moteris
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npx shadcn@latest init
npx shadcn@latest add button input label card form toast avatar dropdown-menu tabs
```

- [ ] **Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- [ ] **Step 4: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 6: Create `lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { supabaseResponse, user }
}
```

- [ ] **Step 7: Create `middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname === p) ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/events')

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000 with no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js + Supabase project"
```

---

## Task 2: Database migrations

**Files:**
- Create: `supabase/migrations/001_users.sql`, `supabase/migrations/002_profiles.sql`, `supabase/migrations/003_invites.sql`

- [ ] **Step 1: Install Supabase CLI and init**

```bash
npm install -D supabase
npx supabase init
npx supabase login
npx supabase link --project-ref your_project_ref
```

- [ ] **Step 2: Create `supabase/migrations/001_users.sql`**

```sql
create type user_role as enum ('member', 'coach', 'admin');
create type membership_status as enum ('pending', 'active', 'paused', 'cancelled');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  location text,
  role user_role not null default 'member',
  membership_status membership_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);

-- Allow reading other users' basic info (for member directory)
create policy "Members can read other users"
  on public.users for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
    and u.membership_status = 'active'
  ));
```

- [ ] **Step 3: Create `supabase/migrations/002_profiles.sql`**

```sql
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topics text[] not null default '{}',
  availability jsonb not null default '{}',
  level int check (level between 1 and 5),
  comfort_level int check (comfort_level between 1 and 5),
  bio text,
  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id);

create policy "Active members can read profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
    and u.membership_status = 'active'
  ));
```

- [ ] **Step 4: Create `supabase/migrations/003_invites.sql`**

```sql
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  invited_by uuid references public.users(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

create policy "Admins can manage invites"
  on public.invites for all
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "Anyone can read invite by token"
  on public.invites for select
  using (true);
```

- [ ] **Step 5: Apply migrations**

```bash
npx supabase db push
```

Expected: migrations applied without errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add database migrations for users, profiles, invites"
```

---

## Task 3: Lithuanian string constants

**Files:**
- Create: `lib/constants/lt.ts`

- [ ] **Step 1: Create `lib/constants/lt.ts`**

```typescript
export const lt = {
  auth: {
    login: 'Prisijungti',
    signup: 'Registruotis',
    logout: 'Atsijungti',
    email: 'El. paštas',
    password: 'Slaptažodis',
    forgotPassword: 'Pamiršote slaptažodį?',
    resetPassword: 'Atnaujinti slaptažodį',
    welcomeBack: 'Sveiki sugrįžę!',
    createAccount: 'Išbandykite nemokamai',
    continueWithGoogle: 'Tęsti su Google',
    sendResetLink: 'Siųsti nuorodą',
    checkEmail: 'Patikrinkite el. paštą',
    createPassword: 'Sukurkite slaptažodį',
  },
  onboarding: {
    step1Title: 'Kaip tave vadinti?',
    step1Subtitle: 'Pasakyk mums savo vardą',
    step2Title: 'Ar tai tavo vieta?',
    step2Subtitle: 'Patikrink savo buvimo vietą',
    step3Title: 'Apie ką mėgsti kalbėti?',
    step3Subtitle: 'Pasirink temas, kurios tave domina',
    step4Title: 'Koks tavo lygis?',
    step4Subtitle: 'Įvertink savo patirtį',
    step5Title: 'Įkelk savo nuotrauką',
    step5Subtitle: 'Parodyk bendruomenei, kaip atrodai',
    step6Title: 'Koks tavo pasiekiamumas?',
    step6Subtitle: 'Kada esi laisva susitikti?',
    step7Title: 'Ar jautiesi patogiai?',
    step7Subtitle: 'Kaip komfortiškai jautiesi kalbėdama šiomis temomis?',
    step8Title: 'Laukiame patvirtinimo...',
    step8Subtitle: 'Peržiūrime tavo profilį. Tai užtruks neilgai.',
    next: 'Toliau',
    back: 'Atgal',
    skip: 'Praleisti',
  },
  topics: [
    'Dvasingumas',
    'Joga',
    'Menstruacijos',
    'Meditacija',
    'Gamta',
    'Sveikata',
    'Kūnas',
    'Moters ciklas',
  ],
  nav: {
    home: 'Pagrindinis',
    events: 'Renginiai',
    people: 'Žmonės',
    topics: 'Temos',
    memberzine: 'Memberzine',
    help: 'Pagalba',
  },
  common: {
    save: 'Išsaugoti',
    cancel: 'Atšaukti',
    loading: 'Kraunama...',
    error: 'Įvyko klaida. Bandykite dar kartą.',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants/lt.ts
git commit -m "feat: add Lithuanian UI string constants"
```

---

## Task 4: Root layout and navigation shell

**Files:**
- Create: `app/layout.tsx`, `components/layout/sidebar.tsx`, `components/layout/top-bar.tsx`

- [ ] **Step 1: Create `components/layout/sidebar.tsx`**

```typescript
import Link from 'next/link'
import { Home, Calendar, Users, BookOpen, Leaf, HelpCircle } from 'lucide-react'
import { lt } from '@/lib/constants/lt'

const navItems = [
  { href: '/dashboard', label: lt.nav.home, icon: Home },
  { href: '/events', label: lt.nav.events, icon: Calendar },
  { href: '/people', label: lt.nav.people, icon: Users },
  { href: '/topics', label: lt.nav.topics, icon: BookOpen },
  { href: '/memberzine', label: lt.nav.memberzine, icon: Leaf },
]

export function Sidebar() {
  return (
    <aside className="w-52 min-h-screen bg-[#1B4332] flex flex-col text-white">
      <div className="p-6">
        <Link href="/dashboard">
          <div className="text-xl font-bold">Menulio Moteris</div>
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Icon size={18} />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <HelpCircle size={18} />
          <span className="text-sm">{lt.nav.help}</span>
        </Link>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `components/layout/top-bar.tsx`**

```typescript
import { Search, Bell, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TopBarProps {
  showCreateEvent?: boolean
  userAvatarUrl?: string
  userName?: string
}

export function TopBar({ showCreateEvent, userAvatarUrl, userName }: TopBarProps) {
  return (
    <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input className="pl-9" placeholder="Ieškoti..." />
      </div>
      <div className="flex items-center gap-4">
        {showCreateEvent && (
          <Button className="bg-[#1B4332] hover:bg-[#1B4332]/90">
            Sukurti renginį
          </Button>
        )}
        <button className="relative">
          <MessageCircle size={22} className="text-gray-600" />
        </button>
        <button className="relative">
          <Bell size={22} className="text-gray-600" />
        </button>
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarImage src={userAvatarUrl} />
          <AvatarFallback>{userName?.[0] ?? 'M'}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Menulio Moteris',
  description: 'Moterų bendruomenė',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ app/layout.tsx
git commit -m "feat: add sidebar, top bar, and root layout"
```

---

## Task 5: Login page

**Files:**
- Create: `app/(auth)/login/page.tsx`, `lib/actions/auth.ts`

- [ ] **Step 1: Create `lib/actions/auth.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      name,
      membership_status: 'pending',
      role: 'member',
    })
  }

  redirect('/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` }
  )
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create `app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/actions/auth'
import { lt } from '@/lib/constants/lt'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{lt.auth.welcomeBack}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{lt.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{lt.auth.password}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1B4332]" disabled={loading}>
              {loading ? lt.common.loading : lt.auth.login}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-[#D97706] hover:underline">
              {lt.auth.forgotPassword}
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            Neturi paskyros?{' '}
            <Link href="/signup" className="text-[#D97706] hover:underline">
              {lt.auth.signup}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify login page renders**

```bash
npm run dev
```

Navigate to http://localhost:3000/login — form should render with Lithuanian labels.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login/ lib/actions/auth.ts
git commit -m "feat: add login page and auth server actions"
```

---

## Task 6: Signup, forgot password, reset password pages

**Files:**
- Create: `app/(auth)/signup/page.tsx`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create `app/(auth)/signup/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/lib/actions/auth'
import { lt } from '@/lib/constants/lt'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{lt.auth.createAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vardas</Label>
              <Input id="name" name="name" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{lt.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{lt.auth.password}</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1B4332]" disabled={loading}>
              {loading ? lt.common.loading : lt.auth.signup}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Jau turi paskyrą?{' '}
            <Link href="/login" className="text-[#D97706] hover:underline">
              {lt.auth.login}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(auth)/forgot-password/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { forgotPassword } from '@/lib/actions/auth'
import { lt } from '@/lib/constants/lt'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
        <Card className="w-full max-w-sm text-center p-6">
          <p className="text-lg font-medium">Patikrinkite el. paštą</p>
          <p className="text-sm text-gray-500 mt-2">Išsiuntėme nuorodą slaptažodžio atnaujinimui.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{lt.auth.forgotPassword}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{lt.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1B4332]" disabled={loading}>
              {loading ? lt.common.loading : lt.auth.sendResetLink}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(auth)/reset-password/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resetPassword } from '@/lib/actions/auth'
import { lt } from '@/lib/constants/lt'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await resetPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{lt.auth.resetPassword}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Naujas slaptažodis</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Pakartokite slaptažodį</Label>
              <Input id="confirm" name="confirm" type="password" required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1B4332]" disabled={loading}>
              {loading ? lt.common.loading : lt.auth.resetPassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add signup, forgot-password, reset-password pages"
```

---

## Task 7: Invite flow

**Files:**
- Create: `app/(auth)/invite/[token]/page.tsx`, `lib/actions/invite.ts`

- [ ] **Step 1: Create `lib/actions/invite.ts`**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function validateInvite(token: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .single()
  return data
}

export async function acceptInvite(formData: FormData) {
  const supabase = await createClient()
  const token = formData.get('token') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const invite = await validateInvite(token)
  if (!invite) return { error: 'Kvietimas nebegalioja.' }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      name,
      membership_status: 'pending',
      role: 'member',
    })
    await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
  }

  redirect('/onboarding')
}
```

- [ ] **Step 2: Create `app/(auth)/invite/[token]/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { acceptInvite, validateInvite } from '@/lib/actions/invite'
import { lt } from '@/lib/constants/lt'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    validateInvite(token).then(invite => setValid(!!invite))
  }, [token])

  if (valid === null) return <div className="min-h-screen flex items-center justify-center">Kraunama...</div>

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
        <Card className="w-full max-w-sm text-center p-6">
          <p className="text-lg font-medium text-red-600">Kvietimas nebegalioja</p>
        </Card>
      </div>
    )
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append('token', token)
    const result = await acceptInvite(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F0]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{lt.auth.createPassword}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vardas</Label>
              <Input id="name" name="name" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{lt.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{lt.auth.password}</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1B4332]" disabled={loading}>
              {loading ? lt.common.loading : 'Pradėti'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/invite/ lib/actions/invite.ts
git commit -m "feat: add invite-based signup flow"
```

---

## Task 8: Onboarding wizard shell

**Files:**
- Create: `app/(onboarding)/onboarding/page.tsx`, `lib/actions/onboarding.ts`

- [ ] **Step 1: Create `lib/actions/onboarding.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveOnboardingStep(step: number, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neprisijungta' }

  if (step === 1) {
    await supabase.from('users').update({ name: data.name }).eq('id', user.id)
  } else if (step === 2) {
    await supabase.from('users').update({ location: data.location }).eq('id', user.id)
  } else if (step >= 3) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const profileData: Record<string, unknown> = { user_id: user.id }
    if (step === 3) profileData.topics = data.topics
    if (step === 4) profileData.level = data.level
    if (step === 6) profileData.availability = data.availability
    if (step === 7) profileData.comfort_level = data.comfort_level

    if (existing) {
      await supabase.from('profiles').update(profileData).eq('user_id', user.id)
    } else {
      await supabase.from('profiles').insert(profileData)
    }
  }

  revalidatePath('/onboarding')
  return { success: true }
}
```

- [ ] **Step 2: Create `app/(onboarding)/onboarding/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { StepName } from './steps/step-name'
import { StepLocation } from './steps/step-location'
import { StepTopics } from './steps/step-topics'
import { StepLevel } from './steps/step-level'
import { StepPhoto } from './steps/step-photo'
import { StepAvailability } from './steps/step-availability'
import { StepComfort } from './steps/step-comfort'
import { StepPending } from './steps/step-pending'

const TOTAL_STEPS = 8

export default function OnboardingPage() {
  const [step, setStep] = useState(1)

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="min-h-screen bg-[#FDF6F0] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {step < TOTAL_STEPS && (
          <div className="flex gap-1 mb-8">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i < step ? 'bg-[#1B4332]' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        )}
        {step === 1 && <StepName onNext={next} />}
        {step === 2 && <StepLocation onNext={next} onBack={back} />}
        {step === 3 && <StepTopics onNext={next} onBack={back} />}
        {step === 4 && <StepLevel onNext={next} onBack={back} />}
        {step === 5 && <StepPhoto onNext={next} onBack={back} />}
        {step === 6 && <StepAvailability onNext={next} onBack={back} />}
        {step === 7 && <StepComfort onNext={next} onBack={back} />}
        {step === 8 && <StepPending />}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(onboarding)/ lib/actions/onboarding.ts
git commit -m "feat: add onboarding wizard shell"
```

---

## Task 9: Onboarding steps (1–4)

**Files:**
- Create: `app/(onboarding)/onboarding/steps/step-name.tsx`, `step-location.tsx`, `step-topics.tsx`, `step-level.tsx`

- [ ] **Step 1: Create `step-name.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

export function StepName({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleNext() {
    if (!name.trim()) return
    setLoading(true)
    await saveOnboardingStep(1, { name })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">1 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step1Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step1Subtitle}</p>
      </div>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Vardas"
        className="text-lg h-12"
      />
      <Button
        onClick={handleNext}
        disabled={!name.trim() || loading}
        className="bg-[#1B4332] px-8"
      >
        {loading ? lt.common.loading : lt.onboarding.next}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Create `step-location.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

export function StepLocation({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simple reverse geocode attempt using browser API
    navigator.geolocation?.getCurrentPosition(async pos => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        )
        const data = await res.json()
        setLocation(data.address?.city || data.address?.town || '')
      } catch {}
    })
  }, [])

  async function handleNext() {
    setLoading(true)
    await saveOnboardingStep(2, { location })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">2 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step2Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step2Subtitle}</p>
      </div>
      <Input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Miestas"
        className="text-lg h-12"
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `step-topics.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

export function StepTopics({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggle(topic: string) {
    setSelected(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  async function handleNext() {
    setLoading(true)
    await saveOnboardingStep(3, { topics: selected })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">3 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step3Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step3Subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {lt.topics.map(topic => (
          <button
            key={topic}
            onClick={() => toggle(topic)}
            className={`px-4 py-2 rounded-full border text-sm transition-colors ${
              selected.includes(topic)
                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                : 'border-gray-300 hover:border-[#1B4332]'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading || selected.length === 0} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `step-level.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

const LABELS = ['Pradedančioji', 'Besimokančioji', 'Vidutinė', 'Pažengusioji', 'Ekspertė']

export function StepLevel({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [level, setLevel] = useState(3)
  const [loading, setLoading] = useState(false)

  async function handleNext() {
    setLoading(true)
    await saveOnboardingStep(4, { level })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">4 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step4Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step4Subtitle}</p>
      </div>
      <div className="space-y-4">
        <input
          type="range"
          min={1}
          max={5}
          value={level}
          onChange={e => setLevel(Number(e.target.value))}
          className="w-full accent-[#1B4332]"
        />
        <div className="flex justify-between text-xs text-gray-500">
          {LABELS.map(l => <span key={l}>{l}</span>)}
        </div>
        <p className="text-center font-semibold text-[#1B4332]">{LABELS[level - 1]}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(onboarding)/onboarding/steps/
git commit -m "feat: add onboarding steps 1-4 (name, location, topics, level)"
```

---

## Task 10: Onboarding steps (5–8) + dashboard placeholder

**Files:**
- Create: `step-photo.tsx`, `step-availability.tsx`, `step-comfort.tsx`, `step-pending.tsx`, `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create `step-photo.tsx`**

```typescript
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { lt } from '@/lib/constants/lt'

export function StepPhoto({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  async function handleNext() {
    const file = inputRef.current?.files?.[0]
    if (!file) { onNext(); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar`, file, { upsert: true })
      if (data) {
        const { data: url } = supabase.storage.from('avatars').getPublicUrl(data.path)
        await supabase.from('users').update({ avatar_url: url.publicUrl }).eq('id', user.id)
      }
    }
    setLoading(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">5 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step5Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step5Subtitle}</p>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden mx-auto"
      >
        {preview
          ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
          : <span className="text-gray-400 text-sm text-center">Spustelėk norėdama pridėti</span>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `step-availability.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

const DAYS = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Š', 'S']
const TIMES = ['Rytas', 'Diena', 'Vakaras']

export function StepAvailability({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  function toggle(day: string, time: string) {
    const key = `${day}-${time}`
    setSelected(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleNext() {
    setLoading(true)
    await saveOnboardingStep(6, { availability: selected })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">6 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step6Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step6Subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-normal pb-2 pr-4"></th>
              {DAYS.map(d => <th key={d} className="text-center text-gray-500 font-medium pb-2 px-1">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(time => (
              <tr key={time}>
                <td className="text-gray-500 pr-4 py-1">{time}</td>
                {DAYS.map(day => {
                  const key = `${day}-${time}`
                  return (
                    <td key={day} className="px-1 py-1 text-center">
                      <button
                        onClick={() => toggle(day, time)}
                        className={`w-8 h-8 rounded ${selected[key] ? 'bg-[#1B4332]' : 'bg-gray-100 hover:bg-gray-200'}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `step-comfort.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveOnboardingStep } from '@/lib/actions/onboarding'
import { lt } from '@/lib/constants/lt'

const LABELS = ['Labai nepatogiai', 'Nepatogiai', 'Neutraliai', 'Patogiai', 'Labai patogiai']

export function StepComfort({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [comfort, setComfort] = useState(3)
  const [loading, setLoading] = useState(false)

  async function handleNext() {
    setLoading(true)
    await saveOnboardingStep(7, { comfort_level: comfort })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#D97706] font-medium">7 / 7</p>
        <h1 className="text-3xl font-bold mt-1">{lt.onboarding.step7Title}</h1>
        <p className="text-gray-500 mt-2">{lt.onboarding.step7Subtitle}</p>
      </div>
      <div className="space-y-4">
        <input
          type="range"
          min={1}
          max={5}
          value={comfort}
          onChange={e => setComfort(Number(e.target.value))}
          className="w-full accent-[#1B4332]"
        />
        <div className="flex justify-between text-xs text-gray-500">
          {LABELS.map(l => <span key={l} className="text-center" style={{ maxWidth: 60 }}>{l}</span>)}
        </div>
        <p className="text-center font-semibold text-[#1B4332]">{LABELS[comfort - 1]}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{lt.onboarding.back}</Button>
        <Button onClick={handleNext} disabled={loading} className="bg-[#1B4332] px-8">
          {loading ? lt.common.loading : lt.onboarding.next}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `step-pending.tsx`**

```typescript
export function StepPending() {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🌙</div>
      <h1 className="text-3xl font-bold">{lt.onboarding.step8Title}</h1>
      <p className="text-gray-500 max-w-sm mx-auto">{lt.onboarding.step8Subtitle}</p>
      <div className="flex justify-center gap-2 mt-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#1B4332] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// Add missing import at top of file
import { lt } from '@/lib/constants/lt'
```

- [ ] **Step 5: Create `app/(app)/dashboard/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, avatar_url, role, membership_status')
    .eq('id', user.id)
    .single()

  if (profile?.membership_status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FDF6F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">🌙</div>
          <h1 className="text-2xl font-bold">Laukiame patvirtinimo</h1>
          <p className="text-gray-500">Administratorius netrukus patvirtins jūsų paskyrą.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#FDF6F0]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar
          showCreateEvent={profile?.role === 'coach' || profile?.role === 'admin'}
          userAvatarUrl={profile?.avatar_url ?? undefined}
          userName={profile?.name ?? undefined}
        />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Sveika, {profile?.name}! 👋</h1>
          <p className="text-gray-500 mt-2">Tai tik pradžia — kiti moduliai netrukus.</p>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(onboarding)/onboarding/steps/ app/(app)/dashboard/
git commit -m "feat: add onboarding steps 5-8 and dashboard placeholder"
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Test full signup → onboarding → pending flow**

```bash
npm run dev
```

1. Go to http://localhost:3000/signup
2. Create account → should redirect to /onboarding
3. Complete all 8 steps
4. Should land on step-pending screen
5. In Supabase dashboard, update `users.membership_status` to `active` for the test user
6. Navigate to http://localhost:3000/dashboard
7. Should see sidebar + "Sveika, [name]!" message

- [ ] **Step 2: Test login flow**

1. Go to http://localhost:3000/login
2. Sign in with the test account
3. Should redirect to /dashboard

- [ ] **Step 3: Test invite flow**

1. In Supabase dashboard, insert a row into `invites` table: `{ email: 'test@test.com', token: 'test-token-123' }`
2. Go to http://localhost:3000/invite/test-token-123
3. Fill in name, email, password → should go to /onboarding

- [ ] **Step 4: Test route protection**

1. Sign out
2. Go to http://localhost:3000/dashboard
3. Should redirect to /login

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete Plan 1 - auth, onboarding, and project setup"
```

---

## Self-Review

**Spec coverage:**
- ✅ Project scaffold (Next.js + Supabase + Tailwind + shadcn/ui)
- ✅ DB migrations (users, profiles, invites)
- ✅ Auth: login, signup, forgot/reset password
- ✅ Invite flow
- ✅ 8-step onboarding wizard (all steps)
- ✅ Lithuanian strings
- ✅ Route protection middleware
- ✅ Dashboard placeholder with role-aware top bar
- ✅ Pending approval state

**Not in this plan (covered in later plans):**
- Stripe payment gate (Plan 7)
- Admin approval UI (Plan 8)
- Google OAuth (add `supabase.auth.signInWithOAuth` to auth actions — straightforward addition after setup)
