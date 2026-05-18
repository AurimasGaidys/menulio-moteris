# Onboarding Wizard Design

## Goal

An 8-step profile wizard at `/onboarding` that collects new member information after signup/invite, saves each step immediately to the database, and ends in a pending-approval waiting screen.

## Architecture

Separate route per step under a `(onboarding)` route group. Each step is a server component page with a server action. A shared layout renders the progress bar. Client components are used only where required (geolocation, photo crop, availability grid).

```
src/app/(onboarding)/
  layout.tsx                  — progress bar, brand shell
  onboarding/page.tsx         — redirect to first incomplete step
  onboarding/name/page.tsx
  onboarding/location/page.tsx
  onboarding/topics/page.tsx
  onboarding/level/page.tsx
  onboarding/photo/page.tsx
  onboarding/availability/page.tsx
  onboarding/comfort/page.tsx
  onboarding/waiting/page.tsx
```

## Steps

| # | Route | Saves to | UI type |
|---|-------|----------|---------|
| 1 | `/onboarding/name` | `users.name` | Text input |
| 2 | `/onboarding/location` | `profiles.location` | Auto-detect + manual text input |
| 3 | `/onboarding/topics` | `profiles.topics[]` | Tag multi-select |
| 4 | `/onboarding/level` | `profiles.level` | Slider 1–5 |
| 5 | `/onboarding/photo` | `profiles.avatar_url` | In-browser crop + Supabase Storage upload |
| 6 | `/onboarding/availability` | `profiles.availability` | 7-day × time-of-day grid (jsonb) |
| 7 | `/onboarding/comfort` | `profiles.comfort_level` | Slider 1–5 |
| 8 | `/onboarding/waiting` | — (read-only) | Pending approval state UI |

## Navigation

- Users can go back to previous steps (browser back or explicit back button).
- Each step prefills from current DB values so going back shows saved data.
- `/onboarding` reads profile fields in order and redirects to the first incomplete step.
- If all steps are complete, `/onboarding` redirects to `/dashboard`.

## Database Migration Required

`profiles` table needs two new columns added via migration:

```sql
alter table public.profiles add column location text;
alter table public.profiles add column avatar_url text;
```

## Data Persistence

Each step saves immediately on "Next" click via a server action. The `profiles` row is upserted (created on first write, updated on subsequent writes) using `ON CONFLICT (user_id) DO UPDATE`.

## Progress Bar

The shared layout derives the current step from `usePathname()` — no DB column needed. Step order is a fixed array matching the route segments.

## Topics List (Fixed)

```
Menstruacinis ciklas, Joga, Meditacija, Dvasingumas,
Žolelės ir natūrali medicina, Energetinės praktikos,
Moters sveikata, Kūno intuicija, Ritualai,
Motinystė, Savęs pažinimas, Gyvenimo ritmai
```

## Location Step

Browser geolocation API attempts auto-detect on mount. Detected city/region prefills a text input. If permission is denied, the text input appears immediately empty. The value stored is freeform text (city or region name).

## Photo Step

1. User selects image file (max 5 MB, validated client-side).
2. In-browser crop tool (react-image-crop) lets user crop to a square.
3. Cropped blob uploaded to Supabase Storage bucket `avatars/{userId}`.
4. Public URL saved to `profiles.avatar_url`.

## Availability Grid

A 7-column (Mon–Sun) × 3-row (Rytas/Popietė/Vakaras — morning/afternoon/evening) toggle grid. Selected cells stored as jsonb: `{ "mon": ["morning", "evening"], "tue": ["afternoon"], ... }`.

## Error Handling

- **Unauthenticated** — middleware redirects to `/login` (already handled).
- **All steps complete** — `/onboarding` redirects to `/dashboard`.
- **Form validation errors** — server action returns `{ error }`, displayed inline.
- **Location denied** — show manual input immediately, no error shown.
- **Photo too large** — client-side check before upload, friendly inline message.
- **Back navigation** — steps prefill from DB, so saved data is preserved.

## Tech Stack

- Next.js App Router, React 19 `useActionState`, Supabase SSR
- Zod v4 for server action validation
- react-image-crop for photo cropping
- Supabase Storage for avatar uploads
- tailwindcss + brand CSS tokens (`--brand-green`, `--brand-cream`, `--brand-terracotta`)

## Testing

- Server actions: valid input, invalid input (Zod), missing required fields
- `/onboarding` redirect logic: various profile completion states
- Photo upload: oversized file rejected client-side, valid file uploads and saves URL
- Location: geolocation granted prefills input, denied shows empty input
