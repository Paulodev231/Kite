"use client";

import { useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useT } from "@/context/LanguageContext";

export default function NotificationSettings() {
  const { notificationsOn, enableNotifications } = useNotifications();
  const [denied, setDenied] = useState(false);
  const { t } = useT();

  return (
    <div className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">🔔 {t("notifications")}</p>
      <p className="text-[11px] leading-relaxed opacity-60">
        {t("notificationsHint")}
      </p>
      {notificationsOn ? (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
          ✅ {t("notificationsOn")}
        </p>
      ) : (
        <button
          type="button"
          onClick={async () => {
            const ok = await enableNotifications();
            setDenied(!ok);
          }}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98]"
        >
          {t("turnOnNotifications")}
        </button>
      )}
      {denied && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600">
          Your browser blocked the request. Allow notifications for this site in
          your browser settings, then try again.
        </p>
      )}
      <p className="text-[10px] leading-relaxed opacity-40">
        Unread counts always show on the tab bar, with or without notifications.
      </p>
    </div>
  );
}
