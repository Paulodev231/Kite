"use client";

// Tells the user plainly when they are offline. Thanks to the Firestore
// on-device cache they can keep reading and typing — messages send
// themselves once the connection returns.
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="app-chrome bg-amber-500 px-3 py-1.5 text-center text-[11px] font-bold text-black">
      📴 Offline — you can keep reading and typing. Messages send when you reconnect.
    </div>
  );
}
