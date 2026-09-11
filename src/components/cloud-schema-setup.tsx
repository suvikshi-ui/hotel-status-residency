import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUPABASE_SQL_EDITOR } from "@/lib/supabase-config";
import { retryCloudHydrate } from "@/lib/supabase-sync";
import ledgerSql from "../../supabase/migrations/0001_ledger.sql?raw";
import usersSql from "../../supabase/migrations/0002_hotel_users.sql?raw";
import appUsersSql from "../../supabase/migrations/0003_public_users.sql?raw";
import rlsSql from "../../supabase/migrations/0005_rls_strong.sql?raw";

export function CloudSchemaSetup({ userId }: { userId?: string | null }) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(
            `${ledgerSql}\n\n${usersSql}\n\n${appUsersSql}\n\n${rlsSql}`,
          ).then(
            () =>
              toast.success(
                "SQL copied. Paste it in the SQL editor, run it, then retry.",
              ),
            () => toast.error("Could not copy SQL"),
          );
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
