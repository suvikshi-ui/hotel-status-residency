import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGate } from "@/components/security-gate";
import {
  COMPLAINT_DESKS,
  COMPLAINT_LEVELS,
  complaintPlaceLabel,
  complaintsForRoom,
  emptyComplaint,
  isAcService,
  roomCubeLayout,
  type ComplaintLevel,
  type RoomComplaint,
  AC_SERVICES,
  acServiceKind,
  acServiceLabel,
  acServiceNote,
  type AcServiceKind,
} from "@/lib/complaints";
import {
  COMPLAINT_LIST_KIND,
  complaintStatus,
  downloadComplaintPdf,
  filterComplaints,
  printComplaintList,
  sortComplaints,
  type ComplaintListKind,
  complaintListPdf,
} from "@/lib/complaint-report";
import { formatDayShort } from "@/lib/format";
import { useLedger } from "@/lib/store";
import { canWrite } from "@/lib/roles";
import { useStaffSession } from "@/lib/supabase-auth";
import type { RoomDef } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { isSealed, sealKey, type SealedIds } from "@/lib/sheet-seal";

export const Route = createFileRoute("/complaints")({
  component: ComplaintsPage,
});

const FLOORS: RoomDef["floor"][] = ["Ground", "First", "Second", "Third"];

const LEVEL_FACE: Record<ComplaintLevel, string> = {
  red: "bg-danger text-primary-fg",
  yellow: "bg-due text-primary-fg",
  green: "bg-ok text-primary-fg",
};

const LEVEL_RING: Record<ComplaintLevel, string> = {
  red: "border-danger bg-danger/15 text-danger",
  yellow: "border-due bg-due/15 text-due",
  green: "border-ok bg-ok/15 text-ok",
};

function ComplaintsPage() {
  const rooms = useLedger((s) => s.rooms);
  const complaints = useLedger((s) => s.complaints);
  const setComplaints = useLedger((s) => s.setComplaints);
  const removeComplaint = useLedger((s) => s.removeComplaint);
  const sealedIds = useLedger((s) => s.sealedIds);
  const { busy: saving, saveToServer } = useAccountSave();
  const role = useLedger((s) => s.appRole);
  const write = canWrite(role);
  const { user } = useStaffSession();
  const who = (user?.name || user?.username || "").trim();
  const { gate } = useGate();
  const [open, setOpen] = useState<{
    roomNo: string;
    existing?: RoomComplaint;
  } | null>(null);
  const [note, setNote] = useState("");
  const [level, setLevel] = useState<ComplaintLevel>("yellow");

  const deskComplaints = useMemo(
    () => complaints.filter((row) => !isAcService(row)),
    [complaints],
  );
  const acRows = useMemo(() => complaints.filter(isAcService), [complaints]);
  const openCount = deskComplaints.filter((c) => c.level !== "green").length;
  const redCount = deskComplaints.filter((c) => c.level === "red").length;
  const solvedCount = deskComplaints.filter((c) => c.level === "green").length;
  const showList = role === "admin" || role === "housekeeping" || role === "owner";

  const byFloor = useMemo(
    () =>
      FLOORS.map((floor) => ({
        floor,
        rooms: rooms.filter((r) => r.floor === floor),
      })),
    [rooms],
  );

  function startNew(roomNo: string) {
    setNote("");
    setLevel("yellow");
    setOpen({ roomNo });
  }

  function startEdit(roomNo: string, existing: RoomComplaint) {
    if (isSealed(sealedIds, sealKey.complaint(existing.id))) {
      toast.message("Saved cube — this complaint will not change");
      return;
    }
    setNote(existing.note);
    setLevel(existing.level);
    setOpen({ roomNo, existing });
  }

  function save() {
    if (!open) return;
    const roomNo = open.roomNo;
    const text = note.trim();
    if (!text) {
      toast.error("Write the complaint");
      return;
    }
    const existing = open.existing;
    if (existing && isSealed(sealedIds, sealKey.complaint(existing.id))) {
      toast.message("Saved cube — this complaint will not change");
      return;
    }
    const apply = () => {
      if (existing) {
        setComplaints(
          complaints.map((c) =>
            c.id === existing.id ? { ...c, note: text, level } : c,
          ),
        );
        toast.success(`${complaintPlaceLabel(roomNo)} updated`);
      } else {
        setComplaints([...complaints, emptyComplaint(roomNo, level, text, who)]);
        toast.success(`${complaintPlaceLabel(roomNo)} complaint logged`);
      }
      setOpen(null);
    };
    if (role === "housekeeping") {
      apply();
      return;
    }
    gate(apply, {
      title: "Are you sure?",
      message: existing
        ? `Update room ${roomNo} to ${level}?`
        : `Register ${level} complaint for room ${roomNo}?`,
      confirmLabel: existing ? "Save" : "Register",
    });
  }

  function logAc(roomNo: string, date: string, kind: AcServiceKind) {
    if (!date) {
      toast.error("Pick the service date");
      return;
    }
    const apply = () => {
      const next = complaints.filter(
        (row) =>
          !(
            isAcService(row) &&
            row.roomNo === roomNo &&
            row.createdAt.slice(0, 10) === date
          ),
      );
      const row = emptyComplaint(roomNo, "green", acServiceNote(kind), who);
      row.createdAt = date;
      setComplaints([...next, row]);
      toast.success(`${roomNo} · ${formatDayShort(date)} · ${acServiceLabel(kind)}`);
    };
    if (role === "housekeeping") {
      apply();
      return;
    }
    gate(apply, {
      title: "Save this AC service?",
      message: `Room ${roomNo} on ${formatDayShort(date)}: ${acServiceLabel(kind)}.`,
      confirmLabel: "Save",
    });
  }

  function remove() {
    if (role === "housekeeping") return;
    const existing = open?.existing;
    const roomNo = open?.roomNo;
    if (!existing || !roomNo) return;
    if (isSealed(sealedIds, sealKey.complaint(existing.id))) {
      toast.message("Saved cube — this complaint will not change");
      return;
    }
    gate(
      () => {
        removeComplaint(existing.id);
        toast.success(`${complaintPlaceLabel(roomNo)} complaint deleted`);
        setOpen(null);
      },
      {
        title: `Delete room ${roomNo} complaint?`,
        message: existing.note || "This cube will be removed.",
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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Housekeeping
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Complaints
        </h1>
        <p className="mt-1 text-sm text-muted">
          {showList
            ? "Register a complaint. List shows every room. Housekeeping cannot delete."
            : "Log a cube, then press Save to send the books to the server."}
        </p>
      </div>
      {write ? <SaveCube busy={saving} onSave={() => void saveToServer()} /> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={openCount} />
        <Stat label="Emergency" value={redCount} tone="danger" />
        <Stat label="Solved" value={solvedCount} />
        <Stat label="Logged" value={deskComplaints.length} />
      </div>

      <Tabs defaultValue="complaints">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="ac">AC service</TabsTrigger>
        </TabsList>
        <TabsContent value="complaints" className="flex flex-col gap-5">
      {showList ? (
        <Tabs defaultValue="cubes">
          <TabsList className="grid w-full grid-cols-2 print:hidden" aria-label="Complaint views">
            <TabsTrigger value="cubes" className="w-full">
              Cubes
            </TabsTrigger>
            <TabsTrigger value="list" className="w-full">
              List
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cubes" className="flex flex-col gap-5">
            <ComplaintCubes
              byFloor={byFloor}
              complaints={deskComplaints}
              sealedIds={sealedIds}
              onNew={write ? startNew : () => undefined}
              onEdit={startEdit}
              write={write}
            />
          </TabsContent>
          <TabsContent value="list">
            <ComplaintList rooms={rooms} complaints={deskComplaints} />
          </TabsContent>
        </Tabs>
      ) : (
        <ComplaintCubes
          byFloor={byFloor}
          complaints={deskComplaints}
          sealedIds={sealedIds}
          onNew={startNew}
          onEdit={startEdit}
        />
      )}
        </TabsContent>
        <TabsContent value="ac">
          <AcService
            byFloor={byFloor}
            rows={acRows}
            write={write}
            onLog={logAc}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(open)}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {open?.existing ? "Update complaint" : "Register complaint"} ·{" "}
              {open ? complaintPlaceLabel(open.roomNo) : ""}
            </DialogTitle>
            <DialogDescription>
              Red for emergency, yellow if it can wait, green when it is fixed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="complaint-note">What is wrong</Label>
              <Input
                id="complaint-note"
                value={note}
                disabled={!write}
                onChange={(e) => setNote(e.target.value)}
                placeholder="AC, tap, lock…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Colour</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLAINT_LEVELS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => write && setLevel(opt.id)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-left",
                      level === opt.id
                        ? LEVEL_RING[opt.id]
                        : "border-border bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 block size-4 rounded-sm",
                        LEVEL_FACE[opt.id],
                      )}
                    />
                    <span className="block text-xs font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {open?.existing && write && role !== "housekeeping" ? (
                <Button type="button" variant="danger" onClick={remove}>
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>
                Cancel
              </Button>
              {write ? (
              <Button type="button" onClick={save}>
                {open?.existing ? "Save" : "Register"}
              </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AcService({
  byFloor,
  rows,
  write,
  onLog,
}: {
  byFloor: { floor: RoomDef["floor"]; rooms: RoomDef[] }[];
  rows: RoomComplaint[];
  write: boolean;
  onLog: (roomNo: string, date: string, kind: AcServiceKind) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [dates, setDates] = useState<Record<string, string>>({});
  const roomCount = byFloor.reduce((n, floor) => n + floor.rooms.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <AcChart byFloor={byFloor} rows={rows} roomCount={roomCount} />
      <p className="text-sm text-muted">
        Room number, the date, and which service. That date keeps this service.
      </p>
      {byFloor.map(({ floor, rooms: floorRooms }) => (
        <Card key={floor}>
          <CardHeader>
            <CardTitle className="text-base">{floor} floor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {floorRooms.map((room) => {
              const date = dates[room.no] || today;
              const current = rows.find(
                (row) => row.roomNo === room.no && row.createdAt.slice(0, 10) === date,
              );
              const currentKind = current ? acServiceKind(current.note) : null;
              return (
                <div
                  key={room.no}
                  className="flex flex-col gap-2 border-b border-border/70 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-10 font-display text-lg font-semibold tabular">{room.no}</span>
                    <Input
                      type="date"
                      aria-label={`Service date for room ${room.no}`}
                      value={date}
                      disabled={!write}
                      className="w-40"
                      onChange={(e) =>
                        setDates((prev) => ({ ...prev, [room.no]: e.target.value }))
                      }
                    />
                    {currentKind ? (
                      <span className="text-xs text-muted">
                        {formatDayShort(date)} · {acServiceLabel(currentKind)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">No service on this date</span>
                    )}
                  </div>
                  {write ? (
                    <div className="flex flex-wrap gap-2">
                      {AC_SERVICES.map((kind) => (
                        <Button
                          key={kind.id}
                          type="button"
                          size="sm"
                          variant={currentKind === kind.id ? "default" : "outline"}
                          onClick={() => onLog(room.no, date, kind.id)}
                        >
                          {kind.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const AC_TONE: Record<AcServiceKind, string> = {
  "jet-pump": "bg-[#d7ebe3] text-[#1b332a]",
  breakdown: "bg-[#f6e7c8] text-[#5c4314]",
  gas: "bg-[#d9e6f5] text-[#1d3d66]",
  motherboard: "bg-[#eadff2] text-[#4a2d5c]",
};

function AcChart({
  byFloor,
  rows,
  roomCount,
}: {
  byFloor: { floor: RoomDef["floor"]; rooms: RoomDef[] }[];
  rows: RoomComplaint[];
  roomCount: number;
}) {
  function marks(roomNo: string, kind: AcServiceKind) {
    return rows
      .filter((row) => row.roomNo === roomNo && acServiceKind(row.note) === kind)
      .map((row) => row.createdAt.slice(0, 10))
      .sort((a, b) => b.localeCompare(a));
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AC service chart</CardTitle>
        <p className="text-sm text-muted">
          Every room, and the date each service was done. Blank means not done.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AC_SERVICES.map((kind) => {
            const done = new Set(
              rows.filter((row) => acServiceKind(row.note) === kind.id).map((row) => row.roomNo),
            ).size;
            return (
              <div key={kind.id} className={`rounded-lg px-3 py-2 ${AC_TONE[kind.id]}`}>
                <div className="text-[11px] font-medium uppercase tracking-wide">{kind.label}</div>
                <div className="mt-1 font-display text-xl font-semibold tabular">
                  {done}
                  <span className="ml-1 text-xs font-medium">/ {roomCount} rooms</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide">
                <th className="sticky left-0 bg-card px-3 py-2 font-medium">Room</th>
                {AC_SERVICES.map((kind) => (
                  <th key={kind.id} className={`px-3 py-2 font-medium ${AC_TONE[kind.id]}`}>
                    {kind.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byFloor.map(({ floor, rooms: floorRooms }) => (
                <Fragment key={floor}>
                  <tr>
                    <td
                      colSpan={5}
                      className="bg-bg-warm/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {floor} floor
                    </td>
                  </tr>
                  {floorRooms.map((room) => (
                    <tr key={room.no} className="border-b border-border/70">
                      <td className="sticky left-0 bg-card px-3 py-2 font-display text-base font-semibold tabular">
                        {room.no}
                      </td>
                      {AC_SERVICES.map((kind) => {
                        const when = marks(room.no, kind.id);
                        return (
                          <td key={kind.id} className="border-b border-border/60 px-3 py-2 align-top">
                            {when.length ? (
                              <div className={`inline-flex flex-col rounded-md px-2 py-1 text-xs font-medium ${AC_TONE[kind.id]}`}>
                                {when.map((date) => (
                                  <span key={date} className="tabular">
                                    {formatDayShort(date)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintCubes({
  byFloor,
  complaints,
  sealedIds,
  onNew,
  onEdit,
  write = true,
}: {
  byFloor: { floor: RoomDef["floor"]; rooms: RoomDef[] }[];
  complaints: RoomComplaint[];
  sealedIds: SealedIds;
  onNew: (roomNo: string) => void;
  onEdit: (roomNo: string, existing: RoomComplaint) => void;
  write?: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-3 text-xs">
        <Legend className="bg-danger" label="Emergency" />
        <Legend className="bg-due" label="Moderate" />
        <Legend className="bg-ok" label="Solved" />
        <Legend className="border border-dashed border-border bg-card" label="Empty cube" />
      </div>
      {byFloor.map(({ floor, rooms: floorRooms }) => (
        <Card key={floor}>
          <CardHeader>
            <CardTitle className="text-base">{floor} floor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {floorRooms.map((r) => (
              <CubeLine
                key={r.no}
                place={r.no}
                complaints={complaints}
                sealedIds={sealedIds}
                onNew={onNew}
                onEdit={onEdit}
                write={write}
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desk</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {COMPLAINT_DESKS.map((place) => (
            <CubeLine
              key={place}
              place={place}
              wide
              complaints={complaints}
              sealedIds={sealedIds}
              onNew={onNew}
              onEdit={onEdit}
              write={write}
            />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function CubeLine({
  place,
  wide,
  complaints,
  sealedIds,
  onNew,
  onEdit,
  write = true,
}: {
  place: string;
  wide?: boolean;
  complaints: RoomComplaint[];
  sealedIds: SealedIds;
  onNew: (roomNo: string) => void;
  onEdit: (roomNo: string, existing: RoomComplaint) => void;
  write?: boolean;
}) {
  const items = complaintsForRoom(complaints, place);
  const { trail, slots } = roomCubeLayout(items);
  const hottest = items.find((c) => c.level === "red")
    ? "red"
    : items.find((c) => c.level === "yellow")
      ? "yellow"
      : items.find((c) => c.level === "green")
        ? "green"
        : null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-bg-warm/50 px-2 py-1.5 sm:px-3">
      <span
        className={cn(
          "shrink-0 font-display text-lg font-semibold",
          wide ? "w-28" : "w-10 tabular",
        )}
      >
        {place}
      </span>
      {hottest ? (
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            hottest === "red" && "bg-danger",
            hottest === "yellow" && "bg-due",
            hottest === "green" && "bg-ok",
          )}
        />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-border" />
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {trail.map((c) => (
          <Cube
            key={c.id}
            item={c}
            size="sm"
            frozen={isSealed(sealedIds, sealKey.complaint(c.id))}
            onClick={() => onEdit(place, c)}
          />
        ))}
        {slots.map((item, i) =>
          item ? (
            <Cube
              key={item.id}
              item={item}
              size="md"
              frozen={isSealed(sealedIds, sealKey.complaint(item.id))}
              onClick={() => onEdit(place, item)}
            />
          ) : write ? (
            <button
              key={`${place}-empty-${i}`}
              type="button"
              onClick={() => onNew(place)}
              aria-label={`Add complaint for ${complaintPlaceLabel(place)}`}
              className="grid size-11 place-items-center rounded-md border border-dashed border-border bg-card text-lg leading-none text-muted hover:border-primary hover:text-primary"
            >
              +
            </button>
          ) : null,
        )}
      </div>
    </div>
  );
}

function ComplaintList({
  rooms,
  complaints,
}: {
  rooms: RoomDef[];
  complaints: RoomComplaint[];
}) {
  const hotel = useLedger((s) => s.hotel);
  const [kind, setKind] = useState<ComplaintListKind>("all");
  const [pdfBusy, setPdfBusy] = useState(false);
  const rows = useMemo(
    () => sortComplaints(filterComplaints(complaints, kind), rooms),
    [complaints, kind, rooms],
  );

  function printList() {
    toast.message("Opening print…");
    printComplaintList({
      hotel: hotel.name,
      place: hotel.place,
      kind,
      rows,
      rooms,
    });
  }

  async function savePdf() {
    setPdfBusy(true);
    try {
      const blob = await complaintListPdf({
        hotel: hotel.name,
        place: hotel.place,
        kind,
        rows,
        rooms,
      });
      downloadComplaintPdf(blob, kind);
      toast.success("PDF saved");
    } catch {
      toast.error("PDF failed");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap gap-1.5">
          {COMPLAINT_LIST_KIND.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              size="sm"
              variant={kind === opt.id ? "default" : "outline"}
              onClick={() => setKind(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={printList}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button type="button" onClick={() => void savePdf()} disabled={pdfBusy}>
            <FileDown className="size-4" />
            {pdfBusy ? "PDF…" : "PDF"}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {kind === "open"
              ? "Open complaints"
              : kind === "solved"
                ? "Solved complaints"
                : "All complaints"}
          </CardTitle>
          <p className="text-sm text-muted">
            {rows.length} {rows.length === 1 ? "entry" : "entries"} · room, problem, status, by
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Problem</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">By</th>
                <th className="px-5 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-border/70">
                    <td className="px-5 py-2 font-medium tabular">{c.roomNo}</td>
                    <td className="px-3 py-2">{c.note || "—"}</td>
                    <td className="px-3 py-2">{complaintStatus(c.level)}</td>
                    <td className="px-3 py-2">{c.by || "—"}</td>
                    <td className="px-5 py-2 tabular text-muted">
                      {c.createdAt ? formatDayShort(c.createdAt) : ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-muted" colSpan={5}>
                    No complaints in this list
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Cube({
  item,
  size,
  frozen,
  onClick,
}: {
  item: RoomComplaint;
  size: "sm" | "md";
  frozen?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${item.note}${item.createdAt ? ` · ${formatDayShort(item.createdAt)}` : ""}${frozen ? " · saved" : ""}`}
      className={cn(
        "shrink-0 rounded-md text-left",
        LEVEL_FACE[item.level],
        size === "sm" ? "size-7" : "size-11 p-1",
        frozen && "cursor-default opacity-90",
      )}
    >
      {size === "md" ? (
        <span className="block truncate text-[10px] font-medium leading-tight">
          {item.note || "—"}
        </span>
      ) : null}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular",
          tone === "danger" && value > 0 && "text-danger",
        )}
      >
        {value}
      </div>
    </Card>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className={cn("size-3 rounded-sm", className)} />
      {label}
    </span>
  );
}
