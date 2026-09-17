import { format, parseISO } from "date-fns";
import type { CSSProperties, ReactNode } from "react";
import { buildDayTake } from "@/lib/day-report";
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

function byMode(rows: { mode: PayMode; amount: number }[], mode: PayMode) {
  return rows.filter((r) => r.mode === mode).reduce((s, r) => s + r.amount, 0);
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

function TwoCol({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        marginTop: 4,
      }}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function EmptyLine() {
  return (
    <div
      style={{
        padding: "8px 2px",
        borderBottom: "1px solid #eadfcd",
        color: "#6f675c",
        fontSize: 12,
      }}
    >
      —
    </div>
  );
}

function ItemRow({
  left,
  amount,
}: {
  left: ReactNode;
  amount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        padding: "7px 2px",
        borderBottom: "1px solid #eadfcd",
        fontSize: 12,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {left}
      </span>
      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
        {rupee(amount)}
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
const num: CSSProperties = {
  ...td,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

function cellAmt(n: number) {
  return n ? rupee(n) : "—";
}

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
  const cashRecv = byMode(receipts, "CASH");
  const qrsRecv = byMode(receipts, "QRS");
  const pkRecv = byMode(receipts, "QRPK");
  const onRecv = byMode(receipts, "ONLINE");
  const qrRooms = take.santosh.rooms + take.pk.rooms;
  const qrFood = take.santosh.food + take.pk.food;
  const qrWs = take.santosh.ws + take.pk.ws;
  const qrRecv = qrsRecv + pkRecv;
  const cashIn =
    take.cash.rooms + take.cash.food + take.cash.ws + cashRecv;
  const qrIn = qrRooms + qrFood + qrWs + qrRecv;
  const onIn =
    take.online.rooms + take.online.food + take.online.ws + onRecv;
  const payRows: { label: string; cash: number; qr: number; online: number }[] = [
    { label: "Room sale", cash: take.cash.rooms, qr: qrRooms, online: take.online.rooms },
    { label: "Food", cash: take.cash.food, qr: qrFood, online: take.online.food },
    { label: "WS", cash: take.cash.ws, qr: qrWs, online: take.online.ws },
    { label: "Balance received", cash: cashRecv, qr: qrRecv, online: onRecv },
  ];
  const payTotal = {
    cash: cashIn,
    qr: qrIn,
    online: onIn,
    all: cashIn + qrIn + onIn,
  };

  return (
    <div
      id="day-chart"
      className="day-chart"
      style={{
        background: "#f7f1e6",
        color: "#1a1a1a",
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
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
          Detailed daily · {longDay(date)}
        </div>
        <div style={{ marginTop: 4, fontSize: 12 }}>
          {sept(date)} 11:00 AM — {sept(next)} 11:00 AM
        </div>
        <div style={{ marginTop: 3, fontSize: 11, color: "#6f675c" }}>
          Same layout as Daily register · {guests.length} posting
          {guests.length === 1 ? "" : "s"}
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
          <span>Posting total</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {rupee(take.roomsTotal)}
          </span>
        </div>
      </Section>

      <TwoCol
        left={
          <Section title="Food">
            {food.length === 0 ? (
              <EmptyLine />
            ) : (
              food.map((f) => (
                <ItemRow
                  key={f.id}
                  left={<Pill mode={f.mode} />}
                  amount={f.amount}
                />
              ))
            )}
          </Section>
        }
        right={
          <Section title="WS">
            {ws.length === 0 ? (
              <EmptyLine />
            ) : (
              ws.map((w) => (
                <ItemRow
                  key={w.id}
                  left={<Pill mode={w.mode} />}
                  amount={w.amount}
                />
              ))
            )}
          </Section>
        }
      />

      <Section title="Expenses">
        {expenses.length === 0 ? (
          <EmptyLine />
        ) : (
          expenses.map((e) => (
            <ItemRow
              key={e.id}
              left={
                <>
                  <span style={{ fontWeight: 600 }}>{e.particular}</span>
                  <Pill mode={e.mode} />
                </>
              }
              amount={e.amount}
            />
          ))
        )}
      </Section>

      <TwoCol
        left={
          <Section title="Balance received · source">
            {due.length === 0 ? (
              <EmptyLine />
            ) : (
              due.map((r) => (
                <ItemRow
                  key={r.id}
                  left={
                    <>
                      <span style={{ fontWeight: 600 }}>{r.particular}</span>
                      <Pill mode={r.mode} />
                    </>
                  }
                  amount={r.amount}
                />
              ))
            )}
          </Section>
        }
        right={
          <Section title="Fab / Bravistay">
            {ota.length === 0 ? (
              <EmptyLine />
            ) : (
              ota.map((r) => (
                <ItemRow
                  key={r.id}
                  left={
                    <>
                      <span style={{ fontWeight: 600 }}>{r.particular}</span>
                      <Pill mode={r.mode} />
                    </>
                  }
                  amount={r.amount}
                />
              ))
            )}
          </Section>
        }
      />

      <Section title="Payment in">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Particular</th>
              <th style={{ ...th, textAlign: "right" }}>Cash</th>
              <th style={{ ...th, textAlign: "right" }}>QR</th>
              <th style={{ ...th, textAlign: "right" }}>Online</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {payRows.map((row) => (
              <tr key={row.label}>
                <td style={td}>{row.label}</td>
                <td style={num}>{cellAmt(row.cash)}</td>
                <td style={num}>{cellAmt(row.qr)}</td>
                <td style={num}>{cellAmt(row.online)}</td>
                <td style={{ ...num, fontWeight: 700 }}>
                  {cellAmt(row.cash + row.qr + row.online)}
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, fontWeight: 800 }}>Total</td>
              <td style={{ ...num, fontWeight: 800 }}>{rupee(payTotal.cash)}</td>
              <td style={{ ...num, fontWeight: 800 }}>{rupee(payTotal.qr)}</td>
              <td style={{ ...num, fontWeight: 800 }}>{cellAmt(payTotal.online)}</td>
              <td style={{ ...num, fontWeight: 800 }}>{rupee(payTotal.all)}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: "#6f675c", marginTop: 8 }}>
          Cash in today {rupee(payTotal.cash)} · QR is Santosh QR + P.K. QR · Fab /
          Bravistay sits in QR (P.K.).
        </p>
      </Section>
    </div>
  );
}
