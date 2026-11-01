import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EntryPick, EntryTick, type PickMode } from "@/components/entry-pick";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGate } from "@/components/security-gate";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { uid } from "@/lib/format";
import { useLedger } from "@/lib/store";
import { canWrite } from "@/lib/roles";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const contacts = useLedger((s) => s.contacts);
  const setContacts = useLedger((s) => s.setContacts);
  const write = canWrite(useLedger((s) => s.appRole));
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<PickMode>(null);
  const [ticks, setTicks] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function add() {
    const point = topic.trim();
    const who = name.trim();
    if (!point || !who) {
      toast.error("Write what this contact is for, and the name");
      return;
    }
    gate(
      () => {
        if (editingId) {
          setContacts(
            contacts.map((row) =>
              row.id === editingId
                ? { ...row, topic: point, name: who, phone: phone.trim(), address: address.trim() }
                : row,
            ),
          );
          setEditingId(null);
          toast.success("Contact updated");
        } else {
          setContacts([
            ...contacts,
            {
              id: uid("ct"),
              topic: point,
              name: who,
              phone: phone.trim(),
              address: address.trim(),
            },
          ]);
          toast.success("Contact added");
        }
        setTopic("");
        setName("");
        setPhone("");
        setAddress("");
        setOpen(false);
      },
      {
        title: editingId ? "Save this edit?" : "Add this contact?",
        message: `${point} · ${who}`,
        confirmLabel: editingId ? "Save" : "Add",
        requireCode: Boolean(editingId),
      },
    );
  }

  function remove(id: string) {
    const row = contacts.find((item) => item.id === id);
    if (!row) return;
    gate(
      () => {
        setContacts(contacts.filter((item) => item.id !== id));
        toast.success("Contact deleted");
      },
      {
        title: "Delete this contact?",
        message: `${row.topic} · ${row.name}`,
        confirmLabel: "Delete",
        danger: true,
        requireCode: true,
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Desk</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted">
            Add a point, then the name, phone and address. Example: AC service.
          </p>
        </div>
        {write ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={open && !editingId ? "outline" : "default"} onClick={() => {
              setEditingId(null);
              setTopic("");
              setName("");
              setPhone("");
              setAddress("");
              setOpen((v) => !v || Boolean(editingId));
            }}>
              <Plus className="size-4" />
              {open && !editingId ? "Close" : "Add"}
            </Button>
            <EntryPick
              mode={pick}
              onMode={(mode) => {
                setPick(mode);
                setTicks([]);
              }}
              count={ticks.length}
              onDelete={() =>
                gate(
                  () => {
                    setContacts(contacts.filter((row) => !ticks.includes(row.id)));
                    toast.success(`Deleted ${ticks.length}`);
                    setTicks([]);
                    setPick(null);
                  },
                  {
                    title: `Delete ${ticks.length} contacts?`,
                    message: "Enter the security code.",
                    confirmLabel: "Delete",
                    danger: true,
                    requireCode: true,
                  },
                )
              }
            />
            <SaveCube busy={saving} onSave={() => void saveToServer()} />
          </div>
        ) : null}
      </div>

      {write && open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Edit contact" : "New contact"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-topic">For</Label>
              <Input
                id="contact-topic"
                value={topic}
                placeholder="AC service"
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-phone">Contact</Label>
              <Input
                id="contact-phone"
                value={phone}
                inputMode="tel"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-address">Address</Label>
              <Input
                id="contact-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" onClick={add}>
                <Plus className="size-4" />
                {editingId ? "Save" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">List</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted">No contacts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-muted">
                  <tr className="border-y border-border">
                    {pick ? <th className="py-2 pr-3 font-medium">Tick</th> : null}
                    <th className="py-2 font-medium">For</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Contact</th>
                    <th className="px-3 py-2 font-medium">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((row) => (
                    <tr key={row.id} className="border-b border-border/70">
                      {pick ? (
                        <td className="py-2.5 pr-3">
                          <EntryTick
                            checked={pick === "edit" ? editingId === row.id : ticks.includes(row.id)}
                            label={`${pick === "edit" ? "Edit" : "Delete"} ${row.name}`}
                            onChange={() => {
                              if (pick === "edit") {
                                setEditingId(row.id);
                                setTopic(row.topic);
                                setName(row.name);
                                setPhone(row.phone);
                                setAddress(row.address);
                                setOpen(true);
                                return;
                              }
                              setTicks((ids) =>
                                ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id],
                              );
                            }}
                          />
                        </td>
                      ) : null}
                      <td className="py-2.5 font-medium">{row.topic}</td>
                      <td className="px-3 py-2.5">{row.name}</td>
                      <td className="px-3 py-2.5 tabular">{row.phone || "—"}</td>
                      <td className="px-3 py-2.5">{row.address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
