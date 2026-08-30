"use client";

// Fill in a form published inside a room — milestone reports, assistance
// requests, digital signatures. Your answers are PRIVATE: only you and the
// Admins can ever see them.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { logEvent } from "@/lib/log";
import type { FormSubmission, RoomForm } from "@/lib/types";
import AppShell from "@/components/AppShell";
import SignaturePad from "@/components/SignaturePad";

export default function FormFillPage() {
  const { id: roomId, formId } = useParams<{ id: string; formId: string }>();
  const { user, profile } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [form, setForm] = useState<RoomForm | null>(null);
  const [existing, setExisting] = useState<FormSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submissionId = formId && user ? `${formId}_${user.uid}` : null;

  useEffect(() => {
    if (!roomId || !formId) return;
    return onSnapshot(doc(db(), "rooms", roomId, "forms", formId), (snap) =>
      setForm(snap.exists() ? ({ id: snap.id, ...snap.data() } as RoomForm) : null),
    );
  }, [roomId, formId]);

  // Load my previous submission (if any) so I can review / revise it.
  useEffect(() => {
    if (!roomId || !submissionId) return;
    return onSnapshot(
      doc(db(), "rooms", roomId, "submissions", submissionId),
      (snap) => {
        if (snap.exists()) {
          const sub = { id: snap.id, ...snap.data() } as FormSubmission;
          setExisting(sub);
          setAnswers((prev) => (Object.keys(prev).length ? prev : sub.answers));
        }
      },
      () => {},
    );
  }, [roomId, submissionId]);

  async function submit() {
    if (!user || !profile || !form || !roomId || !submissionId) return;
    setError(null);
    for (const field of form.fields) {
      const v = answers[field.id];
      if (field.required && (v === undefined || v === "" || v === false)) {
        setError(t("formRequired", { label: field.label }));
        return;
      }
    }
    setBusy(true);
    try {
      await setDoc(doc(db(), "rooms", roomId, "submissions", submissionId), {
        uid: user.uid,
        handle: profile.handle,
        formId,
        answers,
        submittedAt: serverTimestamp(),
      });
      logEvent(user.uid, "form_submission", { roomId, formId });
      setSaved(true);
      setTimeout(() => router.back(), 1200);
    } catch {
      setError(t("formSubmitError"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title={form ? `📋 ${form.title}` : t("form")}>
      <div className="mx-auto max-w-lg space-y-3 p-4">
        {form && !form.open && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600">
            {t("formClosed")}
          </p>
        )}
        {form?.description && (
          <p className="text-sm leading-relaxed opacity-70">{form.description}</p>
        )}
        {existing && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
            {t("formSubmittedOn", {
              when: existing.submittedAt?.toDate().toLocaleString() ?? "",
            })}
          </p>
        )}
        <p className="rounded-xl bg-brand-soft px-3 py-2 text-[11px] font-medium text-brand">
          {t("formPrivate")}
        </p>

        {form?.fields.map((field) => (
          <div key={field.id} className="rounded-2xl bg-surface p-4 shadow-sm">
            <label className="mb-2 block text-sm font-bold">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === "text" && (
              <input
                className={inputCls}
                value={(answers[field.id] as string) ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              />
            )}
            {field.type === "textarea" && (
              <textarea
                rows={4}
                className={inputCls}
                value={(answers[field.id] as string) ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              />
            )}
            {field.type === "number" && (
              <input
                type="number"
                inputMode="decimal"
                className={inputCls}
                value={(answers[field.id] as string) ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              />
            )}
            {field.type === "date" && (
              <input
                type="date"
                className={inputCls}
                value={(answers[field.id] as string) ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              />
            )}
            {field.type === "checkbox" && (
              <label className="app-chrome flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(answers[field.id])}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked })}
                  className="h-5 w-5 accent-[var(--brand)]"
                />
                <span className="text-sm">{t("yes")}</span>
              </label>
            )}
            {field.type === "select" && (
              <select
                className={inputCls}
                value={(answers[field.id] as string) ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              >
                <option value="">{t("choose")}</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {field.type === "signature" && (
              <SignaturePad
                value={(answers[field.id] as string) || null}
                onChange={(dataUrl) =>
                  setAnswers({ ...answers, [field.id]: dataUrl ?? "" })
                }
              />
            )}
          </div>
        ))}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
            {error}
          </p>
        )}
        {form?.open && (
          <button
            type="button"
            onClick={submit}
            disabled={busy || saved}
            className="app-chrome w-full rounded-2xl bg-brand py-3.5 text-base font-bold text-white shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {saved
              ? t("submitted")
              : busy
                ? t("submitting")
                : existing
                  ? t("updateSubmission")
                  : t("submit")}
          </button>
        )}
      </div>
    </AppShell>
  );
}
