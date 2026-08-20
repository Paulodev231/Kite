"use client";

// "Acting as" — lets the SuperAdmin operate the platform AS one of their
// Managed Staff Handles without signing out or holding separate credentials.
//
// Staff Handles have NO login of their own. They are identity records; the
// SuperAdmin switches into one, and everything they then post, react to or
// send carries that handle's uid and name. The security rules permit this
// only for the SuperAdmin, and only for accounts whose role is "staff".
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/lib/types";

const STORAGE_KEY = "kite:actingAs";

interface ActingState {
  /** Staff handles available to switch into (SuperAdmin only). */
  handles: UserProfile[];
  /** The handle currently being operated, or null when acting as yourself. */
  acting: UserProfile | null;
  /** Whoever is authoring right now — you, or the handle you switched into. */
  identityUid: string;
  identityHandle: string;
  canSwitch: boolean;
  switchTo: (uid: string | null) => void;
}

const ActingContext = createContext<ActingState>({
  handles: [],
  acting: null,
  identityUid: "",
  identityHandle: "",
  canSwitch: false,
  switchTo: () => {},
});

export function ActingProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const canSwitch = profile?.role === "superadmin";
  const [handles, setHandles] = useState<UserProfile[]>([]);
  const [actingUid, setActingUid] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!canSwitch) return;
    return onSnapshot(
      query(collection(db(), "users"), where("role", "==", "staff")),
      (snap) => setHandles(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
      () => {},
    );
  }, [canSwitch]);

  const switchTo = useCallback((uid: string | null) => {
    setActingUid(uid);
    try {
      if (uid) window.localStorage.setItem(STORAGE_KEY, uid);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // Only a SuperAdmin can act as a handle, and only as one that still exists.
  const acting = useMemo(() => {
    if (!canSwitch || !actingUid) return null;
    return handles.find((h) => h.uid === actingUid) ?? null;
  }, [canSwitch, actingUid, handles]);

  const value: ActingState = {
    handles,
    acting,
    identityUid: acting?.uid ?? user?.uid ?? "",
    identityHandle: acting?.handle ?? profile?.handle ?? "",
    canSwitch: Boolean(canSwitch),
    switchTo,
  };

  return <ActingContext.Provider value={value}>{children}</ActingContext.Provider>;
}

/** The identity to author as right now. Use this instead of the raw auth uid
 *  anywhere a post, message or reaction records who wrote it. */
export function useActing() {
  return useContext(ActingContext);
}
