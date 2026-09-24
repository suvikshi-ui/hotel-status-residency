import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGate } from "@/components/security-gate";
import { uid } from "@/lib/format";
import {
  carryForward,
  emptyInventoryItem,
  filesForBook,
  inventoryDifference,
  inventoryFileId,
  inventoryPeriod,
  LINEN_CATALOG,
  seedBook,
  signedCount,
  type InventoryBook,
  type InventoryFile,
  type InventoryItem,
} from "@/lib/inventory";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { useLedger } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

const CATALOG_IDS = new Set([
  ...LINEN_CATALOG.map((row) => row.id),
  ...seedBook("kitchen").map((row) => row.id),
  ...seedBook("ws").map((row) => row.id),
]);

const BOOKS: { id: InventoryBook; label: string }[] = [
  { id: "linen", label: "Linen" },
  { id: "ws", label: "WS" },
  { id: "kitchen", label: "Kitchen" },
];

function periodLabel(kind: InventoryBook, period: string) {
  const iso = kind === "ws" ? period : `${period}-01`;
  const d = parseISO(iso);
  if (!isValid(d)) return period;
  return kind === "ws" ? format(d, "d MMM yyyy") : format(d, "MMMM yyyy");
}

function InventoryPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Housekeeping
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-muted">
          Linen and kitchen files are monthly. WS is one file per day. Save
          locks the file. Delete it if you need to enter again.
        </p>
      </div>
      <Tabs defaultValue="linen">
        <TabsList className="grid w-full grid-cols-3" aria-label="Inventory books">
          {BOOKS.map((book) => (
            <TabsTrigger key={book.id} value={book.id} className="w-full">
              {book.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {BOOKS.map((book) => (
          <TabsContent key={book.id} value={book.id}>
            <InventoryBookPanel kind={book.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InventoryBookPanel({ kind }: { kind: InventoryBook }) {
  const hotel = useLedger((s) => s.hotel);
  const date = useLedger((s) => s.selectedDate);
  const files = useLedger((s) => s.inventoryFiles);
  const saveInventoryFile = useLedger((s) => s.saveInventoryFile);
  const deleteInventoryFile = useLedger((s) => s.deleteInventoryFile);
  const role = useLedger((s) => s.appRole);
  const canDelete = role !== "housekeeping";
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const period = inventoryPeriod(kind, date);
  const bookFiles = useMemo(
    () => filesForBook(files, kind),
    [files, kind],
  );
  const saved = bookFiles.find((file) => file.period === period) ?? null;
  const [openId, setOpenId] = useState<string>("draft");
  const [draft, setDraft] = useState<InventoryItem[]>(() => seedBook(kind));
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const current = filesForBook(files, kind).find((file) => file.period === period);
    setOpenId(current?.id ?? "draft");
    if (!current) {
      const previous = filesForBook(files, kind).find((file) => file.period < period);
      setDraft(carryForward(previous?.lines, seedBook(kind)));
    }
  }, [files, kind, period]);

  const openFile =
    openId === "draft" ? null : (bookFiles.find((file) => file.id === openId) ?? null);
  const locked = Boolean(openFile);
  const rows = openFile?.lines ?? draft;
  const lastLabel = kind === "ws" ? "Last count" : "Last month";
  const nowLabel = kind === "ws" ? "Today" : "This month";
  const lastTotal = rows.reduce((sum, row) => sum + row.lastMonth, 0);
  const thisTotal = rows.reduce((sum, row) => sum + row.thisMonth, 0);
  const diffTotal = thisTotal - lastTotal;

  function patch(id: string, field: keyof InventoryItem, value: string) {
    if (locked) return;
    setDraft((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "name" || field === "notes") return { ...row, [field]: value };
        const digits = value.replace(/\D/g, "");
        return { ...row, [field]: digits ? Math.round(Number(digits)) : 0 };
      }),
    );
  }

  function addItem() {
    const name = newName.trim();
    if (!name || locked) return;
    if (rows.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      toast.error("That item is already on the sheet");
      return;
    }
    setDraft((prev) => [...prev, emptyInventoryItem(uid("inv"), name)]);
    setNewName("");
  }

  function removeItem(id: string) {
    if (locked || CATALOG_IDS.has(id)) return;
    setDraft((prev) => prev.filter((row) => row.id !== id));
  }

  function saveFile() {
    if (saved) {
      toast.message("This file is already saved");
      return;
    }
    const file: InventoryFile = {
      id: inventoryFileId(kind, period),
      kind,
      period,
      createdAt: date.slice(0, 10),
      lines: rows,
    };
    saveInventoryFile(file);
    setOpenId(file.id);
    toast.success(`${periodLabel(kind, period)} file saved`);
    void saveToServer();
  }

  function removeFile(file: InventoryFile) {
    gate(
      () => {
        deleteInventoryFile(file.id);
        toast.success(`${periodLabel(kind, file.period)} file deleted`);
        void saveToServer();
      },
      {
        title: `Delete ${periodLabel(kind, file.period)}?`,
        message: "The file will be removed. You can enter it again after delete.",
        confirmLabel: "Delete",
        danger: true,
        requireCode: true,
      },
    );
  }

  function printSheet() {
    const body = `<table>
      <thead><tr>
        <th>Item</th>
        <th class="num">${escapeHtml(lastLabel)}</th>
        <th class="num">${escapeHtml(nowLabel)}</th>
        <th class="num">Difference</th>
        <th>Notes</th>
      </tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="num">${row.lastMonth}</td>
          <td class="num">${row.thisMonth}</td>
          <td class="num">${signedCount(inventoryDifference(row))}</td>
          <td>${escapeHtml(row.notes)}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
    toast.message("Opening print…");
    printDocument({
      title: `${kind} inventory`,
      heading: hotel.name,
      sub: `${hotel.place} · ${periodLabel(kind, openFile?.period ?? period)}`,
      table: body,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">
          {locked
            ? `${periodLabel(kind, openFile?.period ?? period)} file is locked.`
            : `${periodLabel(kind, period)} is not saved yet.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {!saved && openId === "draft" ? (
            <SaveCube busy={saving} onSave={saveFile} />
          ) : null}
          <Button type="button" variant="outline" onClick={printSheet}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!saved ? (
          <Button
            type="button"
            size="sm"
            variant={openId === "draft" ? "default" : "outline"}
            onClick={() => setOpenId("draft")}
          >
            {periodLabel(kind, period)} · new
          </Button>
        ) : null}
        {bookFiles.map((file) => (
          <Button
            key={file.id}
            type="button"
            size="sm"
            variant={openId === file.id ? "default" : "outline"}
            onClick={() => setOpenId(file.id)}
          >
            {periodLabel(kind, file.period)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">{lastLabel}</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">{lastTotal}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">{nowLabel}</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">{thisTotal}</div>
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
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">{lastLabel}</th>
                <th className="px-3 py-2 text-right font-medium">{nowLabel}</th>
                <th className="px-3 py-2 text-right font-medium">Difference</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const diff = inventoryDifference(row);
                return (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-5 py-2.5 font-medium">{row.name}</td>
                    {(["lastMonth", "thisMonth"] as const).map((field) => (
                      <td key={field} className="px-3 py-1.5">
                        <Input
                          className="h-11 min-h-11 text-right tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          type="text"
                          inputMode="numeric"
                          value={row[field]}
                          disabled={locked}
                          onChange={(e) => patch(row.id, field, e.target.value)}
                          aria-label={`${row.name} ${field}`}
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
                    <td className="min-w-[14rem] px-3 py-1.5">
                      <Input
                        className="h-11 min-h-11"
                        value={row.notes}
                        disabled={locked}
                        onChange={(e) => patch(row.id, "notes", e.target.value)}
                        placeholder="Remark…"
                        aria-label={`${row.name} notes`}
                        autoComplete="off"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {!locked && canDelete && !CATALOG_IDS.has(row.id) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 min-h-9 text-muted hover:text-danger"
                          aria-label={`Remove ${row.name}`}
                          onClick={() => removeItem(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {!locked ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Label htmlFor={`inv-new-${kind}`}>Add item</Label>
              <Input
                id={`inv-new-${kind}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Extra item"
                autoComplete="off"
              />
            </div>
            <Button type="button" variant="outline" onClick={addItem}>
              Add
            </Button>
          </CardContent>
        </Card>
      ) : openFile && canDelete ? (
        <div className="flex justify-end">
          <Button type="button" variant="danger" onClick={() => removeFile(openFile)}>
            <Trash2 className="size-4" />
            Delete file
          </Button>
        </div>
      ) : null}
    </div>
  );
}
