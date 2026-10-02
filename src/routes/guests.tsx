import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDayShort } from "@/lib/format";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/guests")({ component: GuestsPage });

const FORM_ROWS = [
  "Full name",
  "Phone number",
  "Company name",
  "Where from",
  "Who booked",
  "Room number",
  "Date",
  "Signature",
];

function GuestsPage() {
  const hotel = useLedger((s) => s.hotel);
  const cards = useLedger((s) => s.guestCards);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((card) =>
      [card.fullName, card.phone, card.company, card.cameFrom, card.bookedBy, card.roomNo]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [cards, q]);

  function printForm() {
    const lines = FORM_ROWS.map(
      (label) =>
        `<tr><th style="width:34%">${escapeHtml(label)}</th><td style="height:42px"></td></tr>`,
    ).join("");
    printDocument({
      title: "Guest registration",
      heading: hotel.name || "Hotel Status Residency",
      sub: "Guest registration form",
      table: `<table>${lines}</table>`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Books</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Guest</h1>
      </div>
      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Guest list</TabsTrigger>
          <TabsTrigger value="form">Registration form</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="flex flex-col gap-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, company"
            aria-label="Search guests"
          />
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr className="border-y border-border">
                    <th className="px-5 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Room</th>
                    <th className="px-3 py-2 font-medium">Full name</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Where from</th>
                    <th className="px-3 py-2 font-medium">Who booked</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((card) => (
                    <tr key={card.id} className="border-b border-border/70">
                      <td className="px-5 py-2.5 tabular text-muted">
                        {card.date ? formatDayShort(card.date) : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular">{card.roomNo || "—"}</td>
                      <td className="px-3 py-2.5 font-medium">{card.fullName}</td>
                      <td className="px-3 py-2.5 tabular">{card.phone || "—"}</td>
                      <td className="px-3 py-2.5">{card.company || "—"}</td>
                      <td className="px-3 py-2.5">{card.cameFrom || "—"}</td>
                      <td className="px-3 py-2.5">{card.bookedBy || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Tick a posting in Register and fill the guest detail.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="form" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button type="button" onClick={printForm}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
          <Card className="mx-auto w-full max-w-xl p-6">
            <p className="font-display text-2xl font-semibold">{hotel.name || "Hotel Status Residency"}</p>
            <p className="mt-1 text-sm text-muted">Guest registration form</p>
            <div className="mt-5 flex flex-col gap-4">
              {FORM_ROWS.map((label) => (
                <div key={label} className="border-b border-border pb-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
                  <div className="mt-3 h-6" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
