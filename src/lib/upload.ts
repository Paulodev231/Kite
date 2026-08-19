import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface UploadedFile {
  url: string;
  name: string;
  kind: "image" | "video" | "file";
}

/** Uploads a file to Firebase Storage and returns its public download URL. */
export async function uploadFile(pathPrefix: string, file: File): Promise<UploadedFile> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const fileRef = ref(storage(), `${pathPrefix}/${Date.now()}_${safeName}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  const kind = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : "file";
  return { url, name: file.name, kind };
}
