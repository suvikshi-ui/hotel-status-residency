import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLedger } from "@/lib/store";
import { saveAccountNow } from "@/lib/supabase-sync";
import { isPermissionMessage } from "@/lib/cloud-errors";

export function SaveCube({
  pending,
  hasEntries,
  onSave,
  busy,
}: {
  pending: boolean;
  hasEntries: boolean;
  onSave: () => void;
  busy?: boolean;
}) {
  const canSave = Boolean(hasEntries && pending && !busy);
  const saved = Boolean(hasEntries && !pending);
  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={onSave}
      aria-label={
        saved ? "Account saved — these entries will not change" : "Save this sheet"
      }
      title={
        saved
          ? "Account saved. These entries will not change."
          : canSave
            ? "Save to the hotel account. After this, the entries will not change."
            : "Add an entry, then press Save."
      }
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-md text-center text-[10px] font-semibold uppercase leading-tight tracking-wide",
        canSave && "bg-primary text-primary-fg",
        saved && "bg-ok text-primary-fg",
        !hasEntries && "border border-dashed border-border bg-card text-muted",
        busy && "opacity-70",
      )}
    >
      {busy ? "…" : saved ? "Saved" : "Save"}
    </button>
  );
}

export function useAccountSave() {
  const sealEntries = useLedger((s) => s.sealEntries);
  const [busy, setBusy] = useState(false);

  async function report(okMessage: string) {
    setBusy(true);
    try {
      const result = await saveAccountNow();
      if (result.ok) {
        toast.success(okMessage);
        return true;
      }
      if (isPermissionMessage(result.message)) {
        toast.error(
          "Account write is blocked. Books stay on this computer — do not refresh other desks yet.",
        );
        return false;
      }
      toast.error(result.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function sealAndSave(keys: string[], okMessage: string) {
    if (!keys.length) return;
    void report(okMessage).then((ok) => {
      if (ok) sealEntries(keys);
    });
  }

  return { busy, sealAndSave, saveAfter: report };
}
