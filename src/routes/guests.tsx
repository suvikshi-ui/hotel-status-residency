import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer } from "lucide-react";
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
          <TabsTrigger value="travel">Travel agent</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
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
            <div className="flex items-center gap-3 bg-[#1b332a] px-4 py-3 text-[#f6f0e6]">
              <img
                src={publicUrl("logo.png?v=2")}
                alt=""
                className="logo-3d h-14 w-auto shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1 text-center">
                <p className="font-display text-xl font-bold leading-tight text-[#f4c430] sm:text-2xl">
                  Hotel Status Residency
                </p>
                <p className="mt-1 text-[12px]">
                  Shree Kateel Shree Durga Parameshwari Amma
                </p>
              </div>
              <p className="shrink-0 text-right text-xs font-semibold">Guest check-in</p>
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
        <TabsContent value="travel">
          <TravelTab />
        </TabsContent>
        <TabsContent value="agent">
          <BookerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type PartyRow = {
  id: string;
  name: string;
  person: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  gst: string;
  city: string;
  address: string;
  note: string;
  bookingAmount?: number;
};

type PartyDraft = {
  person: string;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  gst: string;
  city: string;
  address: string;
  note: string;
  amount: string;
};

function blankParty(): PartyDraft {
  return {
    person: "",
    name: "",
    phone: "",
    phone2: "",
    email: "",
    email2: "",
    gst: "",
    city: "",
    address: "",
    note: "",
    amount: "",
  };
}

function PartyBook({
  rows,
  onSave,
  nameLabel,
  blurb,
  listTitle,
  empty,
  addTitle,
  saved,
  withAmount,
}: {
  rows: PartyRow[];
  onSave: (rows: PartyRow[]) => void;
  nameLabel: string;
  blurb: string;
  listTitle: string;
  empty: string;
  addTitle: string;
  saved: string;
  withAmount?: boolean;
}) {
  const write = canWrite(useLedger((s) => s.appRole));
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<null | "edit" | "delete">(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartyDraft>(blankParty);
  const set = (key: keyof PartyDraft) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  function save() {
    const name = draft.name.trim();
    if (!name) {
      toast.error(`Write the ${nameLabel.toLowerCase()}`);
      return;
    }
    const bookingAmount = Math.round(Number(draft.amount.replace(/,/g, "")) || 0);
    const next = {
      name,
      person: draft.person.trim(),
      phone: draft.phone.trim(),
      phone2: draft.phone2.trim(),
      email: draft.email.trim(),
      email2: draft.email2.trim(),
      gst: draft.gst.trim(),
      city: draft.city.trim(),
      address: draft.address.trim(),
      note: draft.note.trim(),
      bookingAmount,
    };
    const finish = () => {
      setDraft(blankParty());
      setOpen(false);
      setEditingId(null);
      setPick(null);
    };
    if (editingId) {
      onSave(rows.map((row) => (row.id === editingId ? { ...row, ...next } : row)));
      finish();
      toast.success("Updated");
      return;
    }
    gate(
      () => {
        onSave([...rows, { id: uid("co"), ...next }]);
        finish();
        toast.success(saved);
      },
      { title: addTitle, message: name, confirmLabel: "Add" },
    );
  }

  function beginEdit(row: PartyRow) {
    gate(
      () => {
        setEditingId(row.id);
        setDraft({
          person: row.person,
          name: row.name,
          phone: row.phone,
          phone2: row.phone2,
          email: row.email,
          email2: row.email2,
          gst: row.gst,
          city: row.city,
          address: row.address,
          note: row.note,
          amount: row.bookingAmount ? String(row.bookingAmount) : "",
        });
        setOpen(true);
        setPick(null);
      },
      {
        title: `Edit ${row.name}?`,
        message: "Enter the security code, then change this entry.",
        confirmLabel: "Edit",
        requireCode: true,
      },
    );
  }

  function beginDelete(row: PartyRow) {
    gate(
      () => {
        onSave(rows.filter((item) => item.id !== row.id));
        if (editingId === row.id) {
          setEditingId(null);
          setOpen(false);
          setDraft(blankParty());
        }
        setPick(null);
        toast.success("Deleted");
      },
      {
        title: "Delete this entry?",
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
        <p className="text-sm text-muted">{blurb}</p>
        {write ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={open && !editingId ? "outline" : "default"}
              onClick={() => {
                setEditingId(null);
                setDraft(blankParty());
                setPick(null);
                setOpen((v) => !v || Boolean(editingId));
              }}
            >
              <Plus className="size-4" />
              {open && !editingId ? "Close" : "Add"}
            </Button>
            <Button
              type="button"
              variant={pick === "edit" ? "default" : "outline"}
              onClick={() => setPick((mode) => (mode === "edit" ? null : "edit"))}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={pick === "delete" ? "default" : "outline"}
              onClick={() => setPick((mode) => (mode === "delete" ? null : "delete"))}
            >
              Delete
            </Button>
            <SaveCube busy={saving} onSave={() => void saveToServer()} />
          </div>
        ) : null}
      </div>
      {write && open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Edit entry" : addTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FieldBox label="Contact person" value={draft.person} onChange={set("person")} />
            <FieldBox label={nameLabel} value={draft.name} onChange={set("name")} />
            <FieldBox label="Mobile number 1" value={draft.phone} onChange={set("phone")} />
            <FieldBox label="Mobile number 2" value={draft.phone2} onChange={set("phone2")} />
            <FieldBox label="Email ID 1" value={draft.email} onChange={set("email")} />
            <FieldBox label="Email ID 2" value={draft.email2} onChange={set("email2")} />
            <FieldBox label="Company GST number" value={draft.gst} onChange={set("gst")} />
            <FieldBox label="City" value={draft.city} onChange={set("city")} />
            <div className="sm:col-span-2">
              <FieldBox label="Address" value={draft.address} onChange={set("address")} />
            </div>
            <div className="sm:col-span-2">
              <FieldBox label="Other detail" value={draft.note} onChange={set("note")} />
            </div>
            {withAmount ? (
              <FieldBox label="Booking amount" value={draft.amount} onChange={set("amount")} numeric />
            ) : null}
            <div>
              <Button type="button" onClick={save}>
                <Plus className="size-4" />
                {editingId ? "Save" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {listTitle} · {rows.length}
          </CardTitle>
          {pick ? (
            <p className="text-sm text-muted">
              {pick === "edit" ? "Tick the row you want to edit." : "Tick the row you want to delete."}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">{empty}</p>
          ) : (
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr className="border-y border-border">
                  {pick ? <th className="px-3 py-2 font-medium">Tick</th> : null}
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Person</th>
                  <th className="px-3 py-2 font-medium">Mobile</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">GST</th>
                  <th className="px-3 py-2 font-medium">City</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  {withAmount ? <th className="px-3 py-2 font-medium">Booking</th> : null}
                  <th className="px-3 py-2 font-medium">Other</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    {pick ? (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          className="size-4"
                          aria-label={`${pick === "edit" ? "Edit" : "Delete"} ${row.name}`}
                          checked={pick === "edit" && editingId === row.id}
                          onChange={() => (pick === "edit" ? beginEdit(row) : beginDelete(row))}
                        />
                      </td>
                    ) : null}
                    <td className="px-5 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5">{row.person || "—"}</td>
                    <td className="px-3 py-2.5 tabular">
                      {row.phone || "—"}
                      {row.phone2 ? <div>{row.phone2}</div> : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.email || "—"}
                      {row.email2 ? <div className="text-xs text-muted">{row.email2}</div> : null}
                    </td>
                    <td className="px-3 py-2.5 tabular">{row.gst || "—"}</td>
                    <td className="px-3 py-2.5">{row.city || "—"}</td>
                    <td className="px-3 py-2.5">{row.address || "—"}</td>
                    {withAmount ? (
                      <td className="px-3 py-2.5 tabular">
                        {row.bookingAmount ? `₹${row.bookingAmount.toLocaleString("en-IN")}` : "—"}
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">{row.note || "—"}</td>
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

function CorporateTab() {
  const rows = useLedger((s) => s.corporates);
  const setCorporates = useLedger((s) => s.setCorporates);
  return (
    <PartyBook
      rows={rows}
      withAmount
      nameLabel="Company name"
      blurb="Companies the hotel has a tie-up with."
      listTitle="Tie-up list"
      empty="No company yet."
      addTitle="Add this company?"
      saved="Company added"
      onSave={(next) =>
        setCorporates(next.map((row) => ({ ...row, bookingAmount: row.bookingAmount ?? 0 })))
      }
    />
  );
}

function TravelTab() {
  const rows = useLedger((s) => s.agents);
  const setAgents = useLedger((s) => s.setAgents);
  return (
    <PartyBook
      rows={rows}
      nameLabel="Travel agent name"
      blurb="Travel agents the hotel works with."
      listTitle="Travel agent list"
      empty="No travel agent yet."
      addTitle="Add this travel agent?"
      saved="Travel agent added"
      onSave={setAgents}
    />
  );
}

function BookerTab() {
  const rows = useLedger((s) => s.bookers);
  const setBookers = useLedger((s) => s.setBookers);
  return (
    <PartyBook
      rows={rows}
      nameLabel="Agent name"
      blurb="Other agents the hotel works with."
      listTitle="Agent list"
      empty="No agent yet."
      addTitle="Add this agent?"
      saved="Agent added"
      onSave={setBookers}
    />
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
