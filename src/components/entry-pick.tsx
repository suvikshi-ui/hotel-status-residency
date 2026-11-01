import { Button } from "@/components/ui/button";

export type PickMode = "edit" | "delete" | null;

export function EntryPick({
  mode,
  onMode,
  count,
  onDelete,
}: {
  mode: PickMode;
  onMode: (mode: PickMode) => void;
  count: number;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        type="button"
        size="sm"
        variant={mode === "edit" ? "default" : "outline"}
        onClick={() => onMode(mode === "edit" ? null : "edit")}
      >
        Edit
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "delete" ? "default" : "outline"}
        onClick={() => onMode(mode === "delete" ? null : "delete")}
      >
        Delete
      </Button>
      {mode === "delete" && count > 0 ? (
        <Button type="button" size="sm" variant="danger" onClick={onDelete}>
          Delete selected ({count})
        </Button>
      ) : null}
    </div>
  );
}

export function EntryTick({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      className="size-4 accent-[#8d6b3a]"
      checked={checked}
      aria-label={label}
      onChange={onChange}
    />
  );
}
