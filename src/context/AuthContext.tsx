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
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  /** Signed in, but no users/{uid} document exists — account not provisioned. */
  profileMissing: boolean;
  /** Signed in, but reading users/{uid} failed (rules/database problem). */
  profileError: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  profileMissing: false,
  profileError: false,
  logout: async () => {},
});

const HEARTBEAT_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  // Anonymous presence heartbeat: presence/{uid} holds only a timestamp.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db(), "presence", user.uid);
    const beat = () =>
      setDoc(ref, { lastActive: serverTimestamp() }).catch(() => {});
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      deleteDoc(ref).catch(() => {});
    };
  }, [user]);

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
