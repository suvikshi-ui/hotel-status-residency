import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUPABASE_SQL_EDITOR } from "@/lib/supabase-config";
import { useCloudSync } from "@/lib/supabase-sync";
import { isPermissionMessage } from "@/lib/cloud-errors";
import deskSaveSql from "../../supabase/migrations/0009_desk_can_save.sql?raw";

export function copyDeskSaveSql() {
  return navigator.clipboard.writeText(deskSaveSql);
}

export function AccountWriteFix() {
  const cloud = useCloudSync();
  if (cloud.phase !== "error" || !isPermissionMessage(cloud.message)) return null;

  return (
    <div className="rounded-lg border border-due/40 bg-card px-4 py-3 text-sm">
      <p className="font-medium">This login cannot write the hotel account yet.</p>
      <p className="mt-1 text-muted">
        Tap Copy SQL, paste it in the SQL editor, press Run, then press Save cube
        again. One run is enough for every desk.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            void copyDeskSaveSql().then(
              () => toast.success("SQL copied — paste it, press Run, then Save."),
              () => toast.error("Could not copy SQL"),
            );
          }}
        >
          Copy SQL
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
