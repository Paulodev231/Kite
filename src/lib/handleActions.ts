// Writing AS a Managed Staff Handle. Only the SuperAdmin can do this, and the
// security rules verify both facts server-side: the caller is a SuperAdmin and
// the author uid belongs to an account whose role is "staff".
//
// The SuperAdmin never signs in as a handle — these run from the Handle
// Console inside their own session.
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, dmThreadId } from "@/lib/firebase";
import { logEvent } from "@/lib/log";
import { uploadFile } from "@/lib/upload";
import type { QuotedMessage } from "@/lib/types";

export interface HandleIdentity {
  uid: string;
  handle: string;
}

/** Post an announcement to the Main Broadcast channel as a handle. */
export async function postBroadcastAs(
  as: HandleIdentity,
  text: string,
  file: File | null,
  actorUid: string,
) {
  const media = file ? await uploadFile("broadcast", file) : null;
  await addDoc(collection(db(), "broadcast"), {
    authorUid: as.uid,
    authorHandle: as.handle,
    text,
    reactions: {},
    pinned: false,
    ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
    createdAt: serverTimestamp(),
  });
  logEvent(actorUid, "posted_as_handle", { handleUid: as.uid, surface: "noticeboard" });
}

/** Post into a room as a handle, optionally quoting an existing message. */
export async function postRoomMessageAs(
  as: HandleIdentity,
  roomId: string,
  text: string,
  file: File | null,
  quoted: QuotedMessage | null,
  actorUid: string,
) {
  const media = file ? await uploadFile(`rooms/${roomId}`, file) : null;
  await addDoc(collection(db(), "rooms", roomId, "messages"), {
    authorUid: as.uid,
    authorHandle: as.handle,
    text,
    ...(quoted ? { replyTo: quoted } : {}),
    ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
    createdAt: serverTimestamp(),
  });
  logEvent(actorUid, "posted_as_handle", { handleUid: as.uid, surface: `room:${roomId}` });
}

/**
 * Send a direct message as a handle. Creates the thread if it doesn't exist,
 * so the SuperAdmin can start a conversation as a handle, not only reply.
 */
export async function sendDmAs(
  as: HandleIdentity,
  peer: HandleIdentity,
  text: string,
  actorUid: string,
) {
  const threadId = dmThreadId(as.uid, peer.uid);
  await setDoc(
    doc(db(), "dms", threadId),
    {
      participants: [as.uid, peer.uid].sort(),
      handles: { [as.uid]: as.handle, [peer.uid]: peer.handle },
      lastText: text,
      lastSenderUid: as.uid,
      updatedAt: serverTimestamp(),
      staffReadAt: serverTimestamp(),
    },
    { merge: true },
  );
  await addDoc(collection(db(), "dms", threadId, "messages"), {
    senderUid: as.uid,
    text,
    createdAt: serverTimestamp(),
  });
  logEvent(actorUid, "dm_as_handle", { handleUid: as.uid });
  return threadId;
}

/** Marks a staff thread as triaged so the console badge clears. */
export async function markThreadTriaged(threadId: string) {
  await updateDoc(doc(db(), "dms", threadId), { staffReadAt: serverTimestamp() }).catch(
    () => {},
  );
}
