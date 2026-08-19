"use client";

// Every screen inside this group requires a signed-in, ACTIVE account.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, configured, logout } = useAuth();
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

  if (loading || !user || !profile) return <SplashScreen />;
  return <>{children}</>;
}
