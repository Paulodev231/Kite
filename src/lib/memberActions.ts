// Actions a member performs on their own record.
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FundingCode } from "@/lib/types";

export type RedeemResult =
  | { ok: true; amount: number; currency: string }
  | { ok: false; reason: string };

/**
 * Redeems a funding confirmation code an Admin issued to this member.
 *
 * The amount is taken from the code document, never from anything typed here,
 * and the security rules re-check it on write — so this cannot be used to
 * award or inflate funding. A wrong code simply fails to load: codes cannot be
 * listed or browsed, only fetched by knowing them exactly.
 */
export async function redeemFundingCode(uid: string, rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter the code you were given." };

  let snap;
  try {
    snap = await getDoc(doc(db(), "fundingCodes", code));
  } catch {
    return { ok: false, reason: "That code is not valid for this account." };
  }
  if (!snap.exists()) {
    return { ok: false, reason: "That code was not recognised. Check it and try again." };
  }

  const data = { id: snap.id, ...snap.data() } as FundingCode;
  if (data.targetUid !== uid) {
    return { ok: false, reason: "That code was issued to someone else." };
  }

  try {
    await updateDoc(doc(db(), "users", uid), {
      funded: true,
      fundedAmount: data.amount,
      fundedCurrency: data.currency,
      fundedNote: data.note ?? "",
      fundedAt: serverTimestamp(),
      fundingCode: code,
    });
    // Best-effort bookkeeping so the Admin can see it was used.
    await updateDoc(doc(db(), "fundingCodes", code), {
      used: true,
      usedAt: serverTimestamp(),
    }).catch(() => {});
    return { ok: true, amount: data.amount, currency: data.currency };
  } catch {
    return { ok: false, reason: "Could not confirm right now. Try again in a moment." };
  }
}
