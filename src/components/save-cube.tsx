import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { flushBooksToDisk } from "@/lib/store";

export function SaveCube({
  busy,
  onSave,
}: {
  pending?: boolean;
  hasEntries?: boolean;
  onSave: () => void;
  busy?: boolean;
}) {
  return (
    <Button
      type="button"
      disabled={busy}
      onClick={onSave}
      aria-label="Save on this computer"
      title="Save this book on this computer"
    >
      {busy ? "Saving…" : "Save"}
    </Button>
  );
}

export function useAccountSave() {
  const [busy, setBusy] = useState(false);

  async function saveToServer() {
    setBusy(true);
    try {
      flushBooksToDisk();
      toast.success("Saved on this computer.");
      return true;
    } finally {
      setBusy(false);
    }
  }

  return { busy, saveToServer, saveAfter: saveToServer, sealAndSave: saveToServer };
}