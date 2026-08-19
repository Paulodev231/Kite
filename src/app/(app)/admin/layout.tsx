"use client";

// Hard gate: only Admins & SuperAdmins may enter /admin.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/types";
import SplashScreen from "@/components/SplashScreen";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin(profile?.role)) router.replace("/broadcast");
  }, [loading, profile, router]);

  if (loading || !isAdmin(profile?.role)) return <SplashScreen />;
  return <>{children}</>;
}
