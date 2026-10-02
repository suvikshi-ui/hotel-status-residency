import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGate } from "@/components/security-gate";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { formatDayShort, uid } from "@/lib/format";
import { downloadGuestCheckinPdf } from "@/lib/guest-form-pdf";
import { publicUrl } from "@/lib/public-url";
import { canWrite } from "@/lib/roles";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/guests")({ component: GuestsPage });

function GuestsPage() {
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

  async function printForm() {
    try {
      await downloadGuestCheckinPdf();
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF could not be made");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Books</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Guest</h1>
      </div>
      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="list">Guest list</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="corporate">Corporate</TabsTrigger>
          <TabsTrigger value="agent">Travel agent</TabsTrigger>
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
            <Button type="button" onClick={() => void printForm()}>
              <Printer className="size-4" />
              Download PDF
            </Button>
          </div>
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-white text-[#141816] shadow-sm">
            <div className="flex items-center gap-3 bg-[#1b332a] px-4 py-3 text-white">
              <img
                src={publicUrl("logo.png?v=2")}
                alt=""
                className="size-14 shrink-0 rounded-md bg-white object-contain p-1"
              />
              <div>
                <p className="text-base font-semibold leading-tight sm:text-lg">
                  Hotel Status Residency — Guest Check-in
                </p>
                <p className="mt-1 text-[11px] text-white/80">
                  PAP-595/596, TTC MIDC Mahape, Navi Mumbai 400701 · FabHotel Status Residency
                </p>
                <p className="text-[11px] text-white/80">Please fill in under 2 minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-5 pt-5 text-[11px] font-semibold tracking-wide text-[#5c6662]">
              {["DATE", "ROOM", "STAFF"].map((label) => (
                <div key={label}>
                  {label}
                  <div className="mt-4 border-b border-[#5c6662]" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-5 px-5 py-6 text-sm">
              <Field title="1. Full name" />
              <Field title="2. Phone / WhatsApp" hint="Add country code if not an Indian number" />
              <Field title="3. Company (if any)" />
              <Field title="4. City or project you came from" />
              <div>
                <p className="font-semibold">5. Who booked? (tick one)</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <Tick label="OTA / booking app" />
                  <Tick label="Company" />
                  <Tick label="Self / friend / relative" />
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-3 text-[13px]">
                  <Tick label="Travel agent" />
                  <span>Name</span>
                  <span className="mb-1 h-px w-24 bg-[#5c6662]" />
                  <span>Phone</span>
                  <span className="mb-1 h-px w-24 bg-[#5c6662]" />
                </div>
              </div>
              <Field title="6. Check-out date" hint="DD / MM / YYYY" />
              <div className="grid grid-cols-[1fr_auto] items-end gap-6 rounded-md bg-[#f4f7f5] px-3 py-6 text-xs text-[#5c6662]">
                <div>
                  Guest signature
                  <div className="mt-4 border-b border-[#5c6662]" />
                </div>
                <div className="w-28">
                  Date
                  <div className="mt-4 border-b border-[#5c6662]" />
                </div>
              </div>
            </div>
            <p className="px-5 pb-4 text-center text-[11px] text-[#5c6662]">
              For hotel records and guest service only. We do not sell your details.
              <br />
              Hotel Status Residency · Mahape — keep at reception desk
            </p>
          </div>
        </TabsContent>
        <TabsContent value="corporate">
          <CorporateTab />
        </TabsContent>
        <TabsContent value="agent">
          <AgentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CorporateTab() {
  const rows = useLedger((s) => s.corporates);
  const setCorporates = useLedger((s) => s.setCorporates);
  const write = canWrite(useLedger((s) => s.appRole));
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const [name, setName] = useState("");
  const [gst, setGst] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [person, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  function add() {
    const company = name.trim();
    if (!company) {
      toast.error("Write the company name");
      return;
    }
    const bookingAmount = Math.round(Number(amount.replace(/,/g, "")) || 0);
    gate(
      () => {
        setCorporates([
          ...rows,
          {
            id: uid("co"),
            name: company,
            gst: gst.trim(),
            bookingAmount,
            address: address.trim(),
            person: person.trim(),
            phone: phone.trim(),
            email: email.trim(),
            note: note.trim(),
          },
        ]);
        setName("");
        setGst("");
        setAmount("");
        setAddress("");
        setPerson("");
        setPhone("");
        setEmail("");
        setNote("");
        setOpen(false);
        toast.success("Company added");
      },
      {
        title: "Add this company?",
        message: company,
        confirmLabel: "Add",
      },
    );
  }

  function remove(id: string) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    gate(
      () => {
        setCorporates(rows.filter((item) => item.id !== id));
        toast.success("Company deleted");
      },
      {
        title: "Delete this company?",
        message: row.name,
        confirmLabel: "Delete",
        danger: true,
        requireCode: true,
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">
          Companies the hotel has a tie-up with. Name, GST, agreed booking amount and address.
        </p>
        {write ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={open ? "outline" : "default"} onClick={() => setOpen((v) => !v)}>
              <Plus className="size-4" />
              {open ? "Close" : "Add"}
            </Button>
            <SaveCube busy={saving} onSave={() => void saveToServer()} />
          </div>
        ) : null}
      </div>
      {write && open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add company</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FieldBox label="Company name" value={name} onChange={setName} />
            <FieldBox label="GST number" value={gst} onChange={setGst} />
            <FieldBox label="Booking amount" value={amount} onChange={setAmount} numeric />
            <FieldBox label="Contact person" value={person} onChange={setPerson} />
            <FieldBox label="Phone" value={phone} onChange={setPhone} />
            <FieldBox label="Email" value={email} onChange={setEmail} />
            <div className="sm:col-span-2">
              <FieldBox label="Address" value={address} onChange={setAddress} />
            </div>
            <div className="sm:col-span-2">
              <FieldBox label="Tie-up note" value={note} onChange={setNote} />
            </div>
            <div>
              <Button type="button" onClick={add}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tie-up list · {rows.length}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No company yet.</p>
          ) : (
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-y border-border">
                  <th className="px-5 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">GST</th>
                  <th className="px-3 py-2 font-medium">Booking</th>
                  <th className="px-3 py-2 font-medium">Person</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  {write ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-5 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 tabular">{row.gst || "—"}</td>
                    <td className="px-3 py-2.5 tabular">
                      {row.bookingAmount ? `₹${row.bookingAmount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.person || "—"}
                      {row.email ? <div className="text-xs text-muted">{row.email}</div> : null}
                    </td>
                    <td className="px-3 py-2.5 tabular">{row.phone || "—"}</td>
                    <td className="px-3 py-2.5">{row.address || "—"}</td>
                    <td className="px-3 py-2.5">{row.note || "—"}</td>
                    {write ? (
                      <td className="py-2.5 pr-3 text-right">
                        <Button type="button" size="sm" variant="ghost" onClick={() => remove(row.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgentTab() {
  const rows = useLedger((s) => s.agents);
  const setAgents = useLedger((s) => s.setAgents);
  const write = canWrite(useLedger((s) => s.appRole));
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  function add() {
    const who = name.trim();
    if (!who) {
      toast.error("Write the travel agent name");
      return;
    }
    gate(
      () => {
        setAgents([
          ...rows,
          {
            id: uid("ta"),
            name: who,
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            city: city.trim(),
            note: note.trim(),
          },
        ]);
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setCity("");
        setNote("");
        setOpen(false);
        toast.success("Travel agent added");
      },
      {
        title: "Add this travel agent?",
        message: who,
        confirmLabel: "Add",
      },
    );
  }

  function remove(id: string) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    gate(
      () => {
        setAgents(rows.filter((item) => item.id !== id));
        toast.success("Travel agent deleted");
      },
      {
        title: "Delete this travel agent?",
        message: row.name,
        confirmLabel: "Delete",
        danger: true,
        requireCode: true,
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">
          Travel agents the hotel works with. Name, phone, email and other detail.
        </p>
        {write ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={open ? "outline" : "default"} onClick={() => setOpen((v) => !v)}>
              <Plus className="size-4" />
              {open ? "Close" : "Add"}
            </Button>
            <SaveCube busy={saving} onSave={() => void saveToServer()} />
          </div>
        ) : null}
      </div>
      {write && open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New travel agent</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FieldBox label="Agent name" value={name} onChange={setName} />
            <FieldBox label="Phone" value={phone} onChange={setPhone} />
            <FieldBox label="Email" value={email} onChange={setEmail} />
            <FieldBox label="City" value={city} onChange={setCity} />
            <div className="sm:col-span-2">
              <FieldBox label="Address" value={address} onChange={setAddress} />
            </div>
            <div className="sm:col-span-2">
              <FieldBox label="Other detail" value={note} onChange={setNote} />
            </div>
            <div>
              <Button type="button" onClick={add}>
                <Plus className="size-4" />
                Save agent
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent list · {rows.length}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No travel agent yet.</p>
          ) : (
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-y border-border">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">City</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                  {write ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-5 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 tabular">{row.phone || "—"}</td>
                    <td className="px-3 py-2.5">{row.email || "—"}</td>
                    <td className="px-3 py-2.5">{row.city || "—"}</td>
                    <td className="px-3 py-2.5">{row.address || "—"}</td>
                    <td className="px-3 py-2.5">{row.note || "—"}</td>
                    {write ? (
                      <td className="py-2.5 pr-3 text-right">
                        <Button type="button" size="sm" variant="ghost" onClick={() => remove(row.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FieldBox({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
      />
    </div>
  );
}

function Tick({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block size-3.5 border border-[#2a302e]" />
      {label}
    </span>
  );
}

function Field({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      {hint ? <p className="text-[11px] text-[#6a736f]">{hint}</p> : null}
      <div className="mt-4 border-b border-[#5c6662]" />
    </div>
  );
}
