// Due-date states for milestones. Computed on the device — no server or
// scheduled job needed, so it stays free.
export type DueState = "none" | "overdue" | "due_soon" | "on_track" | "done";

export const DUE_SOON_DAYS = 7;

/** Whole days from today until `iso` (yyyy-mm-dd). Negative = in the past. */
export function daysUntil(iso: string): number {
  const due = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function dueState(iso: string | undefined, completed: boolean): DueState {
  if (completed) return "done";
  if (!iso) return "none";
  const days = daysUntil(iso);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  return "on_track";
}

/** Short human phrase: "3 days overdue", "due in 2 days", "due today". */
export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days === 0) return "due today";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  return `due in ${days} day${days === 1 ? "" : "s"}`;
}

/** Icon + label so a due-date warning never relies on colour alone. */
export const DUE_META: Record<DueState, { icon: string; color: string } | null> = {
  none: null,
  done: null,
  on_track: null,
  due_soon: { icon: "⏰", color: "#fab219" },
  overdue: { icon: "🔴", color: "#d03b3b" },
};
