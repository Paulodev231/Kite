/* eslint-disable @next/next/no-img-element */
"use client";

import { useT } from "@/context/LanguageContext";

export default function MediaAttachment({
  url,
  type,
  name,
}: {
  url: string;
  type?: "image" | "video" | "file";
  name?: string;
}) {
  const { t } = useT();

  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={url}
          alt={name ?? t("attachedImage")}
          className="mt-2 max-h-72 w-auto max-w-full rounded-xl object-contain"
          loading="lazy"
        />
      </a>
    );
  }
  if (type === "video") {
    return <video src={url} controls playsInline className="mt-2 w-full rounded-xl" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand"
    >
      📄 <span className="truncate">{name ?? t("attachment")}</span>
    </a>
  );
}
