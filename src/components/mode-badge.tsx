import { Badge } from "@/components/ui/badge";
import { MODE_SHORT } from "@/lib/format";
import type { PayMode } from "@/lib/types";

const variant: Record<PayMode, "cash" | "qr" | "pk" | "online" | "balance"> = {
  CASH: "cash",
  QRS: "qr",
  QRPK: "pk",
  ONLINE: "online",
  BALANCE: "balance",
};

export function ModeBadge({ mode }: { mode: PayMode }) {
  return <Badge variant={variant[mode]}>{MODE_SHORT[mode]}</Badge>;
}
