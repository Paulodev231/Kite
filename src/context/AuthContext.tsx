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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  logout: async () => {},
});

const HEARTBEAT_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // When Firebase isn't configured yet there is nothing to wait for.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
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
        setLoading(false);
      },
      () => setLoading(false),
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
      value={{ user, profile, loading, configured: isFirebaseConfigured, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
