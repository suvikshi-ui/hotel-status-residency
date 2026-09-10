import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGate } from "@/components/security-gate";
import { formatDay, money, uid } from "@/lib/format";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { staffPay } from "@/lib/staff-pay";
import { useLedger } from "@/lib/store";
import { HotelLogo } from "@/components/hotel-logo";
import type { AdvanceRow, StaffRow } from "@/lib/types";

export const Route = createFileRoute("/staff")({ component: StaffPage });

type Sheet = "salary" | "advance";

function StaffPage() {
  const hotel = useLedger((s) => s.hotel);
  const date = useLedger((s) => s.selectedDate);
  const staff = useLedger((s) => s.staff);
  const advances = useLedger((s) => s.advances);
  const setStaff = useLedger((s) => s.setStaff);
  const setAdvances = useLedger((s) => s.setAdvances);
  const { gate } = useGate();
  const [sheet, setSheet] = useState<Sheet>("salary");
  const [monthDays, setMonthDays] = useState(30);
  const [draft, setDraft] = useState<StaffRow[]>(staff);
  const [advDraft, setAdvDraft] = useState<AdvanceRow[]>(advances);

  useEffect(() => {
    setDraft(staff);
  }, [staff]);
  useEffect(() => {
    setAdvDraft(advances);
  }, [advances]);

  const rows = useMemo(
    () =>
      draft.map((r) => {
        const { earned, payable } = staffPay(
          r.salary,
          r.working,
          r.extra ?? 0,
          r.advance,
          monthDays,
        );
        return { ...r, extra: r.extra ?? 0, earned, payable };
      }),
    [draft, monthDays],
  );

  const payroll = rows.reduce((s, r) => s + r.payable, 0);
  const earnedTotal = rows.reduce((s, r) => s + r.earned, 0);
  const extraTotal = rows.reduce((s, r) => s + (r.extra ?? 0), 0);
  const salaryAdv = rows.reduce((s, r) => s + r.advance, 0);
  const advCash = advDraft.reduce((s, r) => s + r.cash, 0);
  const advQr = advDraft.reduce((s, r) => s + r.qrs, 0);
  const staffDirty = JSON.stringify(draft) !== JSON.stringify(staff);
  const advDirty = JSON.stringify(advDraft) !== JSON.stringify(advances);

  function patchStaff(id: string, field: keyof StaffRow, value: string) {
    setDraft((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "name" || field === "role" || field === "status") {
          return { ...r, [field]: value };
        }
        const n = Number(value);
        return { ...r, [field]: Number.isFinite(n) ? n : 0 };
      }),
    );
  }

  function patchAdv(id: string, field: keyof AdvanceRow, value: string) {
    setAdvDraft((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "name" || field === "month") return { ...r, [field]: value };
        const n = Number(value);
        return { ...r, [field]: Number.isFinite(n) ? n : 0 };
      }),
    );
  }

  function printSalary() {
    const body = `<table>
      <thead><tr>
        <th>Name</th><th class="num">Basic</th><th class="num">Working</th>
        <th class="num">Extra</th><th class="num">Earned</th>
        <th class="num">Advance</th><th class="num">To pay</th>
      </tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td class="num">${escapeHtml(money(r.salary))}</td>
          <td class="num">${r.working}</td>
          <td class="num">${r.extra}</td>
          <td class="num">${escapeHtml(money(r.earned))}</td>
          <td class="num">${escapeHtml(money(r.advance))}</td>
          <td class="num">${escapeHtml(money(r.payable))}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot><tr>
        <td>Total</td><td></td><td></td>
        <td class="num">${extraTotal}</td>
        <td class="num">${escapeHtml(money(earnedTotal))}</td>
        <td class="num">${escapeHtml(money(salaryAdv))}</td>
        <td class="num">${escapeHtml(money(payroll))}</td>
      </tr></tfoot>
    </table>`;
    toast.message("Opening print…");
    printDocument({
      title: "Salary sheet",
      heading: hotel.name,
      sub: `${hotel.place} · Salary sheet · ${formatDay(date)}`,
      table: body,
    });
  }

  function printAdvance() {
    const body = `<table>
      <thead><tr>
        <th>Name</th><th class="num">Cash</th><th class="num">QR</th><th class="num">Total</th>
      </tr></thead>
      <tbody>
        ${advDraft
          .map(
            (r) => `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td class="num">${escapeHtml(money(r.cash))}</td>
          <td class="num">${escapeHtml(money(r.qrs))}</td>
          <td class="num">${escapeHtml(money(r.cash + r.qrs))}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot><tr>
        <td>Total</td>
        <td class="num">${escapeHtml(money(advCash))}</td>
        <td class="num">${escapeHtml(money(advQr))}</td>
        <td class="num">${escapeHtml(money(advCash + advQr))}</td>
      </tr></tfoot>
    </table>`;
    toast.message("Opening print…");
    printDocument({
      title: "Advance sheet",
      heading: hotel.name,
      sub: `${hotel.place} · Advance sheet · ${formatDay(date)}`,
      table: body,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="hidden border-b border-border pb-3 print:block">
        <div className="flex items-center gap-3">
          <HotelLogo mark className="h-12 w-auto shrink-0" />
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {hotel.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {hotel.place} · {sheet === "salary" ? "Salary sheet" : "Advance sheet"} · {formatDay(date)}
            </p>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Payroll
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Staff
        </h1>
        <p className="mt-1 text-sm text-muted">
          Salary sheet and advance sheet are separate
        </p>
      </div>

      <Tabs value={sheet} onValueChange={(v) => setSheet(v as Sheet)}>
        <TabsList className="grid w-full grid-cols-2 print:hidden" aria-label="Staff sheets">
          <TabsTrigger value="salary" className="w-full">
            Salary sheet
          </TabsTrigger>
          <TabsTrigger value="advance" className="w-full">
            Advance sheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
            <div className="grid gap-1.5">
              <Label htmlFor="month-days">Days in month</Label>
              <Input
                id="month-days"
                type="number"
                min={1}
                max={31}
                className="w-24"
                value={monthDays}
                onChange={(e) => setMonthDays(Number(e.target.value) || 30)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={printSalary}>
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                type="button"
                disabled={!staffDirty}
                onClick={() =>
                  gate(
                    () => {
                    const next = rows.map(({ earned, payable, ...r }) => ({
                      ...r,
                      total: payable,
                    }));
                    setStaff(next);
                    toast.success("Salary sheet saved");
                    },
                    {
                      title: "Are you sure?",
                      message: "Save salary sheet changes?",
                      confirmLabel: "Save",
                    },
                  )
                }
              >
                Save salary
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 print:hidden lg:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Earned</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">
                {money(earnedTotal)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Advance minus</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">
                {money(salaryAdv)}
              </div>
            </Card>
            <Card className="col-span-2 p-4 lg:col-span-1">
              <div className="text-xs font-medium text-muted">To pay</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular text-ok">
                {money(payroll)}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Salary sheet</CardTitle>
              <p className="text-sm text-muted">
                Basic ÷ {monthDays} × (working + extra) − advance = to pay
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[56rem] text-left text-sm print:min-w-0">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr className="border-y border-border">
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 text-right font-medium">Basic</th>
                    <th className="px-3 py-2 text-right font-medium">Working</th>
                    <th className="px-3 py-2 text-right font-medium">Extra day</th>
                    <th className="px-3 py-2 text-right font-medium">Earned</th>
                    <th className="px-3 py-2 text-right font-medium">Advance</th>
                    <th className="px-3 py-2 text-right font-medium">To pay</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/70">
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} name`}
                          value={r.name}
                          onChange={(e) => patchStaff(r.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} basic salary`}
                          type="number"
                          className="text-right tabular"
                          value={r.salary}
                          onChange={(e) => patchStaff(r.id, "salary", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} working days`}
                          type="number"
                          className="text-right tabular"
                          value={r.working}
                          onChange={(e) =>
                            patchStaff(r.id, "working", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} extra working day`}
                          type="number"
                          className="text-right tabular"
                          value={r.extra}
                          onChange={(e) => patchStaff(r.id, "extra", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular">
                        {money(r.earned)}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} advance`}
                          type="number"
                          className="text-right tabular"
                          value={r.advance}
                          onChange={(e) =>
                            patchStaff(r.id, "advance", e.target.value)
                          }
                        />
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right tabular font-medium ${r.payable < 0 ? "text-due" : ""}`}
                      >
                        {money(r.payable)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={r.status === "HOLD" ? "warn" : "ok"}>
                          {r.status || "PAID"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                    <td className="px-5 py-2.5">Total</td>
                    <td />
                    <td />
                    <td className="px-3 py-2.5 text-right tabular">{extraTotal}</td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(earnedTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(salaryAdv)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(payroll)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advance" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-end gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAdvDraft((prev) => [
                  ...prev,
                  {
                    id: uid("adv"),
                    name: "",
                    cash: 0,
                    qrs: 0,
                    month: date.slice(0, 7),
                  },
                ]);
              }}
            >
              Add advance
            </Button>
            <Button type="button" variant="outline" onClick={printAdvance}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button
              type="button"
              disabled={!advDirty}
              onClick={() =>
                gate(
                  () => {
                  setAdvances(advDraft.filter((r) => r.name.trim()));
                  toast.success("Advance sheet saved");
                  },
                  {
                    title: "Are you sure?",
                    message: "Save advance sheet changes?",
                    confirmLabel: "Save",
                  },
                )
              }
            >
              Save advances
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 print:hidden lg:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Cash</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">
                {money(advCash)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Santosh QR</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">
                {money(advQr)}
              </div>
            </Card>
            <Card className="col-span-2 p-4 lg:col-span-1">
              <div className="text-xs font-medium text-muted">Advance total</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">
                {money(advCash + advQr)}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Advance sheet</CardTitle>
              <p className="text-sm text-muted">
                Edit name, cash and QR. Total adds itself.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[32rem] text-left text-sm print:min-w-0">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr className="border-y border-border">
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 text-right font-medium">Cash</th>
                    <th className="px-3 py-2 text-right font-medium">QR</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {advDraft.map((r) => (
                    <tr key={r.id} className="border-b border-border/70">
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name || "new"} advance name`}
                          value={r.name}
                          onChange={(e) => patchAdv(r.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} cash advance`}
                          type="number"
                          className="text-right tabular"
                          value={r.cash}
                          onChange={(e) => patchAdv(r.id, "cash", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`${r.name} QR advance`}
                          type="number"
                          className="text-right tabular"
                          value={r.qrs}
                          onChange={(e) => patchAdv(r.id, "qrs", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular font-medium">
                        {money(r.cash + r.qrs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                    <td className="px-5 py-2.5">Total</td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(advCash)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(advQr)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(advCash + advQr)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
