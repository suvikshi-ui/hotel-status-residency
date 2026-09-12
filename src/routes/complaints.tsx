import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGate } from "@/components/security-gate";
import {
  COMPLAINT_LEVELS,
  complaintsForRoom,
  emptyComplaint,
  roomCubeLayout,
  type ComplaintLevel,
  type RoomComplaint,
} from "@/lib/complaints";
import { formatDayShort } from "@/lib/format";
import { useLedger } from "@/lib/store";
import type { RoomDef } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SaveCube } from "@/components/save-cube";
import { isSealed, sealKey, unsealedKeys } from "@/lib/sheet-seal";

export const Route = createFileRoute("/complaints")({
  component: ComplaintsPage,
});

const FLOORS: RoomDef["floor"][] = ["Ground", "First", "Second", "Third"];

const LEVEL_FACE: Record<ComplaintLevel, string> = {
  red: "bg-danger text-primary-fg",
  yellow: "bg-due text-primary-fg",
  green: "bg-ok text-primary-fg",
};

const LEVEL_RING: Record<ComplaintLevel, string> = {
  red: "border-danger bg-danger/15 text-danger",
  yellow: "border-due bg-due/15 text-due",
  green: "border-ok bg-ok/15 text-ok",
};

function ComplaintsPage() {
  const rooms = useLedger((s) => s.rooms);
  const complaints = useLedger((s) => s.complaints);
  const setComplaints = useLedger((s) => s.setComplaints);
  const sealedIds = useLedger((s) => s.sealedIds);
  const sealEntries = useLedger((s) => s.sealEntries);
  const role = useLedger((s) => s.appRole);
  const { gate } = useGate();
  const [open, setOpen] = useState<{
    roomNo: string;
    existing?: RoomComplaint;
  } | null>(null);
  const [note, setNote] = useState("");
  const [level, setLevel] = useState<ComplaintLevel>("yellow");

  const openCount = complaints.filter((c) => c.level !== "green").length;
  const redCount = complaints.filter((c) => c.level === "red").length;
  const complaintKeys = complaints.map((c) => sealKey.complaint(c.id));
  const pendingSave = unsealedKeys(complaintKeys, sealedIds).length > 0;

  const byFloor = useMemo(
    () =>
      FLOORS.map((floor) => ({
        floor,
        rooms: rooms.filter((r) => r.floor === floor),
      })),
    [rooms],
  );

  function startNew(roomNo: string) {
    setNote("");
    setLevel("yellow");
    setOpen({ roomNo });
  }

  function startEdit(roomNo: string, existing: RoomComplaint) {
    if (isSealed(sealedIds, sealKey.complaint(existing.id))) {
      toast.message("Saved cube — this complaint will not change");
      return;
    }
    setNote(existing.note);
    setLevel(existing.level);
    setOpen({ roomNo, existing });
  }

  function save() {
    if (!open) return;
    const roomNo = open.roomNo;
    const text = note.trim();
    if (!text) {
      toast.error("Write the complaint");
      return;
    }
    const existing = open.existing;
    if (existing && isSealed(sealedIds, sealKey.complaint(existing.id))) {
      toast.message("Saved cube — this complaint will not change");
      return;
    }
    const apply = () => {
      if (existing) {
        setComplaints(
          complaints.map((c) =>
            c.id === existing.id ? { ...c, note: text, level } : c,
          ),
        );
        toast.success(`Room ${roomNo} updated`);
      } else {
        setComplaints([...complaints, emptyComplaint(roomNo, level, text)]);
        toast.success(`Room ${roomNo} complaint logged`);
      }
      setOpen(null);
    };
    if (role === "housekeeping") {
      apply();
      return;
    }
    gate(apply, {
      title: "Are you sure?",
      message: existing
        ? `Update room ${roomNo} to ${level}?`
        : `Register ${level} complaint for room ${roomNo}?`,
      confirmLabel: existing ? "Save" : "Register",
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Housekeeping
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Complaints
        </h1>
        <p className="mt-1 text-sm text-muted">
          Log a cube, then press Save at the top. After save that cube does not
          change. A new empty cube stays in front for the next entry.
        </p>
      </div>
      <SaveCube
        hasEntries={complaints.length > 0}
        pending={pendingSave}
        onSave={() => {
          sealEntries(complaintKeys);
          toast.success("Saved — these cubes will not change");
        }}
      />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open" value={openCount} />
        <Stat label="Emergency" value={redCount} tone="danger" />
        <Stat label="Logged" value={complaints.length} />
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend className="bg-danger" label="Emergency" />
        <Legend className="bg-due" label="Moderate" />
        <Legend className="bg-ok" label="Solved" />
        <Legend className="border border-dashed border-border bg-card" label="Empty cube" />
      </div>

      {byFloor.map(({ floor, rooms: floorRooms }) => (
        <Card key={floor}>
          <CardHeader>
            <CardTitle className="text-base">{floor} floor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {floorRooms.map((r) => {
              const items = complaintsForRoom(complaints, r.no);
              const { trail, slots } = roomCubeLayout(items);
              const hottest = items.find((c) => c.level === "red")
                ? "red"
                : items.find((c) => c.level === "yellow")
                  ? "yellow"
                  : items.find((c) => c.level === "green")
                    ? "green"
                    : null;
              return (
                <div
                  key={r.no}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-bg-warm/50 px-2 py-1.5 sm:px-3"
                >
                  <span className="w-10 shrink-0 font-display text-lg font-semibold tabular">
                    {r.no}
                  </span>
                  {hottest ? (
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        hottest === "red" && "bg-danger",
                        hottest === "yellow" && "bg-due",
                        hottest === "green" && "bg-ok",
                      )}
                    />
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-border" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    {trail.map((c) => (
                      <Cube
                        key={c.id}
                        item={c}
                        size="sm"
                        frozen={isSealed(sealedIds, sealKey.complaint(c.id))}
                        onClick={() => startEdit(r.no, c)}
                      />
                    ))}
                    {slots.map((item, i) =>
                      item ? (
                        <Cube
                          key={item.id}
                          item={item}
                          size="md"
                          frozen={isSealed(sealedIds, sealKey.complaint(item.id))}
                          onClick={() => startEdit(r.no, item)}
                        />
                      ) : (
                        <button
                          key={`${r.no}-empty-${i}`}
                          type="button"
                          onClick={() => startNew(r.no)}
                          aria-label={`Add complaint for room ${r.no}`}
                          className="grid size-11 place-items-center rounded-md border border-dashed border-border bg-card text-lg leading-none text-muted hover:border-primary hover:text-primary"
                        >
                          +
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={Boolean(open)}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {open?.existing ? "Update complaint" : "Register complaint"} · Room{" "}
              {open?.roomNo}
            </DialogTitle>
            <DialogDescription>
              Red for emergency, yellow if it can wait, green when it is fixed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="complaint-note">What is wrong</Label>
              <Input
                id="complaint-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="AC, tap, lock…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Colour</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLAINT_LEVELS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevel(opt.id)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-left",
                      level === opt.id
                        ? LEVEL_RING[opt.id]
                        : "border-border bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 block size-4 rounded-sm",
                        LEVEL_FACE[opt.id],
                      )}
                    />
                    <span className="block text-xs font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={save}>
                {open?.existing ? "Save" : "Register"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cube({
  item,
  size,
  frozen,
  onClick,
}: {
  item: RoomComplaint;
  size: "sm" | "md";
  frozen?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${item.note}${item.createdAt ? ` · ${formatDayShort(item.createdAt)}` : ""}${frozen ? " · saved" : ""}`}
      className={cn(
        "shrink-0 rounded-md text-left",
        LEVEL_FACE[item.level],
        size === "sm" ? "size-7" : "size-11 p-1",
        frozen && "cursor-default opacity-90",
      )}
    >
      {size === "md" ? (
        <span className="block truncate text-[10px] font-medium leading-tight">
          {item.note || "—"}
        </span>
      ) : null}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular",
          tone === "danger" && value > 0 && "text-danger",
        )}
      >
        {value}
      </div>
    </Card>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className={cn("size-3 rounded-sm", className)} />
      {label}
    </span>
  );
}
