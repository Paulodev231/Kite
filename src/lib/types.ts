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

export interface DmThread {
  id: string;
  participants: string[]; // exactly two uids
  handles: Record<string, string>; // uid -> handle snapshot for list display
  lastText?: string;
  lastSenderUid?: string;
  updatedAt?: Timestamp;
}

export interface DmMessage {
  id: string;
  senderUid: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt?: Timestamp;
}
