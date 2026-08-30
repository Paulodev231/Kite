"use client";

// 🎛️ Handle Console — the one place the SuperAdmin operates every Managed
// Staff Handle. Post as a handle, reply to its DMs, quote-reply inside a room.
// Nothing here switches your session: you stay signed in as yourself the whole
// time, and choose who each message goes out as.
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";
import ConsoleDms from "@/components/console/ConsoleDms";
import ConsoleBroadcast from "@/components/console/ConsoleBroadcast";
import ConsoleRooms from "@/components/console/ConsoleRooms";
import { useT } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "dms" | "broadcast" | "rooms";

const TABS: { id: Tab; key: TranslationKey; icon: string }[] = [
  { id: "dms", key: "cnTabDms", icon: "📥" },
  { id: "broadcast", key: "cnTabBroadcast", icon: "📣" },
  { id: "rooms", key: "cnTabRooms", icon: "🗂️" },
];

export default function HandleConsolePage() {
  const { user, profile, loading } = useAuth();
  const { t } = useT();
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<Tab>("dms");
  const superadmin = profile?.role === "superadmin";

  useEffect(() => {
    if (!superadmin) return;
    return onSnapshot(
      query(collection(db(), "users"), orderBy("createdAt", "desc")),
      (snap) => setPeople(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
      () => {},
    );
  }, [superadmin]);

  if (loading) return <SplashScreen />;
  if (!superadmin || !profile || !user) {
    return (
      <AppShell title={`🎛️ ${t("admConsole")}`}>
        <p className="p-8 text-center text-sm opacity-60">{t("cnForSuperadmin")}</p>
      </AppShell>
    );
  }

  const handles = people.filter((p) => p.role === "staff");
  const members = people.filter((p) => p.role === "member");

  return (
    <AppShell title={`🎛️ ${t("admConsole")}`}>
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <p className="px-1 text-[11px] leading-relaxed opacity-50">
          {t("cnIntro", { handle: profile.handle })}
        </p>

        {/* Segmented control */}
        <div className="app-chrome flex gap-1 rounded-2xl bg-surface p-1 shadow-sm">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                tab === item.id ? "bg-brand text-white" : "opacity-60"
              }`}
            >
              {item.icon} {t(item.key)}
            </button>
          ))}
        </div>

        {handles.length === 0 && (
          <p className="rounded-2xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600">
            {t("cnNoHandles")}
          </p>
        )}

        {tab === "dms" && (
          <ConsoleDms handles={handles} members={members} actorUid={user.uid} />
        )}
        {tab === "broadcast" && (
          <ConsoleBroadcast handles={handles} me={profile} actorUid={user.uid} />
        )}
        {tab === "rooms" && (
          <ConsoleRooms handles={handles} me={profile} actorUid={user.uid} />
        )}
      </div>
    </AppShell>
  );
}
