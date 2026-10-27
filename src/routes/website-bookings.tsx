import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/website-bookings")({ component: WebsiteBookingsPage });

type WebsiteBooking = {
  id: string;
  guest_name: string;
  phone: string;
  room_type: string;
  rooms: number;
  guests: number;
  check_in: string;
  check_out: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  payment_status: string;
};

const rupees = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function WebsiteBookingsPage() {
  const [rows, setRows] = useState<WebsiteBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected = isSupabaseConfigured();

  useEffect(() => {
    if (!connected) return;
    const today = new Date().toISOString().slice(0, 10);
    getSupabase()
      .from("website_bookings")
      .select("*")
      .gte("check_out", today)
      .order("check_in", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setRows((data ?? []) as WebsiteBooking[]);
      });
  }, [connected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website bookings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!connected ? (
          <p className="text-muted-foreground">
            The cloud project is not connected, so website bookings cannot be shown here yet. They are still
            on the website owner page.
          </p>
        ) : error ? (
          <p className="text-destructive">Could not load website bookings: {error}</p>
        ) : rows === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No upcoming website bookings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Booking</th>
                  <th className="p-2">Guest</th>
                  <th className="p-2">Room</th>
                  <th className="p-2">Stay</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Paid</th>
                  <th className="p-2">Balance</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2 font-mono">{b.id}</td>
                    <td className="p-2">{b.guest_name}<div className="text-muted-foreground">{b.phone}</div></td>
                    <td className="p-2">{b.room_type} × {b.rooms} ({b.guests} guests)</td>
                    <td className="p-2">{b.check_in} → {b.check_out}</td>
                    <td className="p-2">{rupees(b.total_amount)}</td>
                    <td className="p-2">{rupees(b.amount_paid)}</td>
                    <td className="p-2">{rupees(b.balance)}</td>
                    <td className="p-2">{b.status} / {b.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
