import { Button } from "@/components/ui/button";

export function StayToggle({
  stay,
  onChange,
}: {
  stay?: "continue" | "out" | null;
  onChange: (stay: "continue" | "out") => void;
}) {
  const out = stay === "out";
  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        variant={out ? "outline" : "secondary"}
        onClick={() => onChange("continue")}
      >
        Continue
      </Button>
      <Button
        type="button"
        size="sm"
        variant={out ? "default" : "outline"}
        onClick={() => onChange("out")}
      >
        Checked out
      </Button>
    </div>
  );
}
