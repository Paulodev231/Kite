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

## Domain model (important)
- **Milestones are per-MEMBER, not per-room.** Every project manager runs
  their own individual project. `milestones/{id}.ownerUid` is the owner;
  `roomId` is optional grouping context only.
- **Rooms group people whose projects are similar in scope** — they are not
  the unit of work and confer no ownership.
- A member reads only milestones where `ownerUid == their uid`, never a
  roommate's progress, blockers or funding. Client queries must be scoped
  accordingly (Firestore rules are not filters — an unscoped query fails).
- Per-member funding tags (`users/{uid}.funded/fundedAmount`) are separate
  from per-milestone funding (`fundedAmount`/`spentAmount`).
- A member may type in the confirmation code they were given
  (`users/{uid}.fundingCode`). It is **recorded, never verified** — it grants
  nothing, and the funding figure itself stays admin-controlled.
- `users/{uid}.bank*` (bankName / bankWebsite / bankLogin / bankPassword) are
  filled in by an Admin for that member. Admin-write only; readable by that
  member and Admins. The password is stored as typed — the most sensitive data
  in the app. Never log it; `setBankDetails` logs metadata only.
- `users/{uid}.dashboardMessage` is an admin-written note pinned to that
  member's own dashboard.
- **Milestones are NEVER shown in rooms.** Members see their own milestones,
  countdowns and admin alerts on their own dashboard (the Profile tab).
- **Project features are for `role === "member"` only.** Staff Handles are
  operator accounts run by the SuperAdmin — no milestones, no funding tags,
  no alerts, no dashboard sections. Admins manage rather than deliver.
- Admins push timing nudges via `alerts/{id}` (targetUid, message,
  optional milestoneId); the recipient may only flip `read`/`readAt`.

## Security model (do not weaken)
- Roles in `users/{uid}.role`: member | staff | admin | superadmin.
- No self-registration. Member/admin accounts minted by admins via a secondary
  Firebase app instance (`src/lib/adminActions.ts`).
- **Staff Handles have NO Auth account** — no email, no password, they never
  sign in. They are `users/{autoId}` docs with `role: "staff"`.
- **There is no "acting as" mode.** The normal app always authors as the
  signed-in user. Handles are operated ONLY from the Handle Console
  (`/admin/console`) via `src/lib/handleActions.ts`, which passes the handle
  explicitly as the author. Rules permit this through `actingAsStaff(uid)`
  (superadmin + target role == staff).
- Members must never see: the user directory, room participant lists
  (`rooms/{id}/acl/members` is admin-only; members read only their own
  `users/{uid}/memberships`), or other users' form submissions.
- Standard members can never upload photos/videos anywhere (storage.rules).
- **Noticeboard** (`broadcast/*`) is the single public channel: admins post,
  everyone else may only write their own key in the post's `reactions` map
  (validated in rules). Admins may also edit/pin posts and edit room messages.
- Members get ONE reaction each (`reactions`: uid -> emoji). Staff Handles
  stack instead (`handleReactions`: handleUid -> emoji -> count, incremented
  per tap from the console). `tallyReactions` sums both; the member rule's
  `hasOnly(['reactions'])` keeps members out of the stacked counters.
- **Never write a Firestore query that filters on one field and sorts by
  another** — it needs a composite index, and without one the listener fails
  silently (this caused DMs to look undelivered). Filter in the query, sort in
  JavaScript.
- Presence is anonymous: `presence/{uid}` holds a timestamp plus the id of the
  room being viewed (nothing else). Outside a room the counter adds
  `status/staff.onCallCount`; inside a room it counts only presence docs with
  that `roomId` plus `rooms/{id}.onCallStaffCount` — handles that are active,
  On-Call AND in that room's ACL. `recountRoomOnCall` recomputes that figure
  from scratch (never increments) on membership/on-call/ban/delete.
- DM thread ids are the two sorted uids joined by `_`, enforced in rules.
- Members cannot read other profiles, so `status/admins` (uids only, world-
  readable to signed-in users) publishes who is an admin; `AdminTag` renders
  the chip from it. Admins self-heal into that list on sign-in, and
  `syncAdminRoster` keeps it current on create/role-change/delete.

## Verify before pushing
`npm run lint && npm run build`

## Language
**The whole app is translated** (en/fr/es/pt/ar) — member screens, the Admin
Panel and the Handle Console alike. Dictionaries live in `src/lib/i18n/`
(`en.ts` is the source of truth; `index.ts` holds the machinery).
`LanguageProvider` follows `navigator.languages`, flips `<html dir>` for Arabic,
and honours an override anyone can set from their dashboard.

- Add a key to `en.ts` first: the other four are typed
  `Record<TranslationKey, string>`, so a missing translation fails the build.
- Interpolate with `t("key", { name })` against `{name}` in the text — never
  concatenate sentence fragments, since word order differs per language.
- Text that pairs with an icon or colour (roles, milestone statuses, log
  categories, form field types) keeps only its icon/colour in `types.ts` and
  carries a translation KEY: see `ROLE_KEYS`, `MILESTONE_STATUS_KEYS`,
  `FORM_FIELD_TYPES[].labelKey`, and `CATEGORY_META` in the logs page.
- The language is read through `useSyncExternalStore`, so the server renders
  English and the browser swaps on hydration — do not "fix" this with
  `setState` in an effect (`react-hooks/set-state-in-effect` fails the lint).

## Roadmap
Phase 2: room-embedded forms + digital signatures (rules stubs exist under
`rooms/{id}/submissions`), centralized staff master inbox, compliance logs.
Phase 3: push notifications, offline queue, milestone dashboards.
