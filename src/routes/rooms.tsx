import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODE_SHORT, money, normRoom } from "@/lib/format";
import { useLedger } from "@/lib/store";
import type { GuestEntry, RoomDef } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms")({ component: RoomsPage });

const FLOORS: RoomDef["floor"][] = ["Ground", "First", "Second", "Third"];

function RoomsPage() {
  const date = useLedger((s) => s.selectedDate);
  const rooms = useLedger((s) => s.rooms);
  const allGuests = useLedger((s) => s.guests);
  const guests = allGuests.filter((g) => g.date === date);
  const byRoom = new Map<string, GuestEntry[]>();
  for (const g of guests) {
    const key = normRoom(g.roomNo);
    const list = byRoom.get(key) ?? [];
    list.push(g);
    byRoom.set(key, list);
  }
  const occupied = rooms.filter((r) => (byRoom.get(normRoom(r.no)) ?? []).length).length;
  const vacant = rooms.length - occupied;
  const due = guests.filter((g) => g.mode === "BALANCE").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          House status
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Room board
        </h1>
        <p className="mt-1 text-sm text-muted">
          {occupied} occupied · {vacant} vacant · {due} on balance
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend swatch="bg-primary" label="Occupied" />
        <Legend swatch="bg-due" label="Balance due" />
        <Legend swatch="bg-bg-warm ring-1 ring-border" label="Vacant" />
      </div>

      {FLOORS.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        const floorOcc = floorRooms.filter(
          (r) => (byRoom.get(normRoom(r.no)) ?? []).length,
        ).length;
        return (
          <Card key={floor}>
            <CardHeader>
              <CardTitle className="text-base">
                {floor} floor
                <span className="ml-2 text-sm font-normal text-muted">
                  {floorOcc} / {floorRooms.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {floorRooms.map((r) => {
                const occ = byRoom.get(normRoom(r.no)) ?? [];
                const dueHere = occ.some((g) => g.mode === "BALANCE");
                return (
                  <div
                    key={r.no}
                    className={cn(
                      "rounded-lg p-3",
                      occ.length === 0 && "bg-bg-warm",
                      occ.length > 0 && !dueHere && "bg-primary text-primary-fg",
                      dueHere && "bg-due text-primary-fg",
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-xl font-semibold tabular">
                        {r.no}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-wide",
                          occ.length ? "opacity-80" : "text-muted",
                        )}
                      >
                        {occ.length ? "In" : "Vacant"}
                      </div>
                    </div>
                    {occ.length > 0 ? (
                      <div className="mt-2 space-y-1.5">
                        {occ.map((g) => (
                          <div key={g.id} className="min-w-0">
                            <div className="truncate text-xs font-medium">{g.name}</div>
                            <div className="flex items-center justify-between gap-2 text-[11px] opacity-80">
                              <span className="tabular">{money(g.amount)}</span>
                              <span className="uppercase tracking-wide">
                                {MODE_SHORT[g.mode]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-muted">Ready</div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span className={cn("size-3 rounded-sm", swatch)} />
      {label}
    </span>
  );
}
