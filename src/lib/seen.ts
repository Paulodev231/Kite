// Tracks what you have already read, stored on YOUR device only.
// Deliberately not in Firestore: it costs no reads/writes on the free tier
// and no one else ever learns your reading habits.
const KEY = "kite:seen:v1";

type SeenMap = Record<string, number>; // surface key -> millis last seen

function read(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

export function getSeen(key: string): number {
  return read()[key] ?? 0;
}

export function markSeen(key: string, millis: number = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    const map = read();
    map[key] = millis;
    window.localStorage.setItem(KEY, JSON.stringify(map));
    // Let badges in other components refresh immediately.
    window.dispatchEvent(new CustomEvent("kite:seen-changed"));
  } catch {}
}

export const seenKeys = {
  broadcast: "broadcast",
  dmThread: (threadId: string) => `dm:${threadId}`,
};
