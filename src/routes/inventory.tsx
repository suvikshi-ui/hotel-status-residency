import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGate } from "@/components/security-gate";
import { uid } from "@/lib/format";
import {
  inventoryClosing,
  LINEN_CATALOG,
  normalizeInventory,
  type InventoryItem,
} from "@/lib/inventory";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

const CATALOG_IDS = new Set(LINEN_CATALOG.map((r) => r.id));

function InventoryPage() {
  const hotel = useLedger((s) => s.hotel);
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
  const storeTotal = rows.reduce((s, r) => s + inventoryClosing(r), 0);
  const laundryTotal = rows.reduce((s, r) => s + r.laundry, 0);

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
    setDraft((prev) => [
      ...prev,
      {
        id: uid("inv"),
        name,
        opening: 0,
        received: 0,
        issued: 0,
        laundry: 0,
      },
    ]);
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
        toast.success("Inventory saved");
      },
      {
        title: "Are you sure?",
        message: "Save linen counts on the inventory sheet?",
        confirmLabel: "Save",
      },
    );
  }

  function printSheet() {
    const body = `<table>
      <thead><tr>
        <th>Item</th>
        <th class="num">Opening</th>
        <th class="num">Received</th>
        <th class="num">Issued</th>
        <th class="num">Closing</th>
        <th class="num">Laundry</th>
      </tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td class="num">${r.opening}</td>
          <td class="num">${r.received}</td>
          <td class="num">${r.issued}</td>
          <td class="num">${inventoryClosing(r)}</td>
          <td class="num">${r.laundry}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot><tr>
        <td>Total</td>
        <td class="num">${rows.reduce((s, r) => s + r.opening, 0)}</td>
        <td class="num">${rows.reduce((s, r) => s + r.received, 0)}</td>
        <td class="num">${rows.reduce((s, r) => s + r.issued, 0)}</td>
        <td class="num">${storeTotal}</td>
        <td class="num">${laundryTotal}</td>
      </tr></tfoot>
    </table>`;
    toast.message("Opening print…");
    printDocument({
      title: "Linen inventory",
      heading: hotel.name,
      sub: `${hotel.place} · linen sheet`,
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
            Linen sheet — single and double bed sheets, towels, duvets, hand
            towels. Closing is opening + received − issued. Laundry is at the
            dhobi, not taken off the store. More items can be added below.
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

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Store closing</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {storeTotal}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">At laundry</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {laundryTotal}
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Opening</th>
                <th className="px-3 py-2 text-right font-medium">Received</th>
                <th className="px-3 py-2 text-right font-medium">Issued</th>
                <th className="px-3 py-2 text-right font-medium">Closing</th>
                <th className="px-3 py-2 text-right font-medium">Laundry</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 font-medium">{r.name}</td>
                  {(
                    [
                      "opening",
                      "received",
                      "issued",
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
                        aria-label={`${r.name} ${field}`}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular font-medium">
                    {inventoryClosing(r)}
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      className="h-11 min-h-11 text-right tabular"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={r.laundry}
                      onChange={(e) => patch(r.id, "laundry", e.target.value)}
                      aria-label={`${r.name} laundry`}
                    />
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
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5">Total</td>
                <td className="px-3 py-2.5 text-right tabular">
                  {rows.reduce((s, r) => s + r.opening, 0)}
                </td>
                <td className="px-3 py-2.5 text-right tabular">
                  {rows.reduce((s, r) => s + r.received, 0)}
                </td>
                <td className="px-3 py-2.5 text-right tabular">
                  {rows.reduce((s, r) => s + r.issued, 0)}
                </td>
                <td className="px-3 py-2.5 text-right tabular">{storeTotal}</td>
                <td className="px-3 py-2.5 text-right tabular">{laundryTotal}</td>
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
              placeholder="Pillow cover, blanket…"
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
