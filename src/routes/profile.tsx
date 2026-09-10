import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGate } from "@/components/security-gate";
import { formatDay, money } from "@/lib/format";
import { codeOk, hashCode } from "@/lib/pin";
import { useLedger } from "@/lib/store";
import { HotelLogo } from "@/components/hotel-logo";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const hotel = useLedger((s) => s.hotel);
  const opening = useLedger((s) => s.opening);
  const openingDate = useLedger((s) => s.openingDate);
  const stored = useLedger((s) => s.securityCode);
  const setOpening = useLedger((s) => s.setOpening);
  const setSecurityCode = useLedger((s) => s.setSecurityCode);
  const { gate, hasCode } = useGate();

  const [date, setDate] = useState(openingDate);
  const [cash, setCash] = useState(String(opening.cash));
  const [santosh, setSantosh] = useState(String(opening.santosh));
  const [pk, setPk] = useState(String(opening.pk));
  const [online, setOnline] = useState(String(opening.online));
  const [outstanding, setOutstanding] = useState(String(opening.outstanding));

  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Hotel
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <HotelLogo mark className="h-12 w-auto shrink-0" />
          <p className="text-sm text-muted">
            {hotel.name} · {hotel.place}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opening balance</CardTitle>
          <p className="text-sm text-muted">
            Now from {formatDay(openingDate)}. Books from this date start with
            these figures.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date) {
                toast.error("Pick a date");
                return;
              }
              const n = (v: string) => Number(v);
              const next = {
                cash: n(cash),
                santosh: n(santosh),
                pk: n(pk),
                online: n(online),
                outstanding: n(outstanding),
              };
              if (Object.values(next).some((v) => !Number.isFinite(v))) {
                toast.error("Enter valid amounts");
                return;
              }
              const save = () => {
                setOpening(date, next);
                toast.success(`Opening set from ${formatDay(date)}`);
              };
              gate(save, {
                title: "Are you sure?",
                message: `Set opening balances from ${formatDay(date)}? Books will rebuild from this date.`,
                confirmLabel: "Save",
              });
            }}
          >
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ob-date">From date</Label>
              <Input
                id="ob-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {(
              [
                ["Cash", cash, setCash],
                ["Santosh QR", santosh, setSantosh],
                ["P.K. QR", pk, setPk],
                ["Online", online, setOnline],
                ["Outstanding / Balance", outstanding, setOutstanding],
              ] as const
            ).map(([label, value, set]) => (
              <div key={label} className="grid gap-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">Save opening</Button>
            </div>
          </form>
          <p className="mt-4 text-xs text-muted">
            Current: cash {money(opening.cash)} · Santosh {money(opening.santosh)}{" "}
            · P.K. {money(opening.pk)} · Online {money(opening.online)} ·
            Balance {money(opening.outstanding)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security code</CardTitle>
          <p className="text-sm text-muted">
            {hasCode
              ? "Required to edit or remove anything in the ledger."
              : "Not set — edits are open. Set a code to lock changes."}
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (hasCode && !codeOk(stored, currentPin)) {
                toast.error("Current code is wrong");
                return;
              }
              if (nextPin && nextPin.length < 4) {
                toast.error("Use at least 4 digits");
                return;
              }
              if (nextPin !== confirmPin) {
                toast.error("New code does not match");
                return;
              }
              gate(
                () => {
                  setSecurityCode(nextPin ? hashCode(nextPin) : "");
                  setCurrentPin("");
                  setNextPin("");
                  setConfirmPin("");
                  toast.success(
                    nextPin ? "Security code saved" : "Security code cleared",
                  );
                },
                {
                  title: "Are you sure?",
                  message: nextPin
                    ? "Change the security code?"
                    : "Clear the security code?",
                  confirmLabel: "Save",
                },
              );
            }}
          >
            {hasCode ? (
              <div className="grid gap-1.5">
                <Label htmlFor="pin-now">Current code</Label>
                <Input
                  id="pin-now"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="pin-new">New code</Label>
              <Input
                id="pin-new"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={nextPin}
                onChange={(e) => setNextPin(e.target.value)}
                placeholder={hasCode ? "Leave blank to clear" : "At least 4 digits"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pin-confirm">Confirm</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
            <Button type="submit">{hasCode ? "Update code" : "Set code"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
