import type { CSSProperties, ReactNode } from "react";
import { format, parseISO } from "date-fns";
import type { DayBooks, GuestEntry, NamedAmount } from "@/lib/types";
import type { DayTake } from "@/lib/day-report";
import { publicUrl } from "@/lib/public-url";

function n(v: number) {
  return Math.round(v).toLocaleString("en-IN");
}

function sheetDate(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM/yy");
  } catch {
    return iso;
  }
}

function isRoomNo(s: string) {
  return /^\d{1,4}[A-Z]?$/i.test(s.trim());
}

function roomsFor(
  recs: { particular: string }[],
  guests: GuestEntry[],
) {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const t = raw.trim();
    if (!isRoomNo(t)) return;
    const k = t.replace(/^0+/, "") || t;
    if (seen.has(k.toUpperCase())) return;
    seen.add(k.toUpperCase());
    out.push(t);
  };
  for (const r of recs) {
    const p = r.particular.trim();
    if (!p) continue;
    if (isRoomNo(p)) add(p);
    const key = p.toUpperCase();
    for (const g of guests) {
      const src = (g.source ?? "").trim().toUpperCase();
      const name = g.name.trim().toUpperCase();
      if (src === key || name === key) add(g.roomNo);
    }
  }
  return out.length ? ` (${out.join(",")})` : "";
}

const SIZE = { fs: 12.5, pad: "5px 8px", head: 13, title: 24 };

const B = "2px solid #000";
const FRAME = "4px solid #000";
const SPLIT = "3px solid #000";
const BODY = '"Cinzel", "Times New Roman", Times, Georgia, serif';
const DISPLAY = '"Cinzel Decorative", Algerian, "Times New Roman", serif';

const fill = {
  ob: "#f4c430",
  ok: "#548235",
  bad: "#c00000",
  sub: "#efe8d8",
};

function Row({
  label,
  sign,
  value,
  tone,
}: {
  label: string;
  sign?: "+" | "−" | "";
  value?: number;
  tone?: "ob" | "ok" | "bad" | "sub";
}) {
  const bg =
    tone === "ob"
      ? fill.ob
      : tone === "ok"
        ? fill.ok
        : tone === "bad"
          ? fill.bad
          : tone === "sub"
            ? fill.sub
            : "transparent";
  const color = tone === "ok" || tone === "bad" ? "#fff" : "#111";
  const cell: CSSProperties = {
    border: B,
    padding: SIZE.pad,
    fontSize: SIZE.fs,
    fontWeight: 700,
    fontFamily: BODY,
  };
  return (
    <tr>
      <td
        style={{
          ...cell,
          background: tone === "sub" ? fill.sub : "transparent",
        }}
      >
        {label}
      </td>
      <td
        style={{
          ...cell,
          textAlign: "center",
          width: 32,
          color: "#222",
        }}
      >
        {sign ?? ""}
      </td>
      <td
        style={{
          ...cell,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          background: bg,
          color,
          minWidth: 92,
        }}
      >
        {n(value ?? 0)}
      </td>
    </tr>
  );
}

function BlockTitle({ children }: { children: string }) {
  return (
    <tr>
      <td
        colSpan={3}
        style={{
          border: B,
          padding: "8px 8px",
          textAlign: "center",
          fontWeight: 900,
          letterSpacing: "0.16em",
          fontSize: 14,
          fontFamily: DISPLAY,
          background: "#f3ead4",
          color: "#111",
          textDecoration: "underline",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        {children}
      </td>
    </tr>
  );
}

function MiniTable({ children }: { children: ReactNode }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: B,
        fontFamily: BODY,
      }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

function Block({ children, last }: { children: ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        padding: "8px 6px",
        borderBottom: last ? undefined : SPLIT,
        background: "#fff",
      }}
    >
      {children}
    </div>
  );
}

export function DailyA4({
  hotel,
  blessing,
  date,
  books,
  take,
  expenses,
  receipts,
  guests,
}: {
  hotel: string;
  blessing: string;
  date: string;
  books: DayBooks | undefined;
  take: DayTake;
  expenses: NamedAmount[];
  receipts: NamedAmount[];
  guests: GuestEntry[];
}) {
  const c = books?.cashBook;
  const s = books?.santosh;
  const pk = books?.pk;
  const o = books?.online;
  const b = books?.outstanding;
  const cashRec = receipts.filter((r) => r.mode === "CASH");
  const qrRec = receipts.filter((r) => r.mode === "QRS");
  const pkRec = receipts.filter((r) => r.mode === "QRPK");
  const onRec = receipts.filter((r) => r.mode === "ONLINE");
  const cashExp = expenses.filter((e) => e.mode === "CASH");
  const qrExp = expenses.filter((e) => e.mode === "QRS");
  const pkExp = expenses.filter((e) => e.mode === "QRPK");
  const rooms = take.balanceRooms.join(",");
  const balTag = rooms ? `BAL (${rooms})` : "BAL";
  const cashRooms = roomsFor(cashRec, guests);
  const qrRooms = roomsFor(qrRec, guests);
  const pkRooms = roomsFor(pkRec, guests);
  const onRooms = roomsFor(onRec, guests);
  const dueRooms = roomsFor([...qrRec, ...cashRec, ...pkRec], guests);
  const santoshSub =
    (s?.ob ?? 0) + (s?.salesQr ?? 0) + (s?.foodQr ?? 0) + (s?.other ?? 0);
  const pkSub =
    (pk?.ob ?? 0) + (pk?.salesQr ?? 0) + (pk?.foodQr ?? 0) + (pk?.other ?? 0);
  const dueAfterRecv = (b?.ob ?? 0) - (b?.balReceived ?? 0);

  return (
    <div
      id="daily-a4"
      className="daily-a4"
      style={{
        background: "#fff",
        color: "#111",
        border: FRAME,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: BODY,
        minHeight: "277mm",
        display: "flex",
        flexDirection: "column",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <div
        className="daily-a4-head"
        style={{
          padding: "10px 14px",
          borderBottom: B,
          background: "#14352c",
          color: "#f4efe4",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <img
            src={publicUrl("logo.png?v=2")}
            alt=""
            style={{
              height: 58,
              width: "auto",
              flexShrink: 0,
              objectFit: "contain",
            }}
          />
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: SIZE.title,
                letterSpacing: "0.14em",
                lineHeight: 1.15,
                color: "#f4c430",
              }}
            >
              {hotel.toUpperCase()}
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: SIZE.fs,
                letterSpacing: "0.1em",
                textDecoration: "underline",
              }}
            >
              {blessing.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: SIZE.fs,
              whiteSpace: "nowrap",
            }}
          >
            DATE : {sheetDate(date)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: SPLIT,
          }}
        >
          <Block>
            <MiniTable>
            <BlockTitle>CASH BALANCE</BlockTitle>
            <Row label="O/B" value={c?.ob ?? 0} tone="ob" />
            <Row label="SALES" sign="+" value={c?.sales ?? 0} />
            <Row label="FOOD" sign="+" value={c?.food ?? 0} />
            <Row label="WS" sign="+" value={c?.ws ?? 0} />
            <Row
              label={`BAL RECEI${cashRooms}`}
              sign="+"
              value={c?.balReceived ?? 0}
            />
            <Row label="TOTAL" value={c?.gross ?? 0} tone="sub" />
            <Row label="EXP" sign="−" value={c?.exp ?? 0} />
            <Row label="QR" sign="−" value={c?.qr ?? 0} />
            <Row label="ONLINE" sign="−" value={c?.online ?? 0} />
            <Row label={balTag} sign="−" value={c?.balance ?? 0} />
            <Row label="TOTAL" value={c?.cb ?? 0} tone="ok" />
            </MiniTable>
          </Block>

          <Block>
            <MiniTable>
            <BlockTitle>EXPENSES</BlockTitle>
            {cashExp.map((e) => (
              <Row
                key={e.id}
                label={e.particular.toUpperCase()}
                value={e.amount}
              />
            ))}
            <Row
              label="TOTAL"
              value={cashExp.reduce((sum, e) => sum + e.amount, 0)}
              tone="bad"
            />
            </MiniTable>
          </Block>

          <Block last>
            <MiniTable>
            <BlockTitle>BALANCE AMOUNT</BlockTitle>
            <Row label="O/B" value={b?.ob ?? 0} tone="ob" />
            <Row
              label={`BAL RECEI${dueRooms}`}
              sign="−"
              value={b?.balReceived ?? 0}
            />
            <Row label="TOTAL" value={dueAfterRecv} tone="sub" />
            <Row label={balTag} sign="+" value={b?.sales ?? 0} />
            <Row label="TOTAL" value={b?.cb ?? 0} tone="ok" />
            <tr>
              <td
                colSpan={3}
                style={{
                  border: B,
                  padding: SIZE.pad,
                  fontSize: SIZE.fs,
                  fontWeight: 700,
                  fontFamily: BODY,
                  minHeight: 28,
                }}
              >
                {rooms ? `BAL (${rooms})` : ""}
              </td>
            </tr>
            </MiniTable>
          </Block>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <Block>
            <MiniTable>
            <BlockTitle>SANTOSH QR</BlockTitle>
            <Row label="O/B" value={s?.ob ?? 0} tone="ob" />
            <Row label="SALES" sign="+" value={s?.salesQr ?? 0} />
            <Row label="FOOD / WS" sign="+" value={s?.foodQr ?? 0} />
            <Row
              label={`BAL RECEI${qrRooms}`}
              sign="+"
              value={s?.other ?? 0}
            />
            <Row label="TOTAL" value={santoshSub} tone="sub" />
            {qrExp.length
              ? qrExp.map((e) => (
                  <Row
                    key={e.id}
                    label={e.particular.toUpperCase()}
                    sign="−"
                    value={e.amount}
                  />
                ))
              : (
                <Row label="EXP" sign="−" value={s?.exp ?? 0} />
              )}
            <Row label="TOTAL" value={s?.cb ?? 0} tone="ok" />
            </MiniTable>
          </Block>

          <Block>
            <MiniTable>
            <BlockTitle>P.K QR</BlockTitle>
            <Row label="O/B" value={pk?.ob ?? 0} tone="ob" />
            <Row label="SALES" sign="+" value={pk?.salesQr ?? 0} />
            <Row label="FOOD / WS" sign="+" value={pk?.foodQr ?? 0} />
            <Row
              label={`BAL RECEI${pkRooms}`}
              sign="+"
              value={pk?.other ?? 0}
            />
            <Row label="TOTAL" value={pkSub} tone="sub" />
            {pkExp.length
              ? pkExp.map((e) => (
                  <Row
                    key={e.id}
                    label={e.particular.toUpperCase()}
                    sign="−"
                    value={e.amount}
                  />
                ))
              : (
                <Row label="EXP" sign="−" value={pk?.exp ?? 0} />
              )}
            <Row label="TOTAL" value={pk?.cb ?? 0} tone="ok" />
            </MiniTable>
          </Block>

          <Block last>
            <MiniTable>
            <BlockTitle>ONLINE</BlockTitle>
            <Row label="O/B" value={o?.ob ?? 0} tone="ob" />
            <Row label="SALES" sign="+" value={o?.sales ?? 0} />
            <Row
              label={`BAL RECEI${onRooms}`}
              sign="−"
              value={o?.balReceived ?? 0}
            />
            <Row label="TOTAL" value={o?.cb ?? 0} tone="ok" />
            </MiniTable>
          </Block>
        </div>
      </div>
    </div>
  );
}