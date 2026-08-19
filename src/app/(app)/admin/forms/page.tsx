"use client";

// Admin-only: build fillable forms (milestone reports, assistance requests,
// digital signatures), publish them into rooms, and review the private
// submissions — which no member can ever see besides their own.
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logEvent } from "@/lib/log";
import {
  FORM_FIELD_TYPES,
  type FormField,
  type FormFieldType,
  type FormSubmission,
  type Room,
  type RoomForm,
} from "@/lib/types";
import AppShell from "@/components/AppShell";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AdminFormsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [forms, setForms] = useState<RoomForm[]>([]);
  const [viewing, setViewing] = useState<RoomForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Builder state
  const [building, setBuilding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(query(collection(db(), "rooms"), orderBy("createdAt", "desc")), (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
    );
  }, []);

  useEffect(() => {
    if (!roomId) return;
    return onSnapshot(
      query(collection(db(), "rooms", roomId, "forms"), orderBy("createdAt", "desc")),
      (snap) => setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomForm)),
    );
  }, [roomId]);

  // Submissions for the form being reviewed.
  useEffect(() => {
    if (!roomId || !viewing) return;
    return onSnapshot(collection(db(), "rooms", roomId, "submissions"), (snap) =>
      setSubmissions(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as FormSubmission)
          .filter((s) => s.formId === viewing.id),
      ),
    );
  }, [roomId, viewing]);

  function selectRoom(nextRoomId: string) {
    setRoomId(nextRoomId);
    setViewing(null);
    setForms([]);
    setSubmissions([]);
  }

  function toggleViewing(form: RoomForm) {
    setSubmissions([]);
    setViewing(viewing?.id === form.id ? null : form);
  }

  function addField(type: FormFieldType) {
    setFields((prev) => {
      // Readable ids f1, f2… — always one above the highest existing number.
      const next = prev.reduce((max, f) => Math.max(max, parseInt(f.id.slice(1), 10) || 0), 0) + 1;
      return [
        ...prev,
        {
          id: `f${next}`,
          label: "",
          type,
          required: true,
          ...(type === "select" ? { options: [] } : {}),
        },
      ];
    });
  }

  async function publish() {
    if (!user || !roomId || !title.trim() || fields.length === 0) return;
    setBusy(true);
    try {
      const clean = fields
        .filter((f) => f.label.trim())
        .map((f) => ({ ...f, label: f.label.trim() }));
      await addDoc(collection(db(), "rooms", roomId, "forms"), {
        title: title.trim(),
        description: description.trim(),
        fields: clean,
        open: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      logEvent(user.uid, "form_published", { roomId });
      setTitle("");
      setDescription("");
      setFields([]);
      setBuilding(false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOpen(form: RoomForm) {
    await updateDoc(doc(db(), "rooms", roomId, "forms", form.id), { open: !form.open });
  }

  return (
    <AppShell title="📋 Forms & Signatures">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <select className={inputCls} value={roomId} onChange={(e) => selectRoom(e.target.value)}>
          <option value="">Choose a room…</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {roomId && !building && (
          <button
            type="button"
            onClick={() => setBuilding(true)}
            className="app-chrome w-full rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            ➕ Build a new form
          </button>
        )}

        {/* ---------- Builder ---------- */}
        {roomId && building && (
          <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">New form</p>
            <input
              className={inputCls}
              placeholder="Title (e.g. Milestone Report — March)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={inputCls}
              rows={2}
              placeholder="Instructions shown to members (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {fields.map((field, i) => (
              <div key={field.id} className="space-y-2 rounded-xl bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">
                    {FORM_FIELD_TYPES.find((t) => t.value === field.type)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFields(fields.filter((f) => f.id !== field.id))}
                    className="text-xs font-bold text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <input
                  className={inputCls}
                  placeholder={`Question ${i + 1} — e.g. "What was achieved this week?"`}
                  value={field.label}
                  onChange={(e) =>
                    setFields(fields.map((f) => (f.id === field.id ? { ...f, label: e.target.value } : f)))
                  }
                />
                {field.type === "select" && (
                  <input
                    className={inputCls}
                    placeholder="Options, separated by commas (e.g. On track, Delayed, Blocked)"
                    value={(field.options ?? []).join(", ")}
                    onChange={(e) =>
                      setFields(
                        fields.map((f) =>
                          f.id === field.id
                            ? { ...f, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) }
                            : f,
                        ),
                      )
                    }
                  />
                )}
                <label className="app-chrome flex items-center gap-2 text-xs font-semibold opacity-70">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      setFields(fields.map((f) => (f.id === field.id ? { ...f, required: e.target.checked } : f)))
                    }
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Required
                </label>
              </div>
            ))}

            <div className="flex flex-wrap gap-1.5">
              {FORM_FIELD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => addField(t.value)}
                  className="app-chrome rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-bold text-brand active:scale-95"
                >
                  + {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBuilding(false)}
                className="app-chrome flex-1 rounded-xl bg-background py-2.5 text-sm font-bold active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={busy || !title.trim() || fields.filter((f) => f.label.trim()).length === 0}
                className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Publishing…" : "Publish to room"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Existing forms ---------- */}
        {forms.map((form) => (
          <div key={form.id} className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold">📋 {form.title}</span>
              <button
                type="button"
                onClick={() => toggleOpen(form)}
                className={`app-chrome rounded-full px-3 py-1 text-[11px] font-bold ${
                  form.open ? "bg-emerald-500/15 text-emerald-600" : "bg-gray-500/15 opacity-70"
                }`}
              >
                {form.open ? "Open" : "Closed"}
              </button>
              <button
                type="button"
                onClick={() => toggleViewing(form)}
                className="app-chrome rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold text-brand"
              >
                {viewing?.id === form.id ? "Hide" : "Responses"}
              </button>
            </div>

            {viewing?.id === form.id && (
              <div className="mt-3 space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                <p className="text-xs font-semibold opacity-50">
                  {submissions.length} submission{submissions.length === 1 ? "" : "s"} — visible to Admins only
                </p>
                {submissions.map((sub) => (
                  <details key={sub.id} className="rounded-xl bg-background p-3">
                    <summary className="app-chrome cursor-pointer text-sm font-bold">
                      {sub.handle}{" "}
                      <span className="text-[10px] font-normal opacity-50">
                        {sub.submittedAt?.toDate().toLocaleString() ?? ""}
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {form.fields.map((field) => {
                        const v = sub.answers?.[field.id];
                        return (
                          <div key={field.id}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">
                              {field.label}
                            </p>
                            {field.type === "signature" && typeof v === "string" && v ? (
                              <img
                                src={v}
                                alt={`Signature by ${sub.handle}`}
                                className="mt-1 h-20 rounded-lg border border-black/10 bg-white"
                              />
                            ) : (
                              <p className="text-sm">
                                {typeof v === "boolean" ? (v ? "Yes ✅" : "No") : v || "—"}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
