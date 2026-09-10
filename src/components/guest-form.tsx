import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DateNav } from "@/components/date-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uniqueSources } from "@/lib/balance";
import { formatDay, MODES, MODE_LABEL } from "@/lib/format";
import { useLedger } from "@/lib/store";
import { useGate } from "@/components/security-gate";
import type { GuestEntry, PayMode } from "@/lib/types";

export function GuestForm({
  editing,
  onCancelEdit,
}: {
  editing?: GuestEntry | null;
  onCancelEdit?: () => void;
}) {
  const date = useLedger((s) => s.selectedDate);
  const rooms = useLedger((s) => s.rooms);
  const guests = useLedger((s) => s.guests);
  const addGuest = useLedger((s) => s.addGuest);
  const updateGuest = useLedger((s) => s.updateGuest);
  const { gate } = useGate();
  const sourceHints = uniqueSources(guests);
  const nameRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [roomNo, setRoomNo] = useState(rooms[0]?.no ?? "101");
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState("1500");
  const [source, setSource] = useState("");
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setRoomNo(editing.roomNo);
    setMode(editing.mode);
    setAmount(String(editing.amount));
    setSource(editing.source ?? "");
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    nameRef.current?.focus();
  }, [editing]);

  function resetAdd() {
    setName("");
    setSource("");
    setAmount("1500");
    setMode("CASH");
    setRoomNo(rooms[0]?.no ?? "101");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Guest name is required");
      nameRef.current?.focus();
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const posted = name.trim().toUpperCase();
    const payload = {
      name: posted,
      roomNo,
      mode,
      source: source.trim() || null,
      amount: amt,
    };
    if (editing) {
      gate(
        () => {
          updateGuest(editing.id, payload);
          toast.success(`Updated ${posted} · Room ${roomNo}`);
          resetAdd();
          onCancelEdit?.();
          nameRef.current?.focus();
        },
        {
          title: "Are you sure?",
          message: `Save changes to ${posted} · Room ${roomNo}?`,
          confirmLabel: "Save",
        },
      );
      return;
    } else {
      addGuest(payload);
      toast.success(`Posted ${posted} · Room ${roomNo} · ${formatDay(date)}`);
      setName("");
      setSource("");
    }
    nameRef.current?.focus();
  }

  return (
    <div ref={cardRef}>
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-warm/60 px-5 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {isEdit ? "Edit guest" : "Add guest"}
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {isEdit ? editing?.name : "New posting"}
          </h2>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {isEdit ? "Posted on" : "Posting to"}
          </p>
          {isEdit ? (
            <p className="font-display text-base font-semibold">
              {formatDay(editing?.date ?? date)}
            </p>
          ) : (
            <DateNav />
          )}
        </div>
      </div>
      <CardContent className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 grid gap-1.5 lg:col-span-1">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Guest name"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-room">Room number</Label>
              <Select value={roomNo} onValueChange={setRoomNo}>
                <SelectTrigger id="g-room" aria-label="Room number">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.no} value={r.no}>
                      {r.no} · {r.floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-mode">Mode of payment</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PayMode)}>
                <SelectTrigger id="g-mode" aria-label="Mode of payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-amt">Amount</Label>
              <Input
                id="g-amt"
                type="number"
                inputMode="numeric"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-src">Source</Label>
              <Input
                id="g-src"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Company / walk-in name"
                autoComplete="off"
                list="source-hints"
              />
              <datalist id="source-hints">
                {sourceHints.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              {isEdit
                ? "Change name, room, mode, amount or source, then save."
                : "Name, room, payment mode, amount and source — posted to the selected date. Form stays open for the next guest."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 sm:min-w-28"
                  onClick={() => {
                    resetAdd();
                    onCancelEdit?.();
                  }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" className="shrink-0 sm:min-w-40">
                {isEdit ? "Save changes" : "Add guest"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
