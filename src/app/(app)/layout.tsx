"use client";

// Every screen inside this group requires a signed-in, ACTIVE account.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import AccountNotReady from "@/components/AccountNotReady";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, configured, profileError, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!configured || !user) {
      router.replace("/login");
      return;
    }
    // Deactivated accounts are locked out immediately.
    if (profile && profile.active === false) {
      logout().finally(() => router.replace("/login"));
    }
  }, [loading, configured, user, profile, router, logout]);

  // Signed in but no readable profile → explain exactly what to fix
  // instead of hanging on the splash screen forever.
  if (!loading && user && !profile) {
    return <AccountNotReady reason={profileError ? "error" : "missing"} />;
  }

  if (loading || !user || !profile) return <SplashScreen />;
  return <>{children}</>;
}
