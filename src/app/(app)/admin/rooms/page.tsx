"use client";

// Admin-only: create Admin-locked rooms and manage exactly who is inside
// via the toggle panel. Participant manifests live here — never member-side.
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { createRoom, setRoomMembership } from "@/lib/adminActions";
import type { Room, UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const { t } = useT();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Room | null>(null);
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubRooms = onSnapshot(
      query(collection(db(), "rooms"), orderBy("createdAt", "desc")),
      (snap) => setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
    );
    const unsubUsers = onSnapshot(
      query(collection(db(), "users"), orderBy("createdAt", "desc")),
      (snap) => setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    );
    return () => {
      unsubRooms();
      unsubUsers();
    };
  }, []);

  // Load the selected room's participant manifest (Admin-only ACL doc).
  useEffect(() => {
    if (!selected) return;
    return onSnapshot(doc(db(), "rooms", selected.id, "acl", "members"), (snap) =>
      setMemberUids(snap.exists() ? (snap.data().uids ?? []) : []),
    );
  }, [selected]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await createRoom(name.trim(), topic.trim(), user.uid);
      setName("");
      setTopic("");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title={`🔐 ${t("admRooms")}`}>
      <div className="mx-auto max-w-lg space-y-4 p-3">
        <form onSubmit={handleCreate} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("rmCreateTitle")}</p>
          <input
            className={inputCls}
            placeholder={t("rmNamePlaceholder")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={t("rmTopicPlaceholder")}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? t("usrCreating") : t("rmCreate")}
          </button>
        </form>

        <div className="space-y-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-40">
            {t("rmList", { n: rooms.length })}
          </p>
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelected(selected?.id === room.id ? null : room)}
              className={`app-chrome flex w-full items-center gap-3 rounded-2xl p-3.5 text-left shadow-sm ${
                selected?.id === room.id ? "bg-brand-soft ring-1 ring-brand" : "bg-surface"
              }`}
            >
              <span className="text-xl">🔐</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{room.name}</span>
              <span className="text-xs opacity-40">
                {selected?.id === room.id ? "▲" : "▼"}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="space-y-1 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">
              {t("rmAccessPanel", { name: selected.name })}{" "}
              <span className="font-normal opacity-50">
                {t("rmInsideCount", { n: memberUids.length })}
              </span>
            </p>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide opacity-40">
              {t("rmMembers")}
            </p>
            {users
              .filter((u) => u.role === "member")
              .map((u) => {
                const inside = memberUids.includes(u.uid);
                return (
                  <label
                    key={u.uid}
                    className="app-chrome flex items-center gap-3 rounded-xl px-2 py-2.5 active:bg-brand-soft"
                  >
                    <input
                      type="checkbox"
                      checked={inside}
                      onChange={() =>
                        setRoomMembership(selected.id, selected.name, u.uid, !inside)
                      }
                      className="h-5 w-5 accent-[var(--brand)]"
                    />
                    <span className="flex-1 text-sm font-semibold">{u.handle}</span>
                    {u.active === false && (
                      <span className="text-[10px] text-red-500">{t("rmDeactivated")}</span>
                    )}
                  </label>
                );
              })}
            {/* Staff Handles: adding one here is what makes it count as
                active in this room's header, and only while it is On-Call. */}
            <p className="mb-1 mt-3 border-t border-black/5 pt-3 text-[10px] font-bold uppercase tracking-wide opacity-40 dark:border-white/10">
              {t("rmStaffHere")}
            </p>
            {users.filter((u) => u.role === "staff").length === 0 && (
              <p className="py-1 text-[11px] opacity-50">
                {t("rmNoStaff")}
              </p>
            )}
            {users
              .filter((u) => u.role === "staff")
              .map((u) => {
                const inside = memberUids.includes(u.uid);
                return (
                  <label
                    key={u.uid}
                    className="app-chrome flex items-center gap-3 rounded-xl px-2 py-2.5 active:bg-brand-soft"
                  >
                    <input
                      type="checkbox"
                      checked={inside}
                      onChange={() =>
                        setRoomMembership(selected.id, selected.name, u.uid, !inside)
                      }
                      className="h-5 w-5 accent-[var(--brand)]"
                    />
                    <span className="flex-1 text-sm font-semibold">🎧 {u.handle}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        u.onCall ? "text-emerald-600" : "opacity-40"
                      }`}
                    >
                      {u.onCall ? t("onCallShort") : t("offCallShort")}
                    </span>
                  </label>
                );
              })}

            <p className="pt-2 text-[10px] leading-relaxed opacity-40">
              {t("rmAccessFootnote")}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
