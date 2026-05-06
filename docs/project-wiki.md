# Menulio Moteris — Project Wiki

> Lithuanian women's community platform focused on spirituality, yoga, and menstruation topics.
> Design reference: "Hey Lady!" Figma file (adapted, not copied 1:1).
> Stack: Next.js + Supabase + Vercel

---

## Overview

A closed community website for one group of Lithuanian women. Members sign up via invite or registration flow. Coaches can create events; members attend and discuss.

---

## Roles

| Role | Description |
|---|---|
| Member | Standard community member — can attend events, discuss topics |
| Coach | Can create and host events |
| Admin | Manages invites, approves members |

---

## Navigation (sidebar)

- Home
- Events
- People
- Topics
- Memberzine
- Help

---

## Auth & Onboarding Flows

### Sign Up
- Email + social login (Google)
- "Try for free" entry point

### Login
- Email/password ("Welcome Back!")
- Two states (empty / filled)

### Forgot Password
- Email input → confirmation screen (email sent)

### Reset Password
- Two states (form / success)

### Invite Flow
- User receives email invite → clicks link → lands on "Create Password for Hey Lady!" screen (grey background)
- Creates password → enters main onboarding

### Profile Onboarding (multi-step wizard, 8 steps)
1. What's your name?
2. Is this your location? (auto-detected)
3. What do you love talking about? (topic tags — adapted: spirituality, yoga, menstruation, etc.)
4. What is your level? (slider — adapted from English level)
5. Please upload your photo
6. What's your availability? (schedule grid)
7. Are you comfortable speaking about [topic]? (slider)
8. "While we're reviewing..." (waiting/approval state)
9. Welcome screen (illustrated)

---

## Events Page

### Tabs
- All Events
- I'm going To
- I'm hosting
- I went to

### Filters
- Available when I am (time-based)
- Host by anyone / Coaches / Team
- All event types

### View toggle: List / Calendar

### Event card
- Thumbnail image
- Category tag + date/time
- Attendee count (+N with avatar stack)
- Event title
- Host name + avatar
- CTA: "I Will Attend" (primary) or "View Details" (outline)

### Create Event
- Button visible in top bar, available to coaches only

---

## Member Progression / Badges

| Level | Description | Unlocked Features |
|---|---|---|
| Community guest | Preview of basic pages | Limited access |
| Verified account | Fully onboarded member | Learning materials, Community chats, 1-on-1, Classes, Topic group events |
| Little sister | Active member | In-Person Meetups, Group Chat, Study Group, Host Training |
| 6 month+ | Long-term member | Custom Topics, Deep dive topics, Teacher Talk, Review & Feedback |
| 12 month+ | Senior member | Mentor role |

---

## Help / FAQ Page

### Tabs: FAQ | Contact us

### FAQ Categories
- Our community
- My account
- Meeting People
- Lessons
- Events
- How it works

### FAQ items (My Account section)
- Profile progress (expanded by default)
- Benefits for filling personal profile
- How to turn off all notifications?
- Does someone have access to my personal information?
- How to deactivate my account?

---

## Settings Page

### Tabs
- Account Settings
- Payment details
- Membership Settings

### Payment details tab
- Saved card (VISA) with Remove Card action
- Expired card error state
- Current membership plan: name, price, next payment date, Pause | Cancel actions
- Link to Membership Settings to switch plans
- Purchase history table: Date, Description, Price, Card, Download receipt

### Membership Settings tab
- Two plan cards (e.g., Monthly and Yearly) with pricing shown as weekly equivalent
- "Switch" button on non-active plan
- "Current Plan" + "Pause membership" on active plan
- Free month promo card: "You have 1 Month of Free Membership!" with "Use" button

### Pricing observed in design (Hey Lady! reference)
- First 3 months: $149 USD
- Monthly: $29 USD/mo
- Yearly: $199 USD/yr

> **Decision:** Paid membership required. Guests can browse/view events without membership but must pay to join/attend. Payment via Stripe.

---

## Messaging / Chat

- Coaches can initiate 1-on-1 chat with members
- No design provided — needs to be designed from scratch or use a simple pattern
- Likely: chat icon in top bar (seen in events screen), inbox/conversation list, individual conversation view
- Supabase Realtime is a good fit for this

---

## Pages Still To Document

- [ ] Home / Dashboard
- [ ] People page
- [ ] Topics / Discussion board
- [ ] Memberzine
- [ ] Profile page (user's own)
- [ ] Event detail page
- [ ] Create Event form
- [ ] Notifications / Messages

---

## Key Decisions

- **Language:** Lithuanian
- **Community type:** Closed, single group
- **Stack:** Next.js + Supabase + Vercel
- **Auth:** Supabase Auth (email/password + Google + invite links)
- **Content focus:** Spirituality, yoga, menstruation (not English-learning)
