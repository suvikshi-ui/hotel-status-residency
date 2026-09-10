import { useEffect, useState, type ReactNode } from "react";
import { HotelLogo } from "@/components/hotel-logo";
import { setLedgerOwner } from "@/lib/store";
import { useStaffSession } from "@/lib/supabase-auth";
import {
  hydrateFromCloud,
  startCloudSync,
  stopCloudSync,
} from "@/lib/supabase-sync";

function CloudSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <HotelLogo mark className="h-14 w-auto" />
        <div className="h-8 w-48 animate-pulse rounded-md bg-bg-warm" />
        <p className="text-sm text-muted">Loading hotel books…</p>
      </div>
    </div>
  );
}

export function HydrateLedger({ children }: { children: ReactNode }) {
  const { user, isPending } = useStaffSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    setReady(false);
    stopCloudSync();

    void (async () => {
      await setLedgerOwner(user?.id ?? null);
      if (user?.id) {
        const phase = await hydrateFromCloud(user.id);
        if (phase !== "missing-schema" && phase !== "error" && phase !== "off") {
          startCloudSync(user.id);
        }
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isPending]);

  if (isPending) return <>{children}</>;
  if (user && !ready) return <CloudSkeleton />;
  return <>{children}</>;
}
