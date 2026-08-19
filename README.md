# 🪁 Kite — Enterprise Project Ops Hub

A closed-tenant, invite-only **Project Management, Accountability & Community
Support** platform that installs and behaves like a native mobile app (PWA).

**Stack:** Next.js (App Router) + React + TailwindCSS on **Vercel** ·
**Firebase** (Authentication, Cloud Firestore real-time data, Storage).
100% free-tier.

> 🚀 **New here? Open [`SETUP.md`](./SETUP.md)** — a phone-friendly,
> step-by-step guide from zero to a live installed app.

## What's built (Phase 1)

| Area | Status |
|---|---|
| Native-feel PWA shell (bottom nav, drawer, transitions, installable) | ✅ |
| Invite-only auth — no public sign-up, Admin-minted accounts | ✅ |
| 📢 Main Broadcast Channel — read-only, Admin-posted media | ✅ |
| 🫶 General Community Room — emoji reactions ONLY | ✅ |
| 🔐 Admin-locked private rooms with member toggle panel | ✅ |
| Hidden directories & hidden participant lists for members | ✅ |
| ⚡ Anonymous "Active Now" presence counter | ✅ |
| 💬 One-touch DMs (tap any handle/avatar) — docs only for members | ✅ |
| 🎧 Managed Staff Handles + real-time On-Call presence control | ✅ |
| Role hierarchy: member / staff / admin / superadmin | ✅ |
| Firestore + Storage security rules enforcing all of the above | ✅ |
| 📋 Room-embedded forms & ✍️ digital signatures (private submissions) | ✅ Phase 2 |
| 📥 Centralized Staff master inbox — 🔴 badges, reply-as-handle | ✅ Phase 2 |
| 🧾 Append-only compliance & event logs | ✅ Phase 2 |
| 📝 Self-service handle & password changes (Admin-notified) | ✅ Phase 3a |
| ⛔ Ban/unban, 🗑️ delete users, 🧹 delete posts & messages | ✅ Phase 3a |
| Push notifications, offline queue, milestone dashboards | 🔜 Phase 3b |

## Project map

```
src/
  app/
    login/              Invite-only sign-in
    (app)/              Everything behind auth
      broadcast/        Main Broadcast Channel
      community/        Emoji-only community room
      rooms/ + [id]/    Private rooms list & chat
      messages/         DM inbox & one-touch threads
      profile/          Own profile & sign-out
      admin/            Admin Panel (users, rooms, staff handles)
  components/           App shell, composer, presence counter…
  context/AuthContext   Session, role, presence heartbeat
  lib/                  Firebase init, types, admin actions, uploads
firestore.rules         THE security model — paste into Firebase
storage.rules           Media permissions — paste into Firebase
SETUP.md                Foolproof deployment guide
```

## Local development

```bash
cp .env.local.example .env.local   # fill in your Firebase keys
npm install
npm run dev
```
