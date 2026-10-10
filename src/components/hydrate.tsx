import { useEffect, useState, type ReactNode } from "react";
import { HotelLogo } from "@/components/hotel-logo";
import { setLedgerOwner, useLedger } from "@/lib/store";
import {
  hydrateFromCloud,
  startCloudSync,
  stopCloudSync,
} from "@/lib/supabase-sync";
import { useStaffSession } from "@/lib/supabase-auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";

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
    const ownerId = user?.ownerId || user?.id || null;
    setReady(false);
    stopCloudSync();

    void (async () => {
      await setLedgerOwner(ownerId);
      if (cancelled) return;
      if (user) useLedger.getState().setAppRole(user.role);
      else if (!isSupabaseConfigured()) useLedger.getState().setAppRole("admin");
      if (!cancelled) setReady(true);
      if (ownerId && user) {
        await hydrateFromCloud(ownerId);
        if (cancelled) return;
        startCloudSync(ownerId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.ownerId, isPending]);

  useEffect(() => {
    if (user) useLedger.getState().setAppRole(user.role);
  }, [user?.id, user?.role]);

  if (isPending) return <>{children}</>;
  if (user && !ready) return <CloudSkeleton />;
  return <>{children}</>;
}
