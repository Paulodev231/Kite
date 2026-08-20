// Admin-only operations, callable from the Admin Panel UI.
// Security rules enforce all of these server-side as well — the UI checks
// are for experience, the rules are the actual lock.
import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, firebaseAuth } from "@/lib/firebase";
import { logEvent } from "@/lib/log";
import type { Role } from "@/lib/types";

function actorUid(): string {
  return firebaseAuth().currentUser?.uid ?? "unknown";
}

/**
 * Keeps status/admins in step with who is actually an admin. That doc is the
 * only way members — who cannot read other profiles — learn which handles
 * carry the "Admin" tag. It holds uids and nothing else.
 */
async function syncAdminRoster(uid: string, isAdminRole: boolean) {
  await setDoc(
    doc(db(), "status", "admins"),
    { uids: isAdminRole ? arrayUnion(uid) : arrayRemove(uid) },
    { merge: true },
  ).catch(() => {});
}

/**
 * Recounts, exactly, how many Staff Handles are BOTH On-Call AND added to a
 * given room, and stores it on the room. A room's "Active Now" uses this, so
 * its number reflects that room rather than the whole platform.
 *
 * Recomputed from scratch (never incremented) so the figure cannot drift out
 * of step with reality.
 */
export async function recountRoomOnCall(roomId: string) {
  try {
    const aclSnap = await getDoc(doc(db(), "rooms", roomId, "acl", "members"));
    const uids: string[] = aclSnap.data()?.uids ?? [];
    let count = 0;
    for (const uid of uids) {
      const userSnap = await getDoc(doc(db(), "users", uid));
      const u = userSnap.data();
      if (u?.role === "staff" && u?.active !== false && u?.onCall === true) count += 1;
    }
    await updateDoc(doc(db(), "rooms", roomId), { onCallStaffCount: count });
  } catch {
    // Never let a counter refresh break the action that triggered it.
  }
}

/** Recounts every room a given user belongs to. */
async function recountRoomsFor(uid: string) {
  try {
    const memberships = await getDocs(collection(db(), "users", uid, "memberships"));
    for (const m of memberships.docs) await recountRoomOnCall(m.id);
  } catch {}
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Creates a new account WITHOUT signing the current Admin out. Uses a
 * throwaway secondary Firebase app so the Admin's own session is untouched.
 * The Admin then hands the credentials to the invited member (closed,
 * invite-only model — there is no public sign-up).
 */
export async function createManagedAccount(
  email: string,
  password: string,
  handle: string,
  role: Role,
): Promise<string> {
  const secondary = initializeApp(firebaseConfig, `acct-mgr-${Date.now()}`);
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(secondary), email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db(), "users", uid), {
      handle,
      // Recorded so Admins can see it in the directory — Firebase Auth remains
      // the source of truth for the actual login.
      email,
      role,
      active: true,
      ...(role === "staff" ? { onCall: false } : {}),
      createdAt: serverTimestamp(),
    });
    await signOut(getAuth(secondary));
    if (role === "admin") await syncAdminRoster(uid, true);
    logEvent(actorUid(), "account_created", { newUid: uid, role });
    return uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

/**
 * Tags a member as Funded / Not funded with an amount. Admin-only: the
 * security rules let members edit their handle and nothing else, so a member
 * can never mark themselves funded.
 */
export async function setUserFunding(
  uid: string,
  funded: boolean,
  amount: number,
  currency: string,
  note: string,
) {
  await updateDoc(doc(db(), "users", uid), {
    funded,
    fundedAmount: funded ? amount : 0,
    fundedCurrency: currency,
    fundedNote: note,
    fundedAt: serverTimestamp(),
  });
  logEvent(actorUid(), funded ? "funding_granted" : "funding_cleared", {
    uid,
    amount: String(funded ? amount : 0),
  });
}

/**
 * Creates a Managed Staff Handle — an operator identity with NO login of its
 * own. There is no email and no password: the SuperAdmin switches into the
 * handle from inside the app and posts, reacts and replies as it.
 * To members it looks like any other user.
 */
export async function createStaffHandle(handle: string): Promise<string> {
  const ref = doc(collection(db(), "users"));
  await setDoc(ref, {
    handle: handle.trim(),
    role: "staff",
    active: true,
    onCall: false,
    managed: true, // operated by the SuperAdmin, never signs in
    createdAt: serverTimestamp(),
  });
  logEvent(actorUid(), "staff_handle_created", { uid: ref.id });
  return ref.id;
}

export interface BulkHandleResult {
  created: string[];
  skipped: { name: string; reason: string }[];
}

/**
 * Creates several Staff Handles at once from a pasted list. Names are trimmed,
 * de-duplicated against each other and against handles that already exist, and
 * validated for length. One bad line never stops the rest.
 */
export async function createStaffHandles(
  rawNames: string[],
  existingHandles: string[] = [],
): Promise<BulkHandleResult> {
  const result: BulkHandleResult = { created: [], skipped: [] };
  const taken = new Set(existingHandles.map((h) => h.toLowerCase()));

  for (const raw of rawNames) {
    const name = raw.trim();
    if (!name) continue;
    if (name.length < 2 || name.length > 24) {
      result.skipped.push({ name, reason: "must be 2–24 characters" });
      continue;
    }
    if (taken.has(name.toLowerCase())) {
      result.skipped.push({ name, reason: "that handle already exists" });
      continue;
    }
    try {
      await createStaffHandle(name);
      taken.add(name.toLowerCase());
      result.created.push(name);
    } catch {
      result.skipped.push({ name, reason: "could not be created" });
    }
  }
  return result;
}

export async function renameStaffHandle(uid: string, handle: string) {
  await updateDoc(doc(db(), "users", uid), { handle: handle.trim() });
  logEvent(actorUid(), "staff_handle_renamed", { uid });
}

/**
 * Records (or corrects) the email shown in the admin directory for accounts
 * created before emails were stored — including the hand-made SuperAdmin.
 * This is a record only: it does NOT change the person's actual login, which
 * lives in Firebase Auth.
 */
export async function setUserEmailRecord(uid: string, email: string) {
  await updateDoc(doc(db(), "users", uid), { email: email.trim() });
  logEvent(actorUid(), "email_recorded", { uid });
}

/** SuperAdmin: change someone's role. */
export async function setUserRole(uid: string, role: Role) {
  await updateDoc(doc(db(), "users", uid), { role });
  await syncAdminRoster(uid, role === "admin" || role === "superadmin");
  logEvent(actorUid(), "role_changed", { uid, role });
}

export async function setAccountActive(uid: string, active: boolean) {
  await updateDoc(doc(db(), "users", uid), { active });
  // A banned handle stops counting as active in its rooms.
  await recountRoomsFor(uid);
  logEvent(actorUid(), active ? "account_activated" : "account_deactivated", { uid });
}

/** SuperAdmin: flip a Staff Handle On-Call/Off-Call and keep the public
 *  anonymous counter (status/staff.onCallCount) in sync. */
export async function setStaffOnCall(uid: string, onCall: boolean, wasOnCall: boolean) {
  if (onCall === wasOnCall) return;
  const batch = writeBatch(db());
  batch.update(doc(db(), "users", uid), { onCall });
  batch.set(
    doc(db(), "status", "staff"),
    { onCallCount: increment(onCall ? 1 : -1) },
    { merge: true },
  );
  await batch.commit();
  await recountRoomsFor(uid);
  logEvent(actorUid(), onCall ? "staff_oncall_on" : "staff_oncall_off", { staffUid: uid });
}

export async function createRoom(name: string, topic: string, createdBy: string) {
  const roomRef = doc(collection(db(), "rooms"));
  const batch = writeBatch(db());
  batch.set(roomRef, { name, topic, createdBy, createdAt: serverTimestamp() });
  batch.set(doc(db(), "rooms", roomRef.id, "acl", "members"), { uids: [] });
  await batch.commit();
  logEvent(actorUid(), "room_created", { roomId: roomRef.id });
  return roomRef.id;
}

/** Adds/removes a member. Membership is mirrored in two places:
 *  - rooms/{id}/acl/members  (Admin-only visibility — the participant list)
 *  - users/{uid}/memberships/{roomId}  (lets the member list their own rooms) */
export async function setRoomMembership(
  roomId: string,
  roomName: string,
  memberUid: string,
  present: boolean,
) {
  const batch = writeBatch(db());
  const aclRef = doc(db(), "rooms", roomId, "acl", "members");
  const membershipRef = doc(db(), "users", memberUid, "memberships", roomId);
  if (present) {
    batch.set(aclRef, { uids: arrayUnion(memberUid) }, { merge: true });
    batch.set(membershipRef, { name: roomName, addedAt: serverTimestamp() });
  } else {
    batch.set(aclRef, { uids: arrayRemove(memberUid) }, { merge: true });
    batch.delete(membershipRef);
  }
  await batch.commit();
  await recountRoomOnCall(roomId);
  logEvent(actorUid(), present ? "room_member_added" : "room_member_removed", {
    roomId,
    memberUid,
  });
}

/** Correct the wording of an announcement after posting. */
export async function editPostText(postId: string, text: string) {
  await updateDoc(doc(db(), "broadcast", postId), {
    text: text.trim(),
    editedAt: serverTimestamp(),
  });
  logEvent(actorUid(), "post_edited", { postId });
}

/** Pin an announcement to the top of the Noticeboard (or unpin it). */
export async function setPostPinned(postId: string, pinned: boolean) {
  await updateDoc(doc(db(), "broadcast", postId), {
    pinned,
    pinnedAt: serverTimestamp(),
  });
  logEvent(actorUid(), pinned ? "post_pinned" : "post_unpinned", { postId });
}

/** Correct the wording of a room message. */
export async function editRoomMessage(roomId: string, messageId: string, text: string) {
  await updateDoc(doc(db(), "rooms", roomId, "messages", messageId), {
    text: text.trim(),
    editedAt: serverTimestamp(),
  });
  logEvent(actorUid(), "message_edited", { roomId, messageId });
}

export async function deleteBroadcastPost(postId: string) {
  await deleteDoc(doc(db(), "broadcast", postId));
  logEvent(actorUid(), "post_deleted", { postId });
}

export async function deleteRoomMessage(roomId: string, messageId: string) {
  await deleteDoc(doc(db(), "rooms", roomId, "messages", messageId));
  logEvent(actorUid(), "message_deleted", { roomId, messageId });
}

/**
 * Permanently removes a user from the platform: their profile, their room
 * memberships (and ACL entries) and their presence doc. They are locked out
 * instantly — with no profile document, the rules deny them everything.
 * Note: the login record in Firebase *Authentication* cannot be deleted from
 * the client; remove it in Firebase Console → Authentication → Users if you
 * want the email address reusable.
 */
export async function deleteUserAccount(uid: string) {
  const memberships = await getDocs(collection(db(), "users", uid, "memberships"));
  const roomIds = memberships.docs.map((m) => m.id);
  const batch = writeBatch(db());
  memberships.forEach((m) => {
    batch.delete(m.ref);
    batch.set(doc(db(), "rooms", m.id, "acl", "members"), { uids: arrayRemove(uid) }, { merge: true });
  });
  batch.delete(doc(db(), "presence", uid));
  batch.delete(doc(db(), "users", uid));
  await batch.commit();
  await syncAdminRoster(uid, false);
  for (const roomId of roomIds) await recountRoomOnCall(roomId);
  logEvent(actorUid(), "account_deleted", { uid });
}
