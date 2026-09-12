import { cn } from "@/lib/utils";

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
        saved ? "Saved — these entries will not change" : "Save this sheet"
      }
      title={
        saved
          ? "Saved. These entries will not change."
          : canSave
            ? "Save. After this, the entries will not change."
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
