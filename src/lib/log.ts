// Compliance & event logging: high-level operational metadata only
// (who / what kind of action / when). NEVER message or form content.
// Fire-and-forget — logging must never break the action being logged.
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function logEvent(
  actorUid: string,
  category: string,
  meta: Record<string, string> = {},
) {
  addDoc(collection(db(), "complianceLogs"), {
    actorUid,
    category,
    meta,
    at: serverTimestamp(),
  }).catch(() => {});
}
