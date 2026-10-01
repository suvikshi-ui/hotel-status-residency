import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function PkRefField({
  value,
  onSave,
}: {
  value?: string | null;
  onSave: (ref: string) => void;
}) {
  const saved = value ?? "";
  const [text, setText] = useState(saved);
  useEffect(() => setText(saved), [saved]);
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
