import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGate } from "@/components/security-gate";
import { uid } from "@/lib/format";
import {
  emptyInventoryItem,
  inventoryCheck,
  inventoryCheckLabel,
  inventoryDifference,
  LINEN_CATALOG,
  normalizeInventory,
  signedCount,
  type InventoryItem,
} from "@/lib/inventory";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { useLedger } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

const CATALOG_IDS = new Set(LINEN_CATALOG.map((r) => r.id));

function monthLabel(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "MMMM yyyy");
}

function InventoryPage() {
  const hotel = useLedger((s) => s.hotel);
  const date = useLedger((s) => s.selectedDate);
  const inventory = useLedger((s) => s.inventory);
  const setInventory = useLedger((s) => s.setInventory);
  const { gate } = useGate();
  const [draft, setDraft] = useState<InventoryItem[]>(inventory);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setDraft(inventory);
  }, [inventory]);

  const rows = useMemo(() => normalizeInventory(draft), [draft]);
  const dirty = JSON.stringify(rows) !== JSON.stringify(inventory);
  const lastTotal = rows.reduce((s, r) => s + r.lastMonth, 0);
  const thisTotal = rows.reduce((s, r) => s + r.thisMonth, 0);
  const expectedTotal = rows.reduce((s, r) => s + r.expected, 0);
  const diffTotal = thisTotal - lastTotal;
  const mismatch = rows.filter((r) => inventoryCheck(r).kind !== "even");

  function patch(id: string, field: keyof InventoryItem, value: string) {
    setDraft((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "name") return { ...r, name: value };
        const n = Number(value);
        return { ...r, [field]: Number.isFinite(n) && n >= 0 ? Math.round(n) : 0 };
      }),
    );
  }

  function addItem() {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter an item name");
      return;
    }
    if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error("That item is already on the sheet");
      return;
    }
    setDraft((prev) => [...prev, emptyInventoryItem(uid("inv"), name)]);
    setNewName("");
  }

  function removeItem(id: string) {
    if (CATALOG_IDS.has(id)) return;
    setDraft((prev) => prev.filter((r) => r.id !== id));
  }

  function save() {
    gate(
      () => {
        setInventory(rows);
        toast.success("Monthly inventory saved");
      },
      {
        title: "Are you sure?",
        message: "Save this month's inventory check?",
        confirmLabel: "Save",
      },
    );
  }

  function printSheet() {
    const body = `<table>
      <thead><tr>
        <th>Item</th>
        <th class="num">Last month</th>
        <th class="num">This month</th>
        <th class="num">Difference</th>
        <th class="num">Expected</th>
        <th>Check</th>
      </tr></thead>
      <tbody>
        ${rows
          .map((r) => {
            const check = inventoryCheck(r);
            return `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td class="num">${r.lastMonth}</td>
          <td class="num">${r.thisMonth}</td>
          <td class="num">${signedCount(inventoryDifference(r))}</td>
          <td class="num">${r.expected}</td>
          <td>${escapeHtml(inventoryCheckLabel(check))}</td>
        </tr>`;
          })
          .join("")}
      </tbody>
      <tfoot><tr>
        <td>Total</td>
        <td class="num">${lastTotal}</td>
        <td class="num">${thisTotal}</td>
        <td class="num">${signedCount(diffTotal)}</td>
        <td class="num">${expectedTotal}</td>
        <td>${mismatch.length ? `${mismatch.length} not even` : "बराबर है"}</td>
      </tr></tfoot>
    </table>`;
    toast.message("Opening print…");
    printDocument({
      title: "Monthly inventory",
      heading: hotel.name,
      sub: `${hotel.place} · monthly check · ${monthLabel(date)}`,
      table: body,
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
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted">
            Monthly check — last month vs this month, then expected. If the
            count is not even: take out the extra, or replace the short. Not a
            laundry sheet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={printSheet}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button onClick={save} disabled={!dirty}>
            Save sheet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Last month</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {lastTotal}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">This month</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {thisTotal}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Difference</div>
          <div
            className={cn(
              "mt-1 font-display text-2xl font-semibold tabular",
              diffTotal < 0 && "text-danger",
            )}
          >
            {signedCount(diffTotal)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Not even</div>
          <div
            className={cn(
              "mt-1 font-display text-2xl font-semibold tabular",
              mismatch.length > 0 && "text-danger",
            )}
          >
            {mismatch.length}
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Last month</th>
                <th className="px-3 py-2 text-right font-medium">This month</th>
                <th className="px-3 py-2 text-right font-medium">Difference</th>
                <th className="px-3 py-2 text-right font-medium">Expected</th>
                <th className="px-3 py-2 font-medium">Check</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff = inventoryDifference(r);
                const check = inventoryCheck(r);
                return (
                  <tr key={r.id} className="border-b border-border/70">
                    <td className="px-5 py-2.5 font-medium">{r.name}</td>
                    {(
                      [
                        "lastMonth",
                        "thisMonth",
                      ] as const
                    ).map((field) => (
                      <td key={field} className="px-3 py-1.5">
                        <Input
                          className="h-11 min-h-11 text-right tabular"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={r[field]}
                          onChange={(e) => patch(r.id, field, e.target.value)}
                          aria-label={`${r.name} ${field === "lastMonth" ? "last month" : "this month"}`}
                        />
                      </td>
                    ))}
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right tabular font-medium",
                        diff < 0 && "text-danger",
                      )}
                    >
                      {signedCount(diff)}
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        className="h-11 min-h-11 text-right tabular"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={r.expected}
                        onChange={(e) => patch(r.id, "expected", e.target.value)}
                        aria-label={`${r.name} expected`}
                      />
                    </td>
                    <td
                      className={cn(
                        "max-w-[14rem] px-3 py-2.5 text-sm leading-snug",
                        check.kind === "even" ? "text-muted" : "font-medium text-danger",
                      )}
                    >
                      {inventoryCheckLabel(check)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {CATALOG_IDS.has(r.id) ? null : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 min-h-9 text-muted hover:text-danger"
                          aria-label={`Remove ${r.name}`}
                          onClick={() => removeItem(r.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5">Total</td>
                <td className="px-3 py-2.5 text-right tabular">{lastTotal}</td>
                <td className="px-3 py-2.5 text-right tabular">{thisTotal}</td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-right tabular",
                    diffTotal < 0 && "text-danger",
                  )}
                >
                  {signedCount(diffTotal)}
                </td>
                <td className="px-3 py-2.5 text-right tabular">{expectedTotal}</td>
                <td
                  className={cn(
                    "px-3 py-2.5",
                    mismatch.length > 0 ? "text-danger" : "text-muted",
                  )}
                >
                  {mismatch.length
                    ? `${mismatch.length} not even`
                    : "बराबर है"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Label htmlFor="inv-new">Add another item</Label>
            <Input
              id="inv-new"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Blanket, curtain…"
              autoComplete="off"
            />
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            Add to sheet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
