import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveAccountNow } from "@/lib/supabase-sync";
import { isSupabaseConfigured } from "@/lib/supabase-config";

const OK_MSG = "Saved on the server.";
const LOCAL_MSG = "Saved on this computer. The other desk is separate.";
const FAIL_MSG = "Not saved on the server. This computer's data is unchanged.";

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
      aria-label="Save to server"
      title="Send this computer's books to the hotel account"
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
      const result = await saveAccountNow();
      if (result.ok) {
        toast.success(isSupabaseConfigured() ? OK_MSG : LOCAL_MSG);
        return true;
      }
      toast.error(result.message ? `${FAIL_MSG} ${result.message}` : FAIL_MSG);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, saveToServer, saveAfter: saveToServer, sealAndSave: saveToServer };
}
