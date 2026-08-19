import type { Timestamp } from "firebase/firestore";

/** Role hierarchy. "staff" = a Managed Staff Handle operated by the SuperAdmin. */
export type Role = "member" | "staff" | "admin" | "superadmin";

export const ADMIN_ROLES: Role[] = ["admin", "superadmin"];

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export interface UserProfile {
  uid: string;
  handle: string; // public display handle, e.g. "PM_Ade"
  role: Role;
  active: boolean; // deactivated accounts cannot use the app
  onCall?: boolean; // staff handles only: counted in the presence indicator
  createdAt?: Timestamp;
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
