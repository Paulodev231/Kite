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
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Role } from "@/lib/types";

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
      role,
      active: true,
      ...(role === "staff" ? { onCall: false } : {}),
      createdAt: serverTimestamp(),
    });
    await signOut(getAuth(secondary));
    return uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

export async function setAccountActive(uid: string, active: boolean) {
  await updateDoc(doc(db(), "users", uid), { active });
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
}

export async function createRoom(name: string, topic: string, createdBy: string) {
  const roomRef = doc(collection(db(), "rooms"));
  const batch = writeBatch(db());
  batch.set(roomRef, { name, topic, createdBy, createdAt: serverTimestamp() });
  batch.set(doc(db(), "rooms", roomRef.id, "acl", "members"), { uids: [] });
  await batch.commit();
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
}

export async function deleteBroadcastPost(postId: string) {
  await deleteDoc(doc(db(), "broadcast", postId));
}
