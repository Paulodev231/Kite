"use client";

// Keeps track of who is signed in and loads their profile document
// (which contains their role: member / staff / admin / superadmin).
// Also heartbeats an anonymous presence document so the "Active Now"
// counter works without exposing identities.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  arrayUnion,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { isAdmin, type UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  /** Signed in, but no users/{uid} document exists — account not provisioned. */
  profileMissing: boolean;
  /** Signed in, but reading users/{uid} failed (rules/database problem). */
  profileError: boolean;
  /** Uids of admins, so an "Admin" tag can be shown beside their handle. */
  adminUids: Set<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  profileMissing: false,
  profileError: false,
  adminUids: new Set<string>(),
  logout: async () => {},
});

const HEARTBEAT_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUids, setAdminUids] = useState<Set<string>>(new Set());
  const [profileMissing, setProfileMissing] = useState(false);
  const [profileError, setProfileError] = useState(false);
  // When Firebase isn't configured yet there is nothing to wait for.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setProfileMissing(false);
        setProfileError(false);
        setLoading(false);
      }
    });
  }, []);

  // Live subscription to the signed-in user's profile (role changes apply instantly).
  useEffect(() => {
    if (!user) return;
    const ref = doc(db(), "users", user.uid);
    return onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null);
        setProfileMissing(!snap.exists());
        setProfileError(false);
        setLoading(false);
      },
      () => {
        // Permission denied / database unreachable — surface it instead of hanging.
        setProfile(null);
        setProfileMissing(false);
        setProfileError(true);
        setLoading(false);
      },
    );
  }, [user]);

  // The public admin roster: a single doc of uids, readable by everyone, so
  // members (who cannot read other profiles) can still see who is an admin.
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db(), "status", "admins"),
      (snap) => setAdminUids(new Set<string>(snap.data()?.uids ?? [])),
      () => {},
    );
  }, [user]);

  // Self-heal: an admin who is not yet listed adds themselves. This means the
  // hand-created SuperAdmin appears automatically with no manual step.
  useEffect(() => {
    if (!user || !profile || !isAdmin(profile.role)) return;
    if (adminUids.has(user.uid)) return;
    setDoc(doc(db(), "status", "admins"), { uids: arrayUnion(user.uid) }, { merge: true }).catch(
      () => {},
    );
  }, [user, profile, adminUids]);

  // Anonymous presence heartbeat: presence/{uid} holds a timestamp and, while
  // a room is open, that room's id — so each room can show its own live count
  // instead of the platform-wide one.
  const pathname = usePathname();
  const roomId = pathname?.startsWith("/rooms/") ? pathname.split("/")[2] : "";
  // Held in a ref so changing rooms only rewrites the doc — it must never tear
  // down and recreate the heartbeat, which could race and leave you invisible.
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db(), "presence", user.uid);
    const beat = () =>
      setDoc(ref, {
        lastActive: serverTimestamp(),
        roomId: roomIdRef.current ?? "",
      }).catch(() => {});
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      deleteDoc(ref).catch(() => {});
    };
  }, [user]);

  // Moving between rooms updates the same presence doc straight away, so the
  // room counter reacts immediately instead of waiting for the next heartbeat.
  useEffect(() => {
    roomIdRef.current = roomId;
    if (!user) return;
    setDoc(
      doc(db(), "presence", user.uid),
      { lastActive: serverTimestamp(), roomId: roomId ?? "" },
      { merge: true },
    ).catch(() => {});
  }, [user, roomId]);

  const logout = useCallback(async () => {
    if (user) {
      await deleteDoc(doc(db(), "presence", user.uid)).catch(() => {});
    }
    await signOut(firebaseAuth());
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        configured: isFirebaseConfigured,
        profileMissing,
        profileError,
        adminUids,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
