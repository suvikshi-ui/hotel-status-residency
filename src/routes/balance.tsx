import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeBadge } from "@/components/mode-badge";
import {
  buildDueAccounts,
  dueStatusLabel,
  lookupDueAccount,
  uniqueSources,
  type DueAccount,
  type DueStay,
} from "@/lib/balance";
import { printSourceGuests, printSourceSummary } from "@/lib/balance-print";
import { DUE_PAY_MODES, formatDayShort, MODE_LABEL, money } from "@/lib/format";
import { useLedger, useDayBooks } from "@/lib/store";
import { useGate } from "@/components/security-gate";
import type { PayMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/balance")({ component: BalancePage });

function checkoutLabel(stay: DueStay) {
  if (stay.checkOut) return formatDayShort(stay.checkOut);
  return "In house";
}

function BalancePage() {
  const hotel = useLedger((s) => s.hotel);
  const guests = useLedger((s) => s.guests);
  const receipts = useLedger((s) => s.balReceived);
  const date = useLedger((s) => s.selectedDate);
  const addBalReceived = useLedger((s) => s.addBalReceived);
  const removeBalReceived = useLedger((s) => s.removeBalReceived);
  const { gate } = useGate();
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const accounts = useMemo(
    () => buildDueAccounts(guests, receipts),
    [guests, receipts],
  );
  const books = useDayBooks(date);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (onlyOpen && a.settled) return false;
      if (!t) return true;
      if (a.key.toLowerCase().includes(t)) return true;
      return a.guests.some(
        (g) =>
          g.name.toLowerCase().includes(t) ||
          g.roomNo.toLowerCase().includes(t),
      );
    });
  }, [accounts, onlyOpen, q]);

  const openDue = accounts
    .filter((a) => !a.settled)
    .reduce((s, a) => s + Math.max(0, a.remaining), 0);
  const collected = accounts.reduce((s, a) => s + a.collected, 0);
  const billed = accounts.reduce((s, a) => s + a.billed, 0);
  const searchHit = lookupDueAccount(accounts, q);
  const sourceHints = useMemo(() => uniqueSources(guests), [guests]);
  const listed = useMemo(
    () =>
      searchHit
        ? filtered.filter((a) => a.key !== searchHit.key)
        : filtered,
    [filtered, searchHit],
  );
  const otherRows = receipts
    .filter((r) => r.kind === "other")
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const otherToday = otherRows
    .filter((r) => r.date === date)
    .reduce((s, r) => s + r.amount, 0);
  const otherTotal = otherRows.reduce((s, r) => s + r.amount, 0);

  function collectFrom(account: DueAccount, mode: PayMode, amount: number) {
    gate(
      () => {
        addBalReceived({
          particular: account.key,
          mode,
          amount,
          kind: "due",
        });
        toast.success(`Collected ${money(amount)} from ${account.key}`);
      },
      {
        title: "Are you sure?",
        message: `Collect ${money(amount)} from ${account.key}? Oldest open stays will tick Paid first.`,
        confirmLabel: "Collect",
      },
    );
  }

  function removeReceipt(id: string) {
    gate(
      () => {
        removeBalReceived(id);
        toast.success("Collection removed");
      },
      {
        title: "Are you sure?",
        message: "Delete this collection?",
        confirmLabel: "Delete",
        danger: true,
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Outstanding
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Balance
        </h1>
        <p className="mt-1 text-sm text-muted">
          Guest stays with check-in, days and rate. Print sources for Flysky /
          Motor totals, or print guests under one source. Collections tick the
          oldest stay Paid.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Books C/B</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular text-due">
            {money(books?.outstanding.cb ?? 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Open source dues</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(openDue)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Billed</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(billed)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Collected</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular text-ok">
            {money(collected)}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="balance">
        <TabsList className="grid w-full grid-cols-2" aria-label="Balance sections">
          <TabsTrigger value="balance" className="w-full">
            Balance
          </TabsTrigger>
          <TabsTrigger value="other" className="w-full">
            Other
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                className="pl-9"
                placeholder="Source or guest — Flysky, Motor, name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search dues"
                list="balance-source-hints"
                autoComplete="off"
              />
              <datalist id="balance-source-hints">
                {sourceHints.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={onlyOpen ? "default" : "outline"}
                onClick={() => setOnlyOpen((v) => !v)}
              >
                {onlyOpen ? "Open dues" : "All sources"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (filtered.length === 0) {
                    toast.error("No sources to print");
                    return;
                  }
                  toast.message("Opening source print…");
                  printSourceSummary(filtered, hotel.name, hotel.place);
                }}
              >
                <Printer className="size-4" />
                Print sources
              </Button>
            </div>
            <p className="text-xs text-muted">
              <span className="font-medium text-fg">Print sources</span> — Flysky,
              Motor, remaining only, no guest names.{" "}
              <span className="font-medium text-fg">Print guests</span> on a
              source — that company, then each guest stay.
            </p>
          </div>

          {searchHit ? (
            <p className="text-sm text-muted">
              <span className="font-medium text-fg">{searchHit.key}</span>
              {" · "}
              {searchHit.guestCount} guest
              {searchHit.guestCount === 1 ? "" : "s"}
              {" · "}
              {searchHit.stays.length} stay
              {searchHit.stays.length === 1 ? "" : "s"}
              {" · billed "}
              {money(searchHit.billed)}
              {" · due "}
              {money(Math.max(0, searchHit.remaining))}
            </p>
          ) : null}

          {searchHit ? (
            <SourceCard
              account={searchHit}
              open
              pinned
              month={date.slice(0, 7)}
              onToggle={() => setQ("")}
              onCollect={(mode, amount) => collectFrom(searchHit, mode, amount)}
              onRemoveReceipt={removeReceipt}
              onPrintGuests={() => {
                toast.message("Opening guest print…");
                printSourceGuests(searchHit, hotel.name, hotel.place);
              }}
            />
          ) : null}

          <div className="flex flex-col gap-2">
            {listed.map((account) => (
              <SourceCard
                key={account.key}
                account={account}
                open={openKey === account.key}
                month={date.slice(0, 7)}
                onToggle={() =>
                  setOpenKey((k) => (k === account.key ? null : account.key))
                }
                onCollect={(mode, amount) => collectFrom(account, mode, amount)}
                onRemoveReceipt={removeReceipt}
                onPrintGuests={() => {
                  toast.message("Opening guest print…");
                  printSourceGuests(account, hotel.name, hotel.place);
                }}
              />
            ))}
            {listed.length === 0 && !searchHit ? (
              <Card className="p-8 text-center text-sm text-muted">
                No source dues match this filter.
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="other" className="flex flex-col gap-5">
          <OtherTab
            booksCb={books?.outstanding.cb ?? 0}
            today={otherToday}
            total={otherTotal}
            rows={otherRows}
            onAdd={(mode, amount, particular) => {
              gate(
                () => {
                  addBalReceived({
                    particular,
                    mode,
                    amount,
                    kind: "other",
                  });
                  toast.success(
                    `Other ${money(amount)} cut from main balance`,
                  );
                },
                {
                  title: "Are you sure?",
                  message: `Cut ${money(amount)} from main balance?`,
                  confirmLabel: "Save",
                },
              );
            }}
            onRemove={(id) => {
              gate(
                () => {
                  removeBalReceived(id);
                  toast.success("Other collection removed");
                },
                {
                  title: "Are you sure?",
                  message: "Delete this other collection?",
                  confirmLabel: "Delete",
                  danger: true,
                },
              );
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OtherTab({
  booksCb,
  today,
  total,
  rows,
  onAdd,
  onRemove,
}: {
  booksCb: number;
  today: number;
  total: number;
  rows: { id: string; date: string; particular: string; mode: PayMode; amount: number }[];
  onAdd: (mode: PayMode, amount: number, particular: string) => void;
  onRemove: (id: string) => void;
}) {
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Main balance</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular text-due">
            {money(booksCb)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Other today</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(today)}
          </div>
        </Card>
        <Card className="col-span-2 p-4 lg:col-span-1">
          <div className="text-xs font-medium text-muted">Other posted</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(total)}
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              Cut from main balance
            </p>
            <p className="mt-1 text-sm text-muted">
              Amount only — no source name. Lands in cash / Santosh QR / P.K. QR
              and reduces the books outstanding.
            </p>
          </div>
          <form
            className="grid gap-3 sm:grid-cols-[9rem_1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(amount);
              if (!Number.isFinite(amt) || amt <= 0) {
                toast.error("Enter an amount");
                return;
              }
              onAdd(mode, amt, note.trim() || "Other");
              setAmount("");
              setNote("");
            }}
          >
            <div className="grid gap-1.5">
              <Label>Paid by</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PayMode)}>
                <SelectTrigger aria-label="Other payment mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUE_PAY_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Cut balance
              </Button>
            </div>
            <div className="grid gap-1.5 sm:col-span-3">
              <Label htmlFor="other-note">Note (optional)</Label>
              <Input
                id="other-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Not a source name"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Note</th>
                <th className="px-3 py-2 font-medium">Paid by</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular text-muted">
                    {formatDayShort(r.date)}
                  </td>
                  <td className="px-3 py-2.5">{r.particular}</td>
                  <td className="px-3 py-2.5">
                    <ModeBadge mode={r.mode} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(r.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 min-h-9 text-muted hover:text-danger"
                      aria-label="Remove other collection"
                      onClick={() => onRemove(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No other cuts yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function SourceCard({
  account,
  open,
  pinned,
  month,
  onToggle,
  onCollect,
  onRemoveReceipt,
  onPrintGuests,
}: {
  account: DueAccount;
  open: boolean;
  pinned?: boolean;
  month: string;
  onToggle: () => void;
  onCollect: (mode: PayMode, amount: number) => void;
  onRemoveReceipt: (id: string) => void;
  onPrintGuests: () => void;
}) {
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState("");
  const shown = open || pinned;
  const carried =
    !account.settled && Boolean(account.lastDate) && account.lastDate.slice(0, 7) < month;

  return (
    <Card className={cn("overflow-hidden", pinned && "ring-1 ring-primary/30")}>
      <div className="flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={shown}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-150",
              shown ? "rotate-0" : "-rotate-90",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-semibold tracking-tight">
              {account.key}
            </div>
            <div className="text-xs text-muted">
              {account.guestCount} guest{account.guestCount === 1 ? "" : "s"} ·{" "}
              {account.stays.length} stay{account.stays.length === 1 ? "" : "s"} ·{" "}
              {account.nights} night{account.nights === 1 ? "" : "s"}
              {account.firstDate
                ? ` · ${formatDayShort(account.firstDate)}–${formatDayShort(account.lastDate)}`
                : ""}
            </div>
          </div>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onPrintGuests}
        >
          <Printer className="size-4" />
          Print guests
        </Button>
        <div className="text-right">
          <div
            className={cn(
              "font-display text-xl font-semibold tabular",
              account.settled ? "text-ok" : "text-due",
            )}
          >
            {money(Math.max(0, account.remaining))}
          </div>
          <Badge variant={account.settled ? "ok" : "warn"}>
            {account.settled ? "Settled" : carried ? "Carried" : "Open"}
          </Badge>
        </div>
      </div>

      {shown ? (
        <CardContent className="border-t border-border pt-4">
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2 font-medium"> </th>
                  <th className="px-3 py-2 font-medium">Guest</th>
                  <th className="px-3 py-2 font-medium">Check-in</th>
                  <th className="px-3 py-2 font-medium">Check-out</th>
                  <th className="px-3 py-2 text-right font-medium">Days</th>
                  <th className="px-3 py-2 text-right font-medium">Per day</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {account.stays.map((stay) => (
                  <tr
                    key={stay.id}
                    className={cn(
                      "border-b border-border/70",
                      stay.status === "paid" && "bg-ok/5",
                    )}
                  >
                    <td className="px-5 py-2.5">
                      <PaidTick stay={stay} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{stay.name}</div>
                      <div className="text-xs text-muted">Room {stay.roomNo}</div>
                    </td>
                    <td className="px-3 py-2.5 tabular">
                      {formatDayShort(stay.checkIn)}
                    </td>
                    <td className="px-3 py-2.5 tabular text-muted">
                      {checkoutLabel(stay)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{stay.days}</td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(stay.perDay)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular font-medium">
                      {money(stay.billed)}
                    </td>
                    <td className="px-5 py-2.5">
                      <StayStatus stay={stay} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {account.stays.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">
                No guest stays on this source.
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-muted">
              {account.guestCount} guests · billed {money(account.billed)} · paid{" "}
              {money(account.collected)}
            </span>
            <span className="font-semibold tabular">
              Due {money(Math.max(0, account.remaining))}
            </span>
          </div>

          {account.receipts.length > 0 ? (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {account.receipts.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      {formatDayShort(r.date)} · {r.particular}
                    </div>
                    <ModeBadge mode={r.mode} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="tabular text-sm font-medium text-ok">
                      {money(r.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 min-h-9 text-muted hover:text-danger"
                      aria-label="Remove collection"
                      onClick={() => onRemoveReceipt(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!account.settled ? (
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(amount || Math.max(0, account.remaining));
                if (!Number.isFinite(amt) || amt <= 0) {
                  toast.error("Enter an amount to collect");
                  return;
                }
                onCollect(mode, amt);
                setAmount("");
              }}
            >
              <div className="grid gap-1.5">
                <Label>Mode</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as PayMode)}
                >
                  <SelectTrigger aria-label="Collection mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DUE_PAY_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODE_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(Math.max(0, account.remaining))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Collect
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-ok">
              This source is settled. Every stay is ticked Paid.
            </p>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}

function PaidTick({ stay }: { stay: DueStay }) {
  const on = stay.status === "paid";
  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-md border",
        on
          ? "border-ok/40 bg-ok text-primary-fg"
          : stay.status === "partial"
            ? "border-due/40 bg-due/10 text-due"
            : "border-border bg-card text-transparent",
      )}
      aria-label={dueStatusLabel(stay.status)}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  );
}

function StayStatus({ stay }: { stay: DueStay }) {
  if (stay.status === "paid") {
    return <Badge variant="ok">Paid</Badge>;
  }
  if (stay.status === "partial") {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="warn">Partial</Badge>
        <span className="text-xs tabular text-muted">
          Due {money(stay.remaining)}
        </span>
      </div>
    );
  }
  return <Badge variant="warn">Open</Badge>;
}
