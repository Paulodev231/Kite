// Username sign-in on top of Firebase email/password Auth.
//
// Firebase Auth only knows emails, so every account created with a username
// gets a hidden, random login address that nobody ever sees or types. The
// public lookup `usernames/{username}` → { uid, loginEmail } turns the
// username typed on the sign-in screen into that address. Because the login
// address never changes, a person can rename their username freely, and the
// email on their profile is just contact info they can edit at will.
//
// Older accounts made with a real email keep working: anything typed with an
// "@" on the sign-in screen is used as an email directly.
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Same pattern as `usernames/{name}` in firestore.rules. */
const USERNAME_RE = /^[a-z0-9._-]{3,24}$/;

/** Lower-cases and drops spaces / a leading "@" so "  @Ade.P " → "ade.p". */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  return (await getDoc(doc(db(), "usernames", username))).exists();
}

/** The hidden Auth email behind a username, or null if there is none. */
export async function loginEmailFor(username: string): Promise<string | null> {
  const snap = await getDoc(doc(db(), "usernames", username));
  const email = snap.data()?.loginEmail;
  return typeof email === "string" ? email : null;
}

/**
 * A random, never-shown Auth address for a new account. It sits on the
 * project's own Firebase domain so it is always a valid email, and it is
 * random (not the username) so renaming never touches the login.
 */
export function newLoginEmail(): string {
  const id = doc(collection(db(), "usernames")).id.toLowerCase();
  const domain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kite.local";
  return `u-${id}@${domain}`;
}

/**
 * Claims `next` for the signed-in user and frees their old username, in one
 * atomic write. Throws "username-invalid" or "username-taken".
 */
export async function changeOwnUsername(
  uid: string,
  loginEmail: string,
  previous: string | undefined,
  next: string,
) {
  if (!isValidUsername(next)) throw new Error("username-invalid");
  if (next === previous) return;
  if (await isUsernameTaken(next)) throw new Error("username-taken");
  const batch = writeBatch(db());
  batch.update(doc(db(), "users", uid), { username: next });
  batch.set(doc(db(), "usernames", next), { uid, loginEmail });
  if (previous) batch.delete(doc(db(), "usernames", previous));
  await batch.commit();
}
