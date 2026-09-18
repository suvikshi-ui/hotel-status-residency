import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUPABASE_SQL_EDITOR } from "@/lib/supabase-config";
import { retryCloudHydrate } from "@/lib/supabase-sync";
import { copyText } from "@/lib/copy-text";
import ledgerSql from "../../supabase/migrations/0001_ledger.sql?raw";
import usersSql from "../../supabase/migrations/0002_hotel_users.sql?raw";
import appUsersSql from "../../supabase/migrations/0003_public_users.sql?raw";
import rlsSql from "../../supabase/migrations/0005_rls_strong.sql?raw";
import locksSql from "../../supabase/migrations/0006_opening_locks.sql?raw";
import sealsSql from "../../supabase/migrations/0007_sheet_seals.sql?raw";
import staffSaveSql from "../../supabase/migrations/0008_staff_register_save.sql?raw";
import deskSaveSql from "../../supabase/migrations/0009_desk_can_save.sql?raw";
import ownerIdSql from "../../supabase/migrations/0010_users_owner_id.sql?raw";
import confirmSql from "../../supabase/migrations/0011_confirm_staff_logins.sql?raw";

export function CloudSchemaSetup({ userId }: { userId?: string | null }) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        onClick={() => {
          const sql = `${ledgerSql}\n\n${usersSql}\n\n${appUsersSql}\n\n${rlsSql}\n\n${locksSql}\n\n${sealsSql}\n\n${staffSaveSql}\n\n${deskSaveSql}\n\n${ownerIdSql}\n\n${confirmSql}`;
          if (copyText(sql)) {
            toast.success("SQL copied. Paste it in the SQL editor, run it, then retry.");
          } else {
            toast.error("Copy blocked on this computer. Open the SQL box on Register instead.");
          }
        }}
      >
        Copy table SQL
      </Button>
      <Button type="button" variant="outline" asChild>
        <a href={SUPABASE_SQL_EDITOR} target="_blank" rel="noreferrer">
          Open SQL editor
        </a>
      </Button>
      {userId ? (
        <Button
          type="button"
          variant="outline"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            void retryCloudHydrate(userId).finally(() => setRetrying(false));
          }}
        >
          {retrying ? "Checking…" : "Tables are ready"}
        </Button>
      ) : null}
    </div>
  );
}
