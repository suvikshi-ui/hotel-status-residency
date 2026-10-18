import { useEffect, useState, type ReactNode } from "react";
import { setLedgerOwner, useLedger } from "@/lib/store";

export function HydrateLedger({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await setLedgerOwner(null);
      if (cancelled) return;
      useLedger.getState().setAppRole("admin");
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
