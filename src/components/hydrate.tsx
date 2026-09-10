import { useEffect, type ReactNode } from "react";
import { setLedgerOwner } from "@/lib/store";
import { useStaffSession } from "@/lib/supabase-auth";

export function HydrateLedger({ children }: { children: ReactNode }) {
  const { user, isPending } = useStaffSession();

  useEffect(() => {
    if (isPending) return;
    void setLedgerOwner(user?.id ?? null);
  }, [user?.id, isPending]);

  return <>{children}</>;
}
