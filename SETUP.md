# 🪁 Kite — Complete Setup Guide (phone-friendly, no coding needed)

Follow these steps **in order**, entirely from your phone's browser. Every
step is free-tier. When you finish, you'll have a live, installable app.

---

## ✅ Step 0 — What you already have

The code is already in your GitHub repository on the branch
`claude/enterprise-pwa-platform-9qucc3`. You don't need to write any code.

**Do this now:** on GitHub, open your repo → tap the branch dropdown (says
`main` or shows branches) → open **Pull requests** → **New pull request** →
merge `claude/enterprise-pwa-platform-9qucc3` into `main` (or just work from
this branch directly in Vercel — Step 3 lets you pick the branch).

---

## 🔥 Step 1 — Create the Firebase project (free)

1. Go to **https://console.firebase.google.com** and sign in with Google.
2. Tap **Create a project** → name it `kite` → you can turn OFF Google
   Analytics → **Create project**.

### 1a. Turn on Email/Password sign-in
1. In the left menu: **Build → Authentication → Get started**.
2. Choose **Email/Password** → toggle **Enable** → **Save**.
   (Do NOT enable anything else. No Google sign-in, no anonymous — this keeps
   the platform closed.)

### 1b. Create the database
1. **Build → Firestore Database → Create database**.
2. Pick the location closest to you → choose **Start in production mode**
   (everything locked — our rules will open exactly what's needed) → **Create**.

### 1c. Turn on file Storage
1. **Build → Storage → Get started** → keep defaults → **Done**.
   (If Storage asks for a billing plan in your region, you can skip Storage
   for now — the app works without file uploads until you enable it.)

---

## 🔐 Step 2 — Install the security rules (VERY important)

The rules are the real lock on your data. Two copy-pastes:

### 2a. Firestore rules
1. **Firestore Database → Rules** tab.
2. Delete everything in the editor.
3. Open the file **`firestore.rules`** in your GitHub repo, tap **Copy raw
   file**, paste it into the editor → **Publish**.

### 2b. Storage rules (skip if you skipped Storage)
1. **Storage → Rules** tab.
2. Replace everything with the contents of **`storage.rules`** from the repo
   → **Publish**.

### 2c. Get your app keys
1. Tap the ⚙️ gear (top-left) → **Project settings**.
2. Scroll to **Your apps** → tap the **`</>`** (Web) icon → nickname `kite`
   → do NOT tick hosting → **Register app**.
3. You'll see a code block with values like `apiKey: "AIza..."`. **Keep this
   page open** — you'll copy these 6 values into Vercel in Step 3.

---

## ▲ Step 3 — Deploy on Vercel (free)

1. Go to **https://vercel.com** → **Sign up → Continue with GitHub**.
2. **Add New… → Project** → find and **Import** your `Kite` repository.
3. Under **Branch**, pick `claude/enterprise-pwa-platform-9qucc3` (or `main`
   if you merged in Step 0).
4. Before deploying, open **Environment Variables** and add these 6, copying
   each value from the Firebase page you kept open in Step 2c:

   | Name | Value from Firebase |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

5. Tap **Deploy**. In ~2 minutes you get a URL like `kite-xxxx.vercel.app`.
6. Back in **Firebase → Authentication → Settings → Authorized domains →
   Add domain** → add your `kite-xxxx.vercel.app` domain.

---

## 👑 Step 4 — Create YOUR SuperAdmin account (one-time, by hand)

The app has no sign-up screen on purpose. Bootstrap yourself:

1. **Firebase → Authentication → Users → Add user** → enter your email and a
   strong password → **Add user**. Copy the **User UID** shown in the list.
2. **Firestore Database → Data** tab → **Start collection** → Collection ID:
   `users` → **Next**.
3. **Document ID:** paste your UID (exactly). Add these fields:
   - `handle` (string) → e.g. `Paul` — the name others see
   - `role` (string) → `superadmin`
   - `active` (boolean) → `true`
4. **Save**. Done — that Firestore document is your crown 👑.

---

## 📱 Step 5 — Sign in & install the app

1. Open your Vercel URL on your phone → sign in with the email/password from
   Step 4.
2. Install it like a native app:
   - **Android/Chrome:** menu ⋮ → **Add to Home screen / Install app**
   - **iPhone/Safari:** Share □↑ → **Add to Home Screen**
3. It opens full-screen with the kite icon — no browser bar.

---

## 🧭 Step 6 — Run your platform (all inside the app)

- **Invite people:** Drawer ☰ → **Admin Panel → Members & Accounts** →
  create an account → privately send them the email + password.
- **Create locked rooms:** **Admin Panel → Private Rooms** → create → tap the
  room → tick exactly who gets in.
- **Staff Handles (SuperAdmin):** create them by name in **Admin Panel →
  Staff Handles** (no email or password), flip them **On-Call/Off-Call**
  there to boost the public "⚡ Active Now" counter, and operate them from
  **Admin Panel → 🎛️ Handle Console** — you never sign in as a handle.
- **Noticeboard:** the 📣 tab — only Admins post; everyone else replies with a
  single emoji reaction per post. Admins can edit, pin and delete posts.
- **DMs:** tap any handle/avatar anywhere → instant private chat.

## 🆙 Phase 2 upgrade (forms, master inbox, compliance logs)

If your app is already live from Phase 1, activating Phase 2 takes ONE step:

1. **Re-paste the Firestore rules.** Firebase Console → **Firestore Database →
   Rules** → delete everything → paste the current contents of
   **`firestore.rules`** from the repo → **Publish**. (Vercel redeploys the
   app code automatically — the rules are the only manual part.)

Then the new features are live:

- **📋 Forms & digital signatures:** Admin Panel → **Forms & Signatures** →
  choose a room → **Build a new form** → add questions (short/long text,
  number, date, yes/no, dropdown, ✍️ signature) → **Publish to room**.
  Members see the form pinned at the top of that room, fill it in, and sign
  with their finger. Submissions are private: each member sees only their
  own; you see everything under **Responses**. Toggle a form **Closed** to
  stop accepting answers.
- **📥 Master Inbox (SuperAdmin):** Admin Panel → **Master Inbox** shows
  every DM sent to any of your managed Staff Handles with 🔴 unread badges.
  Open a conversation and reply — the member sees the reply coming from the
  Staff Handle, not from you. No account switching needed.
- **🧾 Compliance Logs:** Admin Panel → **Compliance Logs** is an append-only
  audit trail (account created, room access changed, form submitted, on-call
  toggled, conversations started…). Metadata only — never message content —
  and no one, not even the SuperAdmin, can edit or delete entries.

## 🆙 Phase 3a upgrade (self-service accounts & moderation)

Same single step as before: **re-paste `firestore.rules`** into Firebase
Console → Firestore Database → Rules → **Publish**. Then:

- **📝 Members control their own identity:** Profile tab → change handle
  (2–24 characters; the security rules stop them touching anything else) and
  change password (asks for the current one first). Every handle change is
  reported to Admins in **Compliance Logs** with the old → new name.
- **⛔ Ban / Unban:** Admin Panel → Members & Accounts. Banning locks the
  account out on their very next action but keeps all their data — fully
  reversible.
- **🗑️ Delete user:** same screen, with a confirmation prompt. Permanently
  removes their profile, room access and presence; they are locked out
  instantly. Admins can delete members; only the SuperAdmin can delete
  Staff Handles and Admins. To reuse the person's email later, also remove
  them under Firebase Console → **Authentication → Users** (the login entry
  can't be deleted from inside the app on the free tier).
- **🧹 Delete content:** Admins see a 🗑️ button on every broadcast post and
  a ✕ on every room message. All deletions are recorded in the compliance
  log.

## 🆙 Phase 3b upgrade (notifications, offline, milestones & dashboard)

Once more: **re-paste `firestore.rules`** into Firebase Console → Firestore
Database → Rules → **Publish** (this adds the new `milestones` collection).
Then:

- **🔔 Notifications & unread badges:** red counts now appear on the
  **DMs** and **Broadcast** tabs, and unread conversations show a red dot.
  Profile tab → **Turn on notifications** to also get device alerts while the
  app is open or in the background.
  *Honest limit:* alerts when the app is **fully closed** need a paid server
  (Cloud Functions), so Kite does not promise those on the free tier.
- **📴 Works offline:** rooms and messages you've already opened still load
  with no signal, and anything you type is queued and sent automatically when
  you reconnect. An amber bar tells the user when they're offline.
- **🎯 Milestones:** Admin Panel → **Milestones** → record a milestone against
  a room, set its funding, then tap a status chip: 📋 Planned, ⏳ In progress,
  ⛔ Blocked (it asks what the hindrance is), ✅ Completed. Tap the money row
  to update how much funding has been released.
- **📊 Dashboard:** Admin Panel → **Dashboard** — completion percentage,
  blocked count, committed vs released funding, milestones by status, and a
  per-room roll-up that puts rooms with blockers first.
- **Members see progress too:** each room shows a collapsible
  “🎯 Project milestones” panel for that room only.

## 🆙 Phase 4 upgrade (due dates, exports & room reports)

**No Firebase step this time** — no new collections, so Vercel's automatic
redeploy is all that's needed. New features:

- **⏰ Due-date reminders:** milestones with a due date now show
  “⏰ due in 3 days” or “🔴 5 days overdue” in the Milestones screen, on the
  Dashboard and inside the room panel members see.
- **🚩 Needs attention:** the Dashboard leads with a working list of
  everything overdue, blocked, or due within 7 days — most urgent first.
- **⬇️ Spreadsheet exports:** tap **CSV** to download
  – all milestones (Admin Panel → Milestones),
  – a form's responses (Admin Panel → Forms & Signatures → Responses),
  – a full room report (Admin Panel → Room Reports).
  The files open in Excel, Google Sheets or Numbers. Signature images can't
  fit in a spreadsheet cell, so they export as “Signature captured ✍️” —
  view the actual signatures in the Responses screen.
- **📑 Room Reports:** Admin Panel → **Room Reports** → pick a room for its
  members count, completion, overdue count, funding, milestone-by-status
  breakdown, and **how many members have responded to each form**.

## 🆙 Member funding tags

**No Firebase step** — the existing rules already cover it.

- **Tag a member:** Admin Panel → **Members & Accounts** → tap
  **💰 Set funding status** under any person → choose **💰 Funded** or
  **○ Not funded** → pick the currency ($, ₦, £, €, ₵, R, KSh), type the
  amount (numbers only, e.g. `200000`) and optionally a note like
  “Tranche 1 of 3” → **Save funding**. It shows as `💰 Funded — $200,000`.
- **The member sees it** on their own **Profile** tab as a read-only card.
  They cannot change it — the security rules let a member edit only their
  handle, so funding can never be self-assigned.
- **Totals:** the top of Members & Accounts shows how many members are
  funded and the total per currency.
- Every funding change is recorded in **Compliance Logs**.

## 🆙 Milestones are per-member (important correction)

⚠️ **This one needs a rules re-paste:** Firebase Console → Firestore Database
→ Rules → paste `firestore.rules` → **Publish**. It stops members seeing each
other's project data.

Milestones belong to **one member each** — every project manager runs their
own project. Rooms just group people whose projects are similar in scope.

- **Recording one:** Admin Panel → Milestones → **“Whose project is this?”**
  is now required; the room is optional grouping.
- **Filter by member** with the dropdown above the list, and export just that
  member's milestones to CSV.
- **Members see only their own:** a “🎯 My project milestones” card on their
  **Profile** tab, and inside a room the panel is titled **My milestones** and
  contains only theirs. They can never see a roommate's progress, blockers or
  funding — enforced by the security rules, not just hidden in the app.
- **Dashboard** now leads its breakdown with **By member**, with **By project
  room** kept underneath (showing how many members each room groups).
- **Room Reports** gained a **Members in this room** section: per-member
  delivered/blocked/overdue counts and funding released.

**If you recorded milestones before this change** they will show
**“⚠️ Unassigned — choose the member…”** in Admin Panel → Milestones. Pick the
right member from that dropdown and they're fixed.

## 🆙 Member dashboards & admin alerts

⚠️ **Re-paste `firestore.rules`** (Firebase Console → Firestore Database →
Rules → Publish) — this adds the new `alerts` collection.

- **Milestones are no longer shown in rooms at all.** Rooms are for chat and
  forms. Each member sees their own project on the **📊 Dashboard** tab
  (the old Profile tab), with a countdown on every milestone —
  “20 days to go”, “🔴 3 days overdue”.
- **🔔 Write alerts to a member:** Admin Panel → **Member Alerts** → choose the
  member → tap one of their milestones and the countdown sentence is written
  for you (e.g. *“20 days to ‘Site survey’ — you should be finishing this
  within 19 days.”*) → edit the wording → **Send alert**.
  It appears on that member's dashboard, notifies their phone, and shows you
  **✅ Read by member** once they've seen it.
- **Staff Handles are excluded from all of this.** They are operator accounts
  run by you — no milestones, no funding tags, no alerts, no project
  dashboard. Only real members appear in those pickers.

## 🆙 Admin: full user profiles & unrestricted access

⚠️ **Re-paste `firestore.rules`** → Publish.

- **Tap any person** in Admin Panel → Members & Accounts to open their full
  profile: email, role, User ID, date created, on-call state, funding, their
  individual project milestones with countdowns, every alert you've sent them
  (and whether it was read), and the rooms they belong to.
- **💬 Send direct message** button right at the top of that profile.
- **Change their role** (SuperAdmin only), ban/unban, or delete — all from the
  same screen.
- **The SuperAdmin now has no restrictions**: you can edit any account
  including other Admins and SuperAdmins, hand out any role, and delete
  anything. Standard Admins can do everything except touch a SuperAdmin
  account or hand out roles — that stays with you. Say the word if you want
  standard Admins unrestricted too.

### About emails
Emails live in Firebase **Authentication**, which the free tier can't list from
inside the app. So Kite now **records the email on the account when you create
it** — every new account shows its email automatically.

Accounts made *before* this change (including your hand-made SuperAdmin) show
**“no email recorded”**. Open their profile → **➕ Record their email** → type
it → Save. Note this is a record for your reference; it does not change their
actual sign-in address, which you'd change in Firebase Console →
Authentication → Users.

## 🆙 The Handle Console

⚠️ **Re-paste `firestore.rules`** → Publish.

Staff Handles have **no email, no password and no sign-in**, and you never
leave your SuperAdmin session to use them.

**Create a handle:** Admin Panel → **Staff Handles** → type a name (e.g.
`Support_Desk`) → **Create handle**. That's the whole form.

**Operate every handle in one place:** Admin Panel → **🎛️ Handle Console**.
Three tabs, and on each one you choose who the message goes out as:

- **📥 DMs** — every conversation any member has with any handle, in one list
  with 🔴 unread dots. Tap a thread to open it inline and reply — the reply
  goes out as the handle that member wrote to. There's also
  *"Start a new conversation as a handle"* to message someone first.
- **📢 Broadcast** — write an announcement, tap **Speaking as** to choose
  yourself or any handle, attach media, post. Recent posts are listed with a
  delete button.
- **🗂️ Rooms** — pick any room, read it, tap **↩︎ Quote** on any message to
  quote it, choose the handle, and send. The quoted text shows above your
  reply for everyone in the room.

You stay signed in as yourself the entire time — the console just decides
whose name each message carries. Members only ever see the handle.

## 🆙 The Noticeboard (Broadcast + Community merged)

⚠️ **Re-paste `firestore.rules`** → Publish.

The separate Broadcast and Community tabs are now one channel: **📣 Noticeboard**.

- You post announcements there (text, photos, videos, files).
- Everyone else replies **only with an emoji** — one reaction each per post,
  tapped again to remove it. Counts show under each post.
- **✏️ Edit** any post after the fact; it quietly shows "edited".
- **📌 Pin** important posts to the top; pinned posts are outlined and listed
  first. Unpin the same way.
- Admins can also edit and delete messages inside project rooms (the ✏️ and ✕
  buttons on each message bubble).

### DM delivery fix
Direct messages were being saved correctly but not appearing in the
recipient's list. The inbox query needed a composite Firestore index that had
never been created, so the listener failed silently and the list showed empty.
Every query in the app has been rewritten so **no index is ever required** —
nothing for you to create in the Firebase console, now or in future.

## 🆙 The "Admin" tag

⚠️ **Re-paste `firestore.rules`** → Publish.

Admins and SuperAdmins now carry a blue **Admin** chip beside their handle
everywhere it appears — Noticeboard posts, room messages, the DM list and the
top of a conversation — so members always know who speaks with authority.

- A SuperAdmin reads simply as **Admin**. Members don't need to know the
  internal hierarchy, only who is in charge.
- Members and Staff Handles carry **no tag**, so a handle still reads as an
  ordinary user.
- Nothing to set up: the first time you open the app after this update your
  account adds itself to the public admin list automatically.

*(Members cannot read other people's profiles — that's the privacy rule — so
the app publishes one tiny doc, `status/admins`, containing admin user IDs and
nothing else. No names, no emails, no roles.)*

## 🆙 Handle reactions & bulk creation

No Firebase step — Vercel's automatic redeploy is all that's needed.

- **Staff Handles react on the Noticeboard — and can stack them.** Admin Panel
  → 🎛️ Handle Console → **Noticeboard** tab. Pick a handle in **Speaking as**,
  then tap emoji on any post: **each tap adds one more**, with a running count
  on the button. A **Clear** link removes everything that handle stacked.
  Reacting as *yourself* stays one-per-post, exactly like a member.
- **Bulk create handles.** Admin Panel → **Staff Handles**: the name box now
  takes a whole list — paste one name per line (or separate with commas) and
  the button reads *"Create 5 handles"*. Duplicates and bad names are skipped
  with a reason and left in the box so you can fix and retry; everything else
  is created.

## 🆙 Room-specific "Active Now"

⚠️ **Re-paste `firestore.rules`** → Publish.

The header counter used to show the same platform-wide number everywhere.
Now it's scoped:

- **Outside a room** (Noticeboard, DMs, Dashboard) it reads
  **"⚡ Active Now: N"** — everyone active anywhere, plus every On-Call Staff
  Handle.
- **Inside a room** it reads **"⚡ In room: N"** — only people currently
  viewing that room, plus On-Call Staff Handles **added to that room**.

**A handle only counts in a room when all three are true:** it is active (not
banned), it is toggled **On-Call**, and it has been **added to that room**.

**Add handles to a room:** Admin Panel → **Private Rooms** → tap the room →
the access panel now has a **Staff Handles in this room** section under the
member list, each showing its On-Call state. Tick the ones that belong there.

The count is recalculated from scratch whenever you change room membership,
toggle On-Call, ban or delete a handle — so it can't drift out of step.

## 🆙 Confirmation codes & dashboard notes

⚠️ **Re-paste `firestore.rules`** → Publish.

**On the member's dashboard** the funding card shows a small chip: **green
✅ Funded** with the amount, or **red ⛔ Not funded**. Underneath there is a
**Confirmation code** box.

**The code is just a record.** The member types in whatever code you gave them
and it is saved on their profile so you can see they entered it. It does not
change their funding by itself — you always set the real figure with
**💰 Set funding status** on their profile.

**📌 Dashboard notes:** Admin Panel → Members & Accounts → tap the member →
**📌 Note on their dashboard**. Write a note that pins to the top of that
member's dashboard. Only they see it. Clear the box and save to remove it.

## 🆙 Bank details for each member

⚠️ **Re-paste `firestore.rules`** → Publish (same paste as above).

Admin Panel → **Members & Accounts** → tap the member → **🏦 Bank details**.
Fill in, by hand:

- **Bank name**
- **Bank website** (you can type `www.bank.com` — it becomes a tappable link)
- **Login**
- **Password** (tap **Show** to check what you typed)

Tap **Save bank details**. They appear on that member's own dashboard, under
their funding card. The website becomes a link they can tap, and the password
is hidden behind a **Show** button so nobody reading over their shoulder sees
it. Leave any box empty and that line simply doesn't show.

**Who can see them:** only that member and Admins. Nobody else — not their
roommates, not Staff Handles.

⚠️ **Please read this once.** These passwords are stored in your database
exactly as you type them. Anyone who gets into your admin account or your
Firebase project can read every member's banking login. Treat this as the most
sensitive thing in the app: use a strong password on your own admin account,
and never share your Firebase login.

## 🆙 Automatic language

The app now translates itself to the language of the phone it is opened on:
**English, French, Spanish, Portuguese and Arabic**. Arabic also flips the
whole layout right-to-left. Nothing to switch on — it just happens.

A member can override it: **Dashboard → 🌍 Language** → tap a flag, or
**✨ Automatic** to go back to following their phone.

The Admin Panel and Handle Console stay in English, since you and your admins
run those.

## 🗺️ Possible next steps

Ask any time for: recurring/repeating milestones, member-visible progress
summaries, or an archive view for completed projects.

Questions? Open this repo in Claude Code and ask — everything above can be
adjusted for you.
