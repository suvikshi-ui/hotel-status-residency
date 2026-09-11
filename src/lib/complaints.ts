import { uid } from "./format";

export type ComplaintLevel = "red" | "yellow" | "green";

export interface RoomComplaint {
  id: string;
  roomNo: string;
  note: string;
  level: ComplaintLevel;
  createdAt: string;
}

export const COMPLAINT_LEVELS: {
  id: ComplaintLevel;
  label: string;
  hint: string;
}[] = [
  { id: "red", label: "Emergency", hint: "Fix now" },
  { id: "yellow", label: "Moderate", hint: "Keep watching" },
  { id: "green", label: "Solved", hint: "Closed" },
];

const LIVE = 2;
export const FRONT_SLOTS = 3;

export function emptyComplaint(roomNo: string, level: ComplaintLevel, note: string): RoomComplaint {
  return {
    id: uid("c"),
    roomNo,
    note: note.trim(),
    level,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export function normalizeComplaints(rows: RoomComplaint[] | undefined): RoomComplaint[] {
  return (rows ?? [])
    .filter((r) => r && typeof r.roomNo === "string" && r.roomNo.trim())
    .map((r) => ({
      id: r.id || uid("c"),
      roomNo: r.roomNo.trim(),
      note: (r.note ?? "").trim(),
      level: r.level === "red" || r.level === "green" ? r.level : "yellow",
      createdAt: (r.createdAt ?? "").slice(0, 10),
    }));
}

export function complaintsForRoom(rows: RoomComplaint[], roomNo: string) {
  return rows.filter((r) => r.roomNo === roomNo);
}

/** Older cubes shrink; the last two stay full-size with one empty cube in front. */
export function roomCubeLayout(items: RoomComplaint[]) {
  if (items.length <= LIVE) {
    const slots: (RoomComplaint | null)[] = [...items];
    while (slots.length < FRONT_SLOTS) slots.push(null);
    return { trail: [] as RoomComplaint[], slots };
  }
  return {
    trail: items.slice(0, items.length - LIVE),
    slots: [...items.slice(items.length - LIVE), null] as (RoomComplaint | null)[],
  };
}

export function demoComplaints(): RoomComplaint[] {
  return [
    {
      id: "c-demo-101-1",
      roomNo: "101",
      note: "AC not cooling",
      level: "red",
      createdAt: "2026-09-09",
    },
    {
      id: "c-demo-101-2",
      roomNo: "101",
      note: "Tap dripping",
      level: "yellow",
      createdAt: "2026-09-10",
    },
    {
      id: "c-demo-101-3",
      roomNo: "101",
      note: "TV remote missing",
      level: "green",
      createdAt: "2026-09-11",
    },
    {
      id: "c-demo-210-1",
      roomNo: "210",
      note: "Geyser not heating",
      level: "red",
      createdAt: "2026-09-11",
    },
    {
      id: "c-demo-105-1",
      roomNo: "105",
      note: "Door lock sticky",
      level: "yellow",
      createdAt: "2026-09-11",
    },
  ];
}
