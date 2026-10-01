import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGate } from "@/components/security-gate";

export function PkRefField({
  value,
  onSave,
  disabled,
}: {
  value?: string | null;
  onSave: (ref: string) => void;
  disabled?: boolean;
}) {
  const saved = value ?? "";
  const [text, setText] = useState(saved);
  useEffect(() => setText(saved), [saved]);
  if (disabled) {
    return <span className="text-sm tabular text-muted">{saved || "—"}</span>;
  }
  return (
    <Input
      value={text}
      placeholder="P.K. QR ref no."
      aria-label="P.K. QR reference number"
      className="h-9 min-w-36"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text.trim() !== saved.trim()) onSave(text.trim());
      }}
    />
  );
}

export function GuardedPkRef({
  locked,
  value,
  onSave,
}: {
  locked: boolean;
  value?: string | null;
  onSave: (ref: string, bypass: boolean) => void;
}) {
  const { gate } = useGate();
  const [open, setOpen] = useState(false);
  if (!locked || open) {
    return (
      <PkRefField
        value={value}
        onSave={(ref) => {
          onSave(ref, locked);
          setOpen(false);
        }}
      />
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm tabular">{value || "—"}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          gate(() => setOpen(true), {
            title: "Edit this reference?",
            message: "Enter the security code, then change the P.K. QR reference.",
            confirmLabel: "Edit",
            requireCode: true,
          })
        }
      >
        Edit
      </Button>
    </div>
  );
}