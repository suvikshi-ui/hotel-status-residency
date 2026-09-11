import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DateNav } from "@/components/date-nav";
import { ModeBadge } from "@/components/mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDay, formatDayShort, MODES, MODE_LABEL, money } from "@/lib/format";
import { findDuplicateOnDate } from "@/lib/stay";
import { useLedger } from "@/lib/store";
import { useGate } from "@/components/security-gate";
import type { GuestEntry, PayMode } from "@/lib/types";

type PendingPost = {
  name: string;
  roomNo: string;
  mode: PayMode;
  source: string | null;
  amount: number;
};

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
  const [dup, setDup] = useState<GuestEntry | null>(null);
  const pending = useRef<PendingPost | null>(null);
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
    pending.current = null;
    setDup(null);
  }

  function postNew(payload: PendingPost) {
    addGuest(payload);
    toast.success(`Posted ${payload.name} · Room ${payload.roomNo} · ${formatDay(date)}`);
    setName("");
    setSource("");
    pending.current = null;
    setDup(null);
    nameRef.current?.focus();
  }

  function saveEdit(payload: PendingPost) {
    if (!editing) return;
    gate(
      () => {
        updateGuest(editing.id, payload);
        toast.success(`Updated ${payload.name} · Room ${payload.roomNo}`);
        resetAdd();
        onCancelEdit?.();
        nameRef.current?.focus();
      },
      {
        title: "Are you sure?",
        message: `Save changes to ${payload.name} · Room ${payload.roomNo}?`,
        confirmLabel: "Save",
      },
    );
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
    const payload: PendingPost = {
      name: name.trim().toUpperCase(),
      roomNo,
      mode,
      source: source.trim() || null,
      amount: amt,
    };
    const onDate = editing?.date ?? date;
    const hit = findDuplicateOnDate(guests, onDate, payload, editing?.id);
    if (hit) {
      pending.current = payload;
      setDup(hit);
      return;
    }
    if (editing) saveEdit(payload);
    else postNew(payload);
  }

  function addAnyway() {
    const payload = pending.current;
    if (!payload) {
      setDup(null);
      return;
    }
    if (editing) {
      setDup(null);
      saveEdit(payload);
      return;
    }
    postNew(payload);
  }

  const continued =
    dup && dup.checkIn && dup.checkIn !== dup.date ? dup.checkIn : null;

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

    <Dialog
      open={Boolean(dup)}
      onOpenChange={(open) => {
        if (!open) {
          setDup(null);
          pending.current = null;
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate entry</DialogTitle>
          <DialogDescription>
            {continued
              ? `Already continued from ${formatDayShort(continued)} onto ${formatDayShort(dup?.date ?? date)}. Same name, room and mode.`
              : `Already entered on ${formatDayShort(dup?.date ?? date)}. Same name, room and mode.`}
          </DialogDescription>
        </DialogHeader>
        {dup ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-bg-warm/70 px-4 py-3 text-sm">
            <dt className="text-muted">Name</dt>
            <dd className="font-medium">{dup.name}</dd>
            <dt className="text-muted">Room</dt>
            <dd className="tabular">{dup.roomNo}</dd>
            <dt className="text-muted">Mode</dt>
            <dd>
              <ModeBadge mode={dup.mode} />
            </dd>
            <dt className="text-muted">Amount</dt>
            <dd className="tabular font-medium">{money(dup.amount)}</dd>
            <dt className="text-muted">Source</dt>
            <dd>{dup.source || "—"}</dd>
            <dt className="text-muted">Check-in</dt>
            <dd className="tabular">
              {formatDayShort(dup.checkIn || dup.date)}
            </dd>
          </dl>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={addAnyway}
          >
            {isEdit ? "Save anyway" : "Add anyway"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setDup(null);
              pending.current = null;
              nameRef.current?.focus();
            }}
          >
            {isEdit ? "Don't save" : "Don't add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
