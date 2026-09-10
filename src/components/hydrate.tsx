import { useEffect, type ReactNode } from "react";
import { useLedger } from "@/lib/store";

export function HydrateLedger({ children }: { children: ReactNode }) {
  useEffect(() => {
    void Promise.resolve(useLedger.persist.rehydrate()).catch(() => {
      /* keep seed if saved ledger cannot restore */
    });
  }, []);
  return <>{children}</>;
}
