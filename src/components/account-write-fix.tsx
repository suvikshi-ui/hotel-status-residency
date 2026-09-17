import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUPABASE_SQL_EDITOR, DESK_SAVE_SQL_FILE } from "@/lib/supabase-config";
import { useCloudSync } from "@/lib/supabase-sync";
import { isPermissionMessage } from "@/lib/cloud-errors";
import { copyText, downloadText } from "@/lib/copy-text";
import deskSaveSql from "../../supabase/migrations/0009_desk_can_save.sql?raw";

export function AccountWriteFix() {
  const cloud = useCloudSync();
  if (cloud.phase !== "error" || !isPermissionMessage(cloud.message)) return null;

  function copyNow() {
    if (copyText(deskSaveSql)) {
      toast.success("SQL copied — paste in the SQL editor, press Run, then Save.");
      return;
    }
    toast.error("Copy blocked on this computer. Select the SQL box, Ctrl+A, Ctrl+C.");
  }

  return (
    <div className="rounded-lg border border-due/40 bg-card px-4 py-3 text-sm">
      <p className="font-medium">
        Account cannot write yet
        {cloud.message ? ` — ${cloud.message}` : ""}.
      </p>
      <p className="mt-1 text-muted">
        Open the SQL file, copy all, paste in the SQL editor, press Run, then
        Save cube. One run is enough for every desk.
      </p>
      <textarea
        readOnly
        value={deskSaveSql}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-3 h-28 w-full resize-y rounded-md border border-border bg-bg p-2 font-mono text-[11px] leading-snug text-fg"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={copyNow}>
          Copy SQL
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            downloadText("hotel-desk-save.sql", deskSaveSql);
            toast.success("SQL file downloaded. Open it, copy all, paste in the SQL editor.");
          }}
        >
          Download SQL
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={DESK_SAVE_SQL_FILE} target="_blank" rel="noreferrer">
            Open SQL file
          </a>
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={SUPABASE_SQL_EDITOR} target="_blank" rel="noreferrer">
            Open SQL editor
          </a>
        </Button>
      </div>
    </div>
  );
}
