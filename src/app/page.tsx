"use client";

// Entry point: sends you to the Broadcast room if signed in, otherwise to login.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(!configured || !user ? "/login" : "/noticeboard");
  }, [loading, user, configured, router]);

  return <SplashScreen />;
}
