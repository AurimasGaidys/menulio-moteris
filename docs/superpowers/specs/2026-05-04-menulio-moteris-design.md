# Menulio Moteris — Design Spec

**Date:** 2026-05-04
**Stack:** Next.js (App Router) + Supabase + Stripe + Vercel
**Language:** Lithuanian
**Design reference:** "Hey Lady!" Figma file (adapted)

---

## Overview

A closed, paid-membership community website for one group of Lithuanian women focused on spirituality, yoga, and menstruation. Guests can browse events publicly; paid members get full access. Coaches create events and can chat with members. Admins manage invites and approvals.

---

## Access Tiers

| Tier | Description | Access |
|---|---|---|
| Guest | Unauthenticated visitor | Browse/view events only |
| Member | Paid subscriber | Full platform access |
| Coach | Paid member + elevated role | Create events, chat with members |
| Admin | Platform manager | Invite management, member approval, content |

---

## Architecture

```
Next.js App Router
├── Public routes      → no auth required
├── Protected routes   → Supabase session required
├── Role gates         → coach/admin middleware checks
└── Payment gate       → Stripe subscription active check

Supabase
├── Auth               → email/password, Google OAuth, magic links (invites)
├── PostgreSQL         → all application data
├── Storage            → user avatars, event thumbnails
└── Realtime           → live chat messages

Stripe
├── Products           → Monthly plan, Yearly plan
├── Subscriptions      → per-user, managed via webhooks
└── Customer Portal    → pause, cancel, update card

Vercel
└── Hosting + Edge functions for Stripe webhooks
```

---

## Pages & Routes

### Public (no auth)
| Route | Description |
|---|---|
| `/` | Landing page with events preview |
| `/events` | Browse events (view only, no join) |
| `/events/[id]` | Event detail (view only) |
| `/login` | Login form |
| `/signup` | Sign up form |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password (from email link) |
| `/invite/[token]` | Invite-based signup + create password |

### Member (authenticated + active subscription)
| Route | Description |
|---|---|
| `/dashboard` | Home dashboard |
| `/events` | Events with join action |
| `/events/[id]` | Event detail + join |
| `/people` | Member directory |
| `/topics` | Discussion board |
| `/topics/[id]` | Topic thread with replies |
| `/memberzine` | Curated content |
| `/messages` | Chat inbox |
| `/messages/[id]` | Individual conversation |
| `/profile/[id]` | Member profile |
| `/settings` | Account, payment, membership |

### Coach (member + coach role)
| Route | Description |
|---|---|
| `/events/create` | Create event form |
| `/events/[id]/edit` | Edit own event |

### Admin
| Route | Description |
|---|---|
| `/admin` | Dashboard: pending approvals, invite management |
| `/admin/invites` | Send and manage invites |
| `/admin/members` | Member list, role assignment |

---

## Auth & Onboarding

### Sign Up
- Email + password or Google OAuth (Supabase Auth)
- On success → 8-step profile wizard

### Login
- Email + password or Google OAuth
- "Welcome Back!" UI

### Forgot / Reset Password
- Email input → Supabase sends reset link → `/reset-password` form

### Invite Flow
- Admin sends invite → Supabase email with token link
- `/invite/[token]` validates token → user creates password → 8-step wizard

### Profile Onboarding Wizard (8 steps)
1. **Vardas** — What's your name?
2. **Vieta** — Is this your location? (auto-detected, confirmable)
3. **Temos** — What do you love talking about? (tags: spirituality, yoga, menstruation, nature, meditation, etc.)
4. **Lygis** — What is your experience level? (slider 1–5)
5. **Nuotrauka** — Upload your photo
6. **Pasiekiamumas** — What's your availability? (weekly schedule grid)
7. **Patogumas** — How comfortable are you discussing these topics? (slider 1–5)
8. **Laukiama** — "While we're reviewing..." pending state → admin approves → Welcome screen

### Payment Gate
- After admin approval, user is prompted to subscribe via Stripe Checkout
- Until subscribed: account exists but member features are locked

---

## Database Schema

### users (extends Supabase auth.users)
```
id              uuid PK (= auth.users.id)
name            text
avatar_url      text
location        text
role            enum('member', 'coach', 'admin')
membership_status enum('pending', 'active', 'paused', 'cancelled')
created_at      timestamptz
```

### profiles
```
id              uuid PK
user_id         uuid FK → users.id
topics          text[]
availability    jsonb  (weekly schedule)
level           int    (1–5)
comfort_level   int    (1–5)
bio             text
```

### memberships
```
id                      uuid PK
user_id                 uuid FK → users.id
stripe_customer_id      text
stripe_subscription_id  text
plan                    enum('monthly', 'yearly')
status                  enum('active', 'paused', 'cancelled')
current_period_end      timestamptz
```

### events
```
id              uuid PK
title           text
description     text
type            text
thumbnail_url   text
host_id         uuid FK → users.id
starts_at       timestamptz
max_attendees   int
created_at      timestamptz
```

### event_attendees
```
event_id        uuid FK → events.id
user_id         uuid FK → users.id
created_at      timestamptz
PRIMARY KEY (event_id, user_id)
```

### topics
```
id              uuid PK
title           text
created_by      uuid FK → users.id
created_at      timestamptz
```

### posts
```
id              uuid PK
topic_id        uuid FK → topics.id
author_id       uuid FK → users.id
body            text
created_at      timestamptz
```

### messages
```
id              uuid PK
sender_id       uuid FK → users.id
recipient_id    uuid FK → users.id
body            text
read_at         timestamptz
created_at      timestamptz
```

### invites
```
id              uuid PK
email           text
token           text UNIQUE
invited_by      uuid FK → users.id
used_at         timestamptz
created_at      timestamptz
```

---

## Feature Details

### Events
- List view and calendar view toggle
- Filters: availability, host type (anyone / coaches / team), event type
- Tabs: All Events / I'm Going To / I'm Hosting / I Went To
- Event card: thumbnail, category tag, date/time, attendee count + avatars, host, CTA
- Guests see "View Details" only; members see "I Will Attend"
- Coaches see "Create Event" button in top bar

### Discussions (Topics)
- Thread list with title, author, reply count, last activity
- Thread detail with ordered posts + reply form
- Coaches can pin topics

### People
- Grid of member avatars + names + topic tags
- Click → profile page

### Memberzine
- Curated articles/content managed by admin/coaches
- Read-only for members

### Messages
- Coach-initiated 1-on-1 chat only (coaches start conversations)
- Realtime via Supabase Realtime subscriptions
- Inbox: list of conversations, unread count
- Conversation view: message bubbles, send form

### Settings
- **Account Settings:** name, avatar, password change
- **Payment details:** saved card, purchase history (with download), current plan + next payment, pause/cancel
- **Membership Settings:** plan cards (monthly/yearly), switch plan, 1-month free promo

### Admin
- Pending member approvals (approve / reject)
- Send invite by email
- View and manage member roles
- Memberzine content management

---

## Stripe Integration

- Two products: Monthly plan, Yearly plan
- Checkout: Stripe Checkout Session (hosted)
- Webhook events handled: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Supabase `memberships` table updated via webhook
- Pause/cancel via Stripe Customer Portal

---

## UI Notes (from Figma)

- **Colour palette:** dark green sidebar, warm beige/cream background, terracotta/orange accent, white cards
- **Typography:** mix of serif (headings) and sans-serif (body)
- **Sidebar nav:** logo top, nav items with icons, Help pinned to bottom
- **Top bar:** search, Create Event (coaches), messages icon, notifications bell, avatar
- **Footer:** For Members / Community / Need Help? columns + social icons (Facebook, Instagram, YouTube)
- All UI copy in **Lithuanian**
