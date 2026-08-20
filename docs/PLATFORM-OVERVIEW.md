# 🪁 Kite — What We Have Built

A closed-tenant, invite-only **Project Management, Accountability & Community
Support** platform that installs and behaves like a native mobile app.

**Stack:** Next.js + React + TailwindCSS on Vercel · Firebase (Auth, Firestore,
Storage) · 100% free tier · no server code required.

---

## 1. The foundation

| | |
|---|---|
| **Installable app (PWA)** | Adds to the home screen, opens full-screen with its own kite icon, no browser bar |
| **Mobile-first shell** | Bottom tab bar, slide-out drawer, fast screen transitions, notch-safe layout |
| **Invite-only access** | No sign-up screen exists. Accounts are created by admins and credentials handed out privately |
| **Four roles** | Member (project manager) · Staff Handle (operator identity) · Admin · SuperAdmin |
| **Works offline** | Screens already opened still load with no signal; anything typed is queued and sent on reconnect |
| **Notifications** | Unread counts on the DMs, Broadcast and Dashboard tabs, plus device alerts while the app is open or backgrounded |

---

## 2. Communication

- **📢 Main Broadcast** — official announcements. Read-only for everyone;
  only admins (and staff handles) can post, including photos, videos and files.
- **🫶 Community Room** — emoji reactions only. No text, no media, and
  reactions are anonymous.
- **🔐 Private Rooms** — admin-created workspaces. Admins tick exactly who
  gets in. Real-time chat with quote-replies.
- **💬 Direct Messages** — tap any handle or avatar anywhere to open a private
  1-on-1 chat. Members may attach documents; photos and videos are reserved
  for admins and staff handles.
- **⚡ Active Now** — an anonymous live counter in the header showing how many
  people are online, including on-call staff handles, without naming anyone.

---

## 3. Privacy model (enforced by the database, not just the screens)

- Members cannot see the **user directory** — no browsing or looking people up.
- Members cannot see **who else is in a room**.
- Members cannot see **another member's form submissions**.
- Members cannot see **another member's milestones, blockers or funding**.
- Members can **never** upload photos or videos anywhere on the platform.
- Every rule above lives in the Firebase security rules, so it holds even if
  someone bypasses the app entirely.

---

## 4. Projects & accountability

Milestones are **individual** — every project manager runs their own project.
Rooms only group people whose projects are similar in scope.

- **🎯 Milestones** per member: title, status, due date, funding committed and
  funding released, and the blocker if there is one.
- **Four statuses** — 📋 Planned, ⏳ In progress, ⛔ Blocked, ✅ Completed —
  each shown with an icon and words, never colour alone.
- **⏰ Countdowns** — "20 days to go", "🔴 5 days overdue".
- **📊 Member dashboard** — each member sees their own milestones, their
  countdowns, their funding status, and alerts from their administrator.
- **🔔 Admin alerts** — write a timing nudge to one member; tapping their
  milestone auto-writes the sentence ("20 days to X — you should be finishing
  this within 19 days"). You can see whether they read it.
- **💰 Funding tags** — mark a member Funded / Not funded with an amount,
  currency and note. Read-only to them, and impossible to self-assign.

---

## 5. Forms & digital signatures

- Build forms with short text, long text, number, date, yes/no, dropdown and
  **✍️ finger-drawn signature** fields.
- Publish into any room; open or close them to submissions.
- Submissions are strictly private — each member sees only their own and can
  revise it while the form is open; only admins see everything.
- Export any form's responses to a spreadsheet.

---

## 6. Admin & SuperAdmin tooling

- **👥 Members & Accounts** — full directory with emails, create accounts,
  ban/unban, delete, and a complete profile page per person (email, ID, join
  date, funding, their project, alerts sent, rooms, one-touch DM).
- **🔐 Private Rooms** — create rooms and control access member by member.
- **📋 Forms & Signatures** — build forms and review private responses.
- **🎯 Milestones** — record milestones against a member, log hindrances,
  track funding released.
- **📊 Dashboard** — completion rate, blocked count, funding committed vs
  released, milestones by status, a "needs attention" working list, and
  breakdowns by member and by room.
- **📑 Room Reports** — per-room delivery, funding and form response rates,
  exportable to a spreadsheet.
- **🔔 Member Alerts** — write and track timing nudges.
- **🎧 Staff Handles** — operator identities with **no email, no password and
  no sign-in**. Create by name, rename, delete, and toggle On-Call.
- **🎛️ Handle Console** — one screen to run every handle without leaving your
  own session: a unified DM inbox (reply as the handle a member wrote to, or
  start a conversation), post announcements as any handle, and read any room
  to quote-reply as any handle.
- **🧾 Compliance Logs** — append-only audit trail of platform activity
  metadata. No one, not even the SuperAdmin, can edit or delete an entry.

---

## 7. Known limits (free tier, stated honestly)

- **Notifications when the app is fully closed** require a paid server plan.
  Alerts work while the app is open or running in the background.
- **Emails** live in Firebase Authentication and cannot be listed from inside
  the app; Kite records each account's email when you create it, and older
  accounts can have theirs recorded by hand.
- **Deleting an account** removes it from the platform instantly, but its
  login entry must also be removed in the Firebase console if you want to
  reuse that email address.
