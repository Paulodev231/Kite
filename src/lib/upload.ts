import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface UploadedFile {
  url: string;
  name: string;
  kind: "image" | "video" | "file";
}

/**
 * Uploads a file to Firebase Storage and returns its public download URL.
 * `maxMB` must match the limit in storage.rules for the destination (50 for
 * rooms/broadcast, 25 for DMs) — we check it here too so an over-size file
 * fails with a clear message instead of a silent rules rejection.
 * Throws "file-too-large" or "upload-failed".
 */
export async function uploadFile(
  pathPrefix: string,
  file: File,
  maxMB = 50,
): Promise<UploadedFile> {
  if (file.size > maxMB * 1024 * 1024) throw new Error("file-too-large");
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const fileRef = ref(storage(), `${pathPrefix}/${Date.now()}_${safeName}`);
  // Some phone pickers hand us a file with an empty type; keep a valid one so
  // the content-type checks in storage.rules still pass.
  const contentType = file.type || "application/octet-stream";
  try {
    await uploadBytes(fileRef, file, { contentType });
  } catch {
    throw new Error("upload-failed");
  }
  const url = await getDownloadURL(fileRef);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind: UploadedFile["kind"] =
    contentType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(ext)
      ? "image"
      : contentType.startsWith("video/") || ["mp4", "mov", "webm", "m4v"].includes(ext)
        ? "video"
        : "file";
  return { url, name: file.name, kind };
}
