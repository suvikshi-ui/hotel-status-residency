import { toast } from "sonner";
import { formatDay } from "@/lib/format";

export function tellDateLocked(date?: string) {
  const when = date ? formatDay(date) : "Yeh date";
  toast.error(
    `${when} lock ho chuka hai. Pehle unlock karo. Lock ke baad balance due, receive aur delete nahi hoga.`,
    { position: "top-center", duration: 6500 },
  );
}
