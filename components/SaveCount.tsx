"use client";

import { useEffect, useState } from "react";
import { getSaveCount, SAVES_CHANGED_EVENT } from "@/lib/supabase/saves";

export function SaveCount({ className = "" }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function syncCount() {
      try {
        const next = await getSaveCount();
        if (active) setCount(next);
      } catch {
        // Keep navigation stable if Supabase is temporarily unreachable.
      }
    }

    syncCount();
    window.addEventListener(SAVES_CHANGED_EVENT, syncCount);
    window.addEventListener("storage", syncCount);

    return () => {
      active = false;
      window.removeEventListener(SAVES_CHANGED_EVENT, syncCount);
      window.removeEventListener("storage", syncCount);
    };
  }, []);

  if (!count) return null;
  return <span className={`saveCount ${className}`.trim()}>{count}</span>;
}
