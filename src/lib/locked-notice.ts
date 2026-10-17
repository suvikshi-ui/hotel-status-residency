import { toast } from "sonner";
import { formatDay } from "@/lib/format";

export function tellDateLocked(date?: string) {
  const when = date ? formatDay(date) : "This date";
  toast.error(
    `${when} is locked. Unlock it first. Balance due, receive and delete stay closed until then.`,
    { position: "top-center", duration: 6500 },
  );
}
