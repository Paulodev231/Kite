"use client";

// Invite-only sign in. There is deliberately NO "create account" option:
// accounts exist only when an Admin creates them from the Admin Panel.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/noticeboard");
  }, [loading, user, router]);

  if (!configured) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-5xl" aria-hidden>
          🛠️
        </span>
        <h1 className="text-lg font-bold">Almost there — Firebase isn’t connected yet</h1>
        <p className="max-w-sm text-sm opacity-70">
          Add your Firebase keys as environment variables (see{" "}
          <code className="rounded bg-brand-soft px-1 font-mono text-brand">SETUP.md</code>{" "}
          in the repository, Step 3), then redeploy.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
      router.replace("/noticeboard");
    } catch {
      setError("Sign-in failed. Check the email and password given to you by your Admin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-background p-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="app-chrome mb-8 flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-3xl shadow-lg">
            🪁
          </span>
          <h1 className="text-2xl font-extrabold">Kite</h1>
          <p className="text-center text-xs font-medium opacity-60">
            Private workspace · Access by invitation only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3.5 text-base outline-none focus:border-brand dark:border-white/10"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3.5 text-base outline-none focus:border-brand dark:border-white/10"
          />
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="app-chrome w-full rounded-2xl bg-brand py-3.5 text-base font-bold text-white shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed opacity-50">
          No account? Access to this platform is provisioned by your
          administrator. Contact them for credentials.
        </p>
      </div>
    </div>
  );
}
