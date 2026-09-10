import { format, parseISO } from "date-fns";
import type { CSSProperties, ReactNode } from "react";
import { buildDayTake } from "@/lib/day-report";
import { MODE_SHORT } from "@/lib/format";
import { publicUrl } from "@/lib/public-url";
import { addDaysIso, stayDates } from "@/lib/stay";
import type {
  DayBooks,
  GuestEntry,
  ModeAmount,
  NamedAmount,
  PayMode,
} from "@/lib/types";

function rupee(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function sept(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy").replace("Sep", "Sept");
}

function longDay(iso: string) {
  return format(parseISO(iso), "EEEE, d MMMM yyyy");
}

function padRoom(n: string) {
  const t = n.trim();
  return /^\d+$/.test(t) ? t.padStart(3, "0") : t;
}

function sum(rows: { amount: number }[]) {
  return rows.reduce((s, r) => s + r.amount, 0);
}

const PILL: Record<PayMode, { bg: string; fg: string; label: string }> = {
  CASH: { bg: "#d8efe4", fg: "#1f6b4a", label: "CASH" },
  QRS: { bg: "#d8efe4", fg: "#1f6b4a", label: "QRS" },
  QRPK: { bg: "#dce8f5", fg: "#2c5282", label: "QRPK" },
  ONLINE: { bg: "#ece8e0", fg: "#5c574e", label: "ONLINE" },
  BALANCE: { bg: "#f3e4c8", fg: "#8a5a22", label: "BALANCE" },
};

function Pill({ mode }: { mode: PayMode }) {
  const p = PILL[mode];
  return (
    <span
      style={{
        display: "inline-block",
        background: p.bg,
        color: p.fg,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      {p.label}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#6f675c",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  sign,
}: {
  label: string;
  value: number;
  strong?: boolean;
  sign?: "+" | "−" | "";
}) {
  const show = sign ? (sign === "−" ? -Math.abs(value) : value) : value;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 2px",
        borderBottom: strong ? "1px solid #1a1a1a" : "1px solid #eadfcd",
        fontWeight: strong ? 700 : 400,
        fontSize: strong ? 13 : 12,
      }}
    >
      <span>{label}</span>
      <span className="tabular" style={{ fontVariantNumeric: "tabular-nums" }}>
        {sign === "−"
          ? `−${rupee(Math.abs(value))}`
          : sign === "+"
            ? rupee(value)
            : rupee(show)}
      </span>
    </div>
  );
}

const th: CSSProperties = {
  textAlign: "left",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6f675c",
  padding: "7px 8px",
  borderBottom: "1px solid #eadfcd",
};
const td: CSSProperties = {
  padding: "8px 8px",
  borderBottom: "1px solid #eadfcd",
  verticalAlign: "top",
  fontSize: 12,
};

export function DayChart({
  hotel,
  blessing,
  date,
  guests,
  allGuests,
  food,
  ws,
  expenses,
  receipts,
  books,
}: {
  hotel: string;
  blessing: string;
  date: string;
  guests: GuestEntry[];
  allGuests: GuestEntry[];
  food: ModeAmount[];
  ws: ModeAmount[];
  expenses: NamedAmount[];
  receipts: NamedAmount[];
  books?: DayBooks;
}) {
  const next = addDaysIso(date, 1);
  const take = buildDayTake(guests, food, ws);
  const due = receipts.filter((r) => r.kind !== "ota");
  const ota = receipts.filter((r) => r.kind === "ota");
  const recvQrs = sum(due.filter((r) => r.mode === "QRS"));
  const recvPk = sum(due.filter((r) => r.mode === "QRPK"));
  const cashExp = sum(expenses.filter((e) => e.mode === "CASH"));
  const qrExp = sum(expenses.filter((e) => e.mode === "QRS"));
  const pkExp = sum(expenses.filter((e) => e.mode === "QRPK"));
  const qrsIn =
    take.santosh.rooms + take.santosh.food + take.santosh.ws + recvQrs;
  const pkIn = take.pk.rooms + take.pk.food + take.pk.ws + recvPk;
  const otaIn = sum(ota);
  const onlineIn = take.online.rooms + take.online.food + take.online.ws;
  const allRecv = sum(due);
  const cashOb = books?.cashBook.ob ?? 0;
  const qrOb = books?.santosh.ob ?? 0;
  const pkOb = books?.pk.ob ?? 0;
  const onOb = books?.online.ob ?? 0;
  const balOb = books?.outstanding.ob ?? 0;
  const cashCb =
    cashOb +
    take.roomsTotal +
    take.foodTotal +
    take.wsTotal +
    allRecv -
    cashExp -
    qrsIn -
    (pkIn + otaIn) -
    onlineIn -
    take.due.rooms;
  const qrCb = qrOb + qrsIn - qrExp;
  const pkCb = pkOb + pkIn + otaIn - pkExp;
  const onCb = onOb + take.online.rooms - otaIn;
  const balCb = balOb + take.due.rooms - allRecv;
  const rooms = guests.map((g) => padRoom(g.roomNo));

  const modes: PayMode[] = ["CASH", "QRS", "QRPK", "ONLINE", "BALANCE"];
  const slice = (m: PayMode) => {
    const roomsAmt = guests.filter((g) => g.mode === m).reduce((s, g) => s + g.amount, 0);
    const foodAmt = food.filter((f) => f.mode === m).reduce((s, f) => s + f.amount, 0);
    const wsAmt = ws.filter((w) => w.mode === m).reduce((s, w) => s + w.amount, 0);
    return { roomsAmt, foodAmt, wsAmt, total: roomsAmt + foodAmt + wsAmt };
  };

  return (
    <div
      id="day-chart"
      className="day-chart"
      style={{
        background: "#f7f1e6",
        color: "#1a1a1a",
        fontFamily:
          'Georgia, "Times New Roman", Times, serif',
        padding: "18px 20px 28px",
        border: "1px solid #e2d6c2",
      }}
    >
      <div style={{ textAlign: "center", paddingBottom: 14, borderBottom: "1px solid #eadfcd" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <img src={publicUrl("logo.png?v=2")} alt="" style={{ height: 48, width: "auto" }} />
          <div
            style={{
              fontFamily: '"Cinzel Decorative", Algerian, Georgia, serif',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {hotel}
          </div>
          <img src={publicUrl("logo.png?v=2")} alt="" style={{ height: 48, width: "auto" }} />
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#6f675c" }}>{blessing}</div>
        <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>
          Day chart · {longDay(date)}
        </div>
        <div style={{ marginTop: 4, fontSize: 12 }}>
          {sept(date)} 11:00 AM — {sept(next)} 11:00 AM
        </div>
        <div style={{ marginTop: 3, fontSize: 11, color: "#6f675c" }}>
          Check-in 11:00 AM · Check-out 11:00 AM · {guests.length} rooms · due{" "}
          {sept(next)} 11:00 AM
        </div>
      </div>

      <Section title="Guest register">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "Name", "Room", "Mode", "Amount", "Time", "Check-in", "C.O", "Source"].map(
                (h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => {
              const dates = stayDates(allGuests, g);
              const cin = dates.checkIn;
              const cout = dates.checkOut || next;
              return (
                <tr key={g.id}>
                  <td style={{ ...td, color: "#6f675c" }}>{g.slNo}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{g.name.toUpperCase()}</td>
                  <td style={td}>{padRoom(g.roomNo)}</td>
                  <td style={td}>
                    <Pill mode={g.mode} />
                  </td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                    {rupee(g.amount)}
                  </td>
                  <td style={{ ...td, color: "#6f675c", whiteSpace: "nowrap" }}>
                    {g.time || "—"}
                  </td>
                  <td style={{ ...td, fontSize: 11, color: "#6f675c" }}>
                    {sept(cin)}
                    <br />
                    {g.inTime || "11:00 AM"}
                  </td>
                  <td style={{ ...td, fontSize: 11, color: "#6f675c" }}>
                    {sept(cout)}
                    <br />
                    {g.outTime || "11:00 AM"}
                  </td>
                  <td style={td}>{g.source || "—"}</td>
                </tr>
              );
            })}
            {guests.length === 0 ? (
              <tr>
                <td style={td} colSpan={9}>
                  —
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 8px 0",
            fontWeight: 700,
          }}
        >
          <span>Sale total</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {rupee(take.roomsTotal)}
          </span>
        </div>
      </Section>

      <Section title="Food">
        <SimpleList
          rows={food.map((f) => ({
            label: MODE_SHORT[f.mode] === "QR" ? "QRS" : MODE_SHORT[f.mode] === "Cash" ? "Cash" : MODE_SHORT[f.mode],
            amount: f.amount,
          }))}
          total={take.foodTotal}
        />
      </Section>

      <Section title="WS">
        <SimpleList
          rows={ws.map((f) => ({
            label: MODE_SHORT[f.mode] === "QR" ? "QRS" : MODE_SHORT[f.mode],
            amount: f.amount,
          }))}
          total={take.wsTotal}
        />
      </Section>

      <Section title="Balance received">
        <SimpleList
          rows={due.map((r) => ({
            label: `${r.particular} · ${PILL[r.mode].label}`,
            amount: r.amount,
          }))}
          total={allRecv}
        />
      </Section>

      <Section title="Expenses">
        <SimpleList
          rows={expenses.map((e) => ({
            label: `${e.particular} · ${PILL[e.mode].label}`,
            amount: e.amount,
          }))}
          total={sum(expenses)}
        />
      </Section>

      <Section title="By mode">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th} />
              <th style={{ ...th, textAlign: "right" }}>Sale</th>
              <th style={{ ...th, textAlign: "right" }}>Food</th>
              <th style={{ ...th, textAlign: "right" }}>WS</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => {
              const s = slice(m);
              return (
                <tr key={m}>
                  <td style={td}>
                    <Pill mode={m} />
                  </td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {s.roomsAmt ? rupee(s.roomsAmt) : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {s.foodAmt ? rupee(s.foodAmt) : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {s.wsAmt ? rupee(s.wsAmt) : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                    {s.total ? rupee(s.total) : "—"}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...td, fontWeight: 700 }}>Total</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {rupee(take.roomsTotal)}
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {rupee(take.foodTotal)}
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {take.wsTotal ? rupee(take.wsTotal) : "—"}
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {rupee(take.roomsTotal + take.foodTotal + take.wsTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <div style={{ textAlign: "center", marginTop: 28, marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Daily balance sheet</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {sept(date)} 11:00 AM — {sept(next)} 11:00 AM
        </div>
        <div style={{ fontSize: 11, color: "#6f675c", marginTop: 4 }}>
          Rooms on chart: {rooms.join(", ") || "—"}
        </div>
      </div>

      <Section title="Cash">
        <Line label="O/B" value={cashOb} />
        <Line label="Sales +" value={take.roomsTotal} sign="+" />
        <Line label="Food +" value={take.foodTotal} sign="+" />
        <Line label="WS +" value={take.wsTotal} sign="+" />
        <Line label="Bal received +" value={allRecv} sign="+" />
        <Line label="Exp −" value={cashExp} sign="−" />
        <Line label="QRS −" value={qrsIn} sign="−" />
        <Line label="QRPK −" value={pkIn + otaIn} sign="−" />
        <Line label="Online −" value={onlineIn} sign="−" />
        <Line label="Balance −" value={take.due.rooms} sign="−" />
        <Line label="C/B" value={cashCb} strong />
        <p style={{ fontSize: 11, color: "#6f675c", marginTop: 6 }}>
          Drawer: opening + cash in – cash exp. QR / online / udhaar sales cash book se nikal jaate hain.
        </p>
      </Section>

      <Section title="Santosh QR (QRS)">
        <Line label="O/B" value={qrOb} />
        <Line label="QRS in +" value={qrsIn} sign="+" />
        <Line label="Exp −" value={qrExp} sign="−" />
        <Line label="C/B" value={qrCb} strong />
      </Section>

      <Section title="P.K. QR (QRPK)">
        <Line label="O/B" value={pkOb} />
        <Line label="QRPK in +" value={pkIn} sign="+" />
        <Line label="Fab / Bravistay / Booking +" value={otaIn} sign="+" />
        <Line label="Exp −" value={pkExp} sign="−" />
        <Line label="C/B" value={pkCb} strong />
      </Section>

      <Section title="Online — Bravistay / Fab">
        <Line label="O/B" value={onOb} />
        <Line label="Online in +" value={take.online.rooms} sign="+" />
        <Line label="Fab / Bravistay / Booking −" value={otaIn} sign="−" />
        <Line label="Exp −" value={0} sign="−" />
        <Line label="C/B" value={onCb} strong />
      </Section>

      <Section title="Balance (udhaar)">
        <Line label="O/B" value={balOb} />
        <Line label="New balance +" value={take.due.rooms} sign="+" />
        <Line label="Received −" value={allRecv} sign="−" />
        <Line label="C/B" value={balCb} strong />
        <p style={{ fontSize: 11, color: "#6f675c", marginTop: 6 }}>
          Kal 11:00 pe yeh C/B outstanding O/B banega.
        </p>
      </Section>
    </div>
  );
}

function SimpleList({
  rows,
  total,
}: {
  rows: { label: string; amount: number }[];
  total: number;
}) {
  return (
    <div>
      {rows.length === 0 ? (
        <div
          style={{
            padding: "8px 2px",
            borderBottom: "1px solid #eadfcd",
            color: "#6f675c",
          }}
        >
          —
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={`${r.label}-${i}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 2px",
              borderBottom: "1px solid #eadfcd",
              fontSize: 12,
            }}
          >
            <span>{r.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {rupee(r.amount)}
            </span>
          </div>
        ))
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 2px 0",
          fontWeight: 700,
        }}
      >
        <span>Total</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{rupee(total)}</span>
      </div>
    </div>
  );
}
