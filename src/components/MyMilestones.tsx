"use client";

// A member's own project milestones. Each project manager runs their own
// project, so this is their personal delivery view — they never see another
// member's milestones, funding or blockers.
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { dueLabel, dueState, DUE_META } from "@/lib/dates";
import { MILESTONE_STATUS, type Milestone } from "@/lib/types";

export default function MyMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db(), "milestones"), where("ownerUid", "==", user.uid)),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
      () => {},
    );
  }, [user]);

  if (milestones.length === 0) return null;

  const done = milestones.filter((m) => m.status === "completed").length;
  const pct = Math.round((done / milestones.length) * 100);

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">🎯 My project milestones</p>
      <p className="text-[11px] opacity-50">
        {done} of {milestones.length} delivered
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-2">
        {milestones.map((m) => {
          const meta = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.planned;
          const dm = DUE_META[dueState(m.dueDate, m.status === "completed")];
          return (
            <div key={m.id} className="flex items-start gap-2 text-xs">
              <span aria-hidden>{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.title}</p>
                <p className="text-[10px] opacity-50">
                  {meta.label}
                  {m.roomName ? ` · 🔐 ${m.roomName}` : ""}
                  {m.dueDate ? ` · due ${m.dueDate}` : ""}
                </p>
                {dm && m.dueDate && (
                  <p className="text-[10px] font-bold" style={{ color: dm.color }}>
                    {dm.icon} {dueLabel(m.dueDate)}
                  </p>
                )}
                {m.status === "blocked" && m.hindrance && (
                  <p className="text-[10px] font-medium text-red-500">⛔ {m.hindrance}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed opacity-40">
        Milestones are recorded by your administrator. Message them in a room or
        by direct message if something needs updating.
      </p>
    </div>
  );
}
