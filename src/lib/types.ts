import type { Timestamp } from "firebase/firestore";

/** Role hierarchy. "staff" = a Managed Staff Handle operated by the SuperAdmin. */
export type Role = "member" | "staff" | "admin" | "superadmin";

export const ADMIN_ROLES: Role[] = ["admin", "superadmin"];

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Public-facing role label. Only Admins and SuperAdmins carry a visible tag —
 * members show nothing, and Staff Handles deliberately show nothing so they
 * appear as ordinary project managers to the rest of the platform.
 */
export function roleTag(role: Role | null | undefined): string | null {
  if (role === "superadmin") return "SuperAdmin";
  if (role === "admin") return "Admin";
  return null;
}

export interface UserProfile {
  uid: string;
  handle: string; // public display handle, e.g. "PM_Ade"
  role: Role;
  active: boolean; // deactivated accounts cannot use the app
  onCall?: boolean; // staff handles only: counted in the presence indicator
  createdAt?: Timestamp;

  // ----- Funding status (set by Admins only; the member sees it read-only) -----
  funded?: boolean;
  fundedAmount?: number;
  fundedCurrency?: string; // symbol, e.g. "$" or "₦"
  fundedNote?: string; // optional context, e.g. "Tranche 1 of 3"
  fundedAt?: Timestamp;
}

/** Currency symbols offered when tagging a member's funding. */
export const CURRENCIES = ["$", "₦", "£", "€", "₵", "R", "KSh"] as const;

export const DEFAULT_CURRENCY = "$";

/** "$200,000" — grouped thousands, no stray decimals. */
export function formatFunding(amount: number | undefined, currency?: string): string {
  return `${currency || DEFAULT_CURRENCY}${(amount ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

/** Funding badge text + icon. Icon and words carry the meaning, not colour. */
export function fundingBadge(profile: {
  funded?: boolean;
  fundedAmount?: number;
  fundedCurrency?: string;
}): { icon: string; label: string; color: string } {
  if (profile.funded) {
    return {
      icon: "💰",
      label: `Funded — ${formatFunding(profile.fundedAmount, profile.fundedCurrency)}`,
      color: "#0ca30c",
    };
  }
  return { icon: "○", label: "Not funded", color: "#898781" };
}

export interface BroadcastPost {
  id: string;
  authorUid: string;
  authorHandle: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  mediaName?: string;
  createdAt?: Timestamp;
}

/** General Community Room is emoji-reactions only. */
export const COMMUNITY_EMOJIS = ["👍", "🙏", "🔥", "💪", "🎉", "❤️", "👏", "✅"] as const;

export interface CommunityReaction {
  id: string;
  uid: string;
  emoji: string;
  createdAt?: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  topic?: string;
  createdBy: string;
  createdAt?: Timestamp;
}

export interface RoomMessage {
  id: string;
  authorUid: string;
  authorHandle: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  mediaName?: string;
  createdAt?: Timestamp;
}

// ---------- Phase 2: room-embedded forms & digital signatures ----------

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "checkbox"
  | "select"
  | "signature";

export const FORM_FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Yes / No" },
  { value: "select", label: "Dropdown" },
  { value: "signature", label: "✍️ Digital signature" },
];

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[]; // for "select"
}

export interface RoomForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  open: boolean; // closed forms stop accepting submissions
  createdBy: string;
  createdAt?: Timestamp;
}

/** One per user per form: doc id is `${formId}_${uid}`. Signatures are
 *  stored inline as small PNG data-URLs inside `answers`. */
export interface FormSubmission {
  id: string;
  uid: string;
  handle: string;
  formId: string;
  answers: Record<string, string | boolean>;
  submittedAt?: Timestamp;
}

// ---------- Phase 3: milestones & funded outcomes ----------

export type MilestoneStatus = "planned" | "in_progress" | "blocked" | "completed";

/**
 * Status presentation. Colour NEVER carries the meaning on its own — every
 * status ships with its icon and label, because the completed-green and
 * blocked-red are near-identical to red/green colour-blind readers.
 */
export const MILESTONE_STATUS: Record<
  MilestoneStatus,
  { label: string; icon: string; color: string; darkColor: string }
> = {
  planned: { label: "Planned", icon: "📋", color: "#898781", darkColor: "#898781" },
  in_progress: { label: "In progress", icon: "⏳", color: "#4f46e5", darkColor: "#818cf8" },
  blocked: { label: "Blocked", icon: "⛔", color: "#d03b3b", darkColor: "#d03b3b" },
  completed: { label: "Completed", icon: "✅", color: "#0ca30c", darkColor: "#0ca30c" },
};

export const MILESTONE_STATUS_ORDER: MilestoneStatus[] = [
  "planned",
  "in_progress",
  "blocked",
  "completed",
];

export interface Milestone {
  id: string;
  title: string;
  roomId: string;
  roomName: string;
  status: MilestoneStatus;
  fundedAmount: number; // money committed to this milestone
  spentAmount: number; // money released/spent so far
  dueDate?: string; // ISO yyyy-mm-dd
  hindrance?: string; // what is blocking it, when status is "blocked"
  createdBy: string;
  createdAt?: Timestamp;
}

// ---------- Phase 2: compliance & event logs ----------

export interface ComplianceLog {
  id: string;
  actorUid: string;
  category: string; // e.g. account_created, room_member_added, form_submission
  meta: Record<string, string>;
  at?: Timestamp;
}

export interface DmThread {
  id: string;
  participants: string[]; // exactly two uids
  handles: Record<string, string>; // uid -> handle snapshot for list display
  lastText?: string;
  lastSenderUid?: string;
  updatedAt?: Timestamp;
  /** Set when the SuperAdmin triages this thread in the master inbox. */
  staffReadAt?: Timestamp;
}

export interface DmMessage {
  id: string;
  senderUid: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt?: Timestamp;
}
