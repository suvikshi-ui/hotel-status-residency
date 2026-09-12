import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ModeBadge } from "@/components/mode-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uniqueSources, buildDueAccounts, lookupDueAccount } from "@/lib/balance";
import { useGate } from "@/components/security-gate";
import {
  DUE_PAY_MODES,
  MODE_LABEL,
  OTA_CHANNELS,
  PAY_MODES,
  money,
} from "@/lib/format";
import { useLedger } from "@/lib/store";
import { isDayLocked } from "@/lib/register-lock";
import { isSealed, sealKey } from "@/lib/sheet-seal";
import { cn } from "@/lib/utils";
import type { ModeAmount, NamedAmount, PayMode } from "@/lib/types";

function ModeLineCard({
  title,
  rows,
  empty,
  onAdd,
  onRemove,
  frozenIds,
}: {
  title: string;
  rows: ModeAmount[];
  empty: string;
  onAdd: (mode: PayMode, amount: number) => void;
  onRemove: (id: string) => void;
  frozenIds?: Record<string, true>;
}) {
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState("");
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted">{money(total)} today</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const amt = Number(amount);
            if (!Number.isFinite(amt) || amt <= 0) {
              toast.error(`Enter a ${title} amount`);
              return;
            }
            onAdd(mode, amt);
            toast.success(`${title} posted`);
            setAmount("");
          }}
        >
          <div className="grid gap-1.5">
            <Label>Paid by</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PayMode)}>
              <SelectTrigger aria-label={`${title} payment mode`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_MODES.map((m) => (
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
              Add
            </Button>
          </div>
        </form>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <ModeBadge mode={r.mode} />
              <div className="flex items-center gap-1">
                <span className="tabular text-sm font-medium">{money(r.amount)}</span>
                {frozenIds?.[r.id] ? null : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 min-h-9 text-muted hover:text-danger"
                  aria-label={`Remove ${title} entry`}
                  onClick={() => onRemove(r.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">{empty}</li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}

function ExpenseLineCard({
  rows,
  heads,
  onAdd,
  onRemove,
  frozenIds,
}: {
  rows: NamedAmount[];
  heads: string[];
  onAdd: (particular: string, mode: PayMode, amount: number) => void;
  onRemove: (id: string) => void;
  frozenIds?: Record<string, true>;
}) {
  const [particular, setParticular] = useState("");
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState("");
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
        <p className="text-sm text-muted">{money(total)} today</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const amt = Number(amount);
            if (!particular.trim()) {
              toast.error("Enter what the expense is for");
              return;
            }
            if (!Number.isFinite(amt) || amt <= 0) {
              toast.error("Enter an expense amount");
              return;
            }
            onAdd(particular.trim().toUpperCase(), mode, amt);
            toast.success("Expense posted");
            setParticular("");
            setAmount("");
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="reg-exp">Particular</Label>
            <Input
              id="reg-exp"
              value={particular}
              onChange={(e) => setParticular(e.target.value)}
              placeholder="RATION, FLYSKY, WS…"
              list="reg-exp-heads"
              autoComplete="off"
            />
            <datalist id="reg-exp-heads">
              {heads.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-1.5">
            <Label>Paid by</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PayMode)}>
              <SelectTrigger aria-label="Expense payment mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_MODES.map((m) => (
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
              Add
            </Button>
          </div>
        </form>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.particular}</div>
                <ModeBadge mode={r.mode} />
              </div>
              <div className="flex items-center gap-1">
                <span className="tabular text-sm font-medium">{money(r.amount)}</span>
                {frozenIds?.[r.id] ? null : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 min-h-9 text-muted hover:text-danger"
                  aria-label="Remove expense"
                  onClick={() => onRemove(r.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">
              No expenses posted today.
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}

function ReceiptList({
  rows,
  onRemove,
  frozenIds,
}: {
  rows: NamedAmount[];
  onRemove: (id: string) => void;
  frozenIds?: Record<string, true>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No collections today.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{r.particular}</div>
            <div className="text-xs text-muted">
              {r.kind === "ota" ? "Online · to P.K. QR" : MODE_LABEL[r.mode]}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="tabular text-sm font-medium">{money(r.amount)}</span>
            {frozenIds?.[r.id] ? null : (
            <Button
              variant="ghost"
              size="icon"
              className="size-9 min-h-9 text-muted hover:text-danger"
              aria-label="Remove collection"
              onClick={() => onRemove(r.id)}
            >
              <Trash2 className="size-4" />
            </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RegisterLines() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const allFood = useLedger((s) => s.food);
  const allWs = useLedger((s) => s.wholesale);
  const allBal = useLedger((s) => s.balReceived);
  const allExp = useLedger((s) => s.expenses);
  const food = allFood.filter((r) => r.date === date);
  const ws = allWs.filter((r) => r.date === date);
  const receipts = allBal.filter((r) => r.date === date);
  const expenses = allExp.filter((r) => r.date === date);
  const addFood = useLedger((s) => s.addFood);
  const removeFood = useLedger((s) => s.removeFood);
  const addWs = useLedger((s) => s.addWholesale);
  const removeWs = useLedger((s) => s.removeWholesale);
  const addBal = useLedger((s) => s.addBalReceived);
  const removeBal = useLedger((s) => s.removeBalReceived);
  const addExpense = useLedger((s) => s.addExpense);
  const removeExpense = useLedger((s) => s.removeExpense);
  const locked = isDayLocked(useLedger((s) => s.lockedDates), date);
  const sealedIds = useLedger((s) => s.sealedIds);
  const foodFrozen: Record<string, true> = {};
  for (const r of food) if (isSealed(sealedIds, sealKey.food(r.id))) foodFrozen[r.id] = true;
  const wsFrozen: Record<string, true> = {};
  for (const r of ws) if (isSealed(sealedIds, sealKey.wholesale(r.id))) wsFrozen[r.id] = true;
  const expFrozen: Record<string, true> = {};
  for (const r of expenses) if (isSealed(sealedIds, sealKey.expense(r.id))) expFrozen[r.id] = true;
  const balFrozen: Record<string, true> = {};
  for (const r of receipts) if (isSealed(sealedIds, sealKey.balance(r.id))) balFrozen[r.id] = true;
  const { gate } = useGate();
  const sources = useMemo(() => uniqueSources(guests), [guests]);
  const accounts = useMemo(
    () => buildDueAccounts(guests, allBal),
    [guests, allBal],
  );

  const [source, setSource] = useState("");
  const [dueMode, setDueMode] = useState<PayMode>("CASH");
  const [dueAmt, setDueAmt] = useState("");
  const [ota, setOta] = useState<(typeof OTA_CHANNELS)[number]>("Fab");
  const [otaAmt, setOtaAmt] = useState("");
  const dueAccount = lookupDueAccount(accounts, source);
  const dueLeft = dueAccount ? Math.max(0, dueAccount.remaining) : 0;

  const dueRows = receipts.filter((r) => r.kind !== "ota" && r.kind !== "other");
  const otaRows = receipts.filter((r) => r.kind === "ota");
  const heads = useMemo(
    () => [...new Set(allExp.map((e) => e.particular))].sort(),
    [allExp],
  );

  return (
    <fieldset
      disabled={locked}
      className={cn("flex min-w-0 flex-col gap-5 border-0 p-0", locked && "opacity-80")}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <ModeLineCard
          title="Food"
          rows={food}
          empty="No food posted today."
          frozenIds={foodFrozen}
          onAdd={(mode, amount) => addFood({ mode, amount })}
          onRemove={(id) =>
            gate(() => removeFood(id), {
              title: "Are you sure?",
              message: "Delete this food entry?",
              confirmLabel: "Delete",
              danger: true,
            })
          }
        />
        <ModeLineCard
          title="WS"
          rows={ws}
          empty="No WS posted today."
          frozenIds={wsFrozen}
          onAdd={(mode, amount) => addWs({ mode, amount })}
          onRemove={(id) =>
            gate(() => removeWs(id), {
              title: "Are you sure?",
              message: "Delete this WS entry?",
              confirmLabel: "Delete",
              danger: true,
            })
          }
        />
      </div>

      <ExpenseLineCard
        rows={expenses}
        heads={heads}
        frozenIds={expFrozen}
        onAdd={(particular, mode, amount) =>
          addExpense({ particular, mode, amount })
        }
        onRemove={(id) =>
          gate(() => removeExpense(id), {
            title: "Are you sure?",
            message: "Delete this expense?",
            confirmLabel: "Delete",
            danger: true,
          })
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Balance received</CardTitle>
          <p className="text-sm text-muted">
            Source collections cut guest dues. Fab / Bravistay cut online and land
            in P.K. QR.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const t = source.trim();
              if (!t) {
                toast.error("Enter the source or company name");
                return;
              }
              const n = Number(dueAmt || dueLeft);
              if (!Number.isFinite(n) || n <= 0) {
                toast.error("Enter an amount");
                return;
              }
              gate(
                () => {
                  addBal({
                    particular: t,
                    mode: dueMode,
                    amount: n,
                    kind: "due",
                  });
                  toast.success(`Collected ${money(n)} from ${t}`);
                  setDueAmt("");
                },
                {
                  title: "Are you sure?",
                  message: `Collect ${money(n)} from ${t}?`,
                  confirmLabel: "Collect",
                },
              );
            }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              From source
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="bal-src">Source</Label>
              <Input
                id="bal-src"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Company / person"
                list="bal-source-hints"
                autoComplete="off"
              />
              <datalist id="bal-source-hints">
                {sources.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            {source.trim() ? (
              <div className="rounded-lg bg-bg-warm px-3 py-3">
                {dueAccount ? (
                  <>
                    <p className="text-xs text-muted">
                      {dueAccount.key} · {dueAccount.nights} night
                      {dueAccount.nights === 1 ? "" : "s"}
                    </p>
                    <p
                      className={`mt-1 font-display text-2xl font-semibold tabular ${dueLeft > 0 ? "text-due" : "text-ok"}`}
                    >
                      {money(dueLeft)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {dueLeft > 0
                        ? `Open dues · billed ${money(dueAccount.billed)}`
                        : "Settled — no open dues"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">No dues found for this source.</p>
                )}
              </div>
            ) : null}
            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <div className="grid gap-1.5">
                <Label>Paid by</Label>
                <Select
                  value={dueMode}
                  onValueChange={(v) => setDueMode(v as PayMode)}
                >
                  <SelectTrigger aria-label="Source collection mode">
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
                  value={dueAmt}
                  onChange={(e) => setDueAmt(e.target.value)}
                  placeholder={dueLeft ? String(dueLeft) : "0"}
                />
              </div>
            </div>
            <Button type="submit">Collect from source</Button>
            <ReceiptList
              rows={dueRows}
              frozenIds={balFrozen}
              onRemove={(id) =>
                gate(() => removeBal(id), {
                  title: "Are you sure?",
                  message: "Delete this balance received?",
                  confirmLabel: "Delete",
                  danger: true,
                })
              }
            />
          </form>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(otaAmt);
              if (!Number.isFinite(n) || n <= 0) {
                toast.error("Enter an amount");
                return;
              }
              gate(
                () => {
                  addBal({
                    particular: ota,
                    mode: "QRPK",
                    amount: n,
                    kind: "ota",
                  });
                  toast.success(`${ota} ${money(n)} → P.K. QR`);
                  setOtaAmt("");
                },
                {
                  title: "Are you sure?",
                  message: `Post ${ota} ${money(n)} to P.K. QR?`,
                  confirmLabel: "Save",
                },
              );
            }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Fab / Bravistay
            </p>
            <div className="grid gap-1.5">
              <Label>Channel</Label>
              <Select
                value={ota}
                onValueChange={(v) => setOta(v as (typeof OTA_CHANNELS)[number])}
              >
                <SelectTrigger aria-label="Online channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OTA_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
                value={otaAmt}
                onChange={(e) => setOtaAmt(e.target.value)}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted">
              Cuts online outstanding. Deposits into Praween QR.
            </p>
            <Button type="submit">Collect online</Button>
            <ReceiptList
              rows={otaRows}
              frozenIds={balFrozen}
              onRemove={(id) =>
                gate(() => removeBal(id), {
                  title: "Are you sure?",
                  message: "Delete this balance received?",
                  confirmLabel: "Delete",
                  danger: true,
                })
              }
            />
          </form>
        </CardContent>
      </Card>
    </fieldset>
  );
}
