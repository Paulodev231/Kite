# Kite — project notes for Claude Code

Closed-tenant, invite-only enterprise PM/accountability platform. Owner is a
beginner building from a phone — keep explanations simple and step-by-step,
and never assume a local terminal is available.

## Stack & constraints
- Next.js App Router + TypeScript + Tailwind v4, deployed on Vercel (free tier).
- Firebase client SDK only: Auth (email/password), Firestore, Storage.
  NO Cloud Functions / Admin SDK (requires paid plan) — admin operations run
  client-side and are enforced by `firestore.rules` / `storage.rules`.
- All Firebase pages are client components; `src/lib/firebase.ts` guards
  missing env vars so `next build` passes without configuration.

## Security model (do not weaken)
- Roles in `users/{uid}.role`: member | staff | admin | superadmin.
- No self-registration. Accounts minted by admins via a secondary Firebase
  app instance (`src/lib/adminActions.ts`).
- Members must never see: the user directory, room participant lists
  (`rooms/{id}/acl/members` is admin-only; members read only their own
  `users/{uid}/memberships`), or other users' form submissions.
- Standard members can never upload photos/videos anywhere (storage.rules).
- Community room accepts emoji-reaction docs only (validated in rules).
- Presence is anonymous: `presence/{uid}` holds only a timestamp; the
  counter adds `status/staff.onCallCount` (superadmin-managed).
- DM thread ids are the two sorted uids joined by `_`, enforced in rules.

## Verify before pushing
`npm run lint && npm run build`

## Roadmap
Phase 2: room-embedded forms + digital signatures (rules stubs exist under
`rooms/{id}/submissions`), centralized staff master inbox, compliance logs.
Phase 3: push notifications, offline queue, milestone dashboards.
