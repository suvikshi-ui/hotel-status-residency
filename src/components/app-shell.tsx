import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  CircleUser,
  LayoutDashboard,
  Contact,
  FileText,
  Landmark,
  Layers,
  LogOut,
  MessageSquareWarning,
  Phone,
  Receipt,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateNav } from "@/components/date-nav";
import { HotelLogo } from "@/components/hotel-logo";
import { useLedger } from "@/lib/store";
import { canOpenPath } from "@/lib/roles";
import { useStaffSession } from "@/lib/supabase-auth";
import { useCloudSync } from "@/lib/supabase-sync";
import { ReminderPopup } from "@/components/reminder-popup";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, group: "Books" },
  { to: "/register", label: "Register", icon: BookOpen, group: "Books" },
  { to: "/guests", label: "Guest", icon: Contact, group: "Books" },
  { to: "/invoice", label: "Invoice", icon: FileText, group: "Books" },
  { to: "/expenses", label: "Expenses", icon: Receipt, group: "Books" },
  { to: "/balance", label: "Balance", icon: Scale, group: "Books" },
  { to: "/bank-recon", label: "Bank", icon: Landmark, group: "Books" },
  { to: "/staff", label: "Staff", icon: Users, group: "Payroll" },
  { to: "/inventory", label: "Inventory", icon: Layers, group: "Stores" },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning, group: "Desk" },
  { to: "/reminders", label: "Reminder", icon: Bell, group: "Desk" },
  { to: "/contacts", label: "Contacts", icon: Phone, group: "Desk" },
  { to: "/reports", label: "Reports", icon: BarChart3, group: "Close" },
  { to: "/profile", label: "Profile", icon: CircleUser, group: "Close" },
] as const;

function NavLinks({ onDark = false }: { onDark?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useStaffSession();
  const role = user?.role ?? "admin";
  const items = NAV.filter((item) => canOpenPath(role, item.to)).map((item) =>
    role === "owner" ? { ...item, group: "Owner" } : item,
  );
  return (
    <nav className="nav-scroll flex items-center gap-1" aria-label="Pages">
      {items.map((item, index) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        const groupBreak = index > 0 && items[index - 1].group !== item.group;
        return (
          <span key={item.to} className="contents">
            {groupBreak ? (
              <span className="mx-1 h-6 w-px shrink-0 bg-[#1b2e28]/20" aria-hidden />
            ) : null}
            <TopLink to={item.to} active={active} onDark={onDark}>
              <Icon className="size-4 shrink-0" />
              {item.label}
            </TopLink>
          </span>
        );
      })}
    </nav>
  );
}

function TopLink({
  to,
  active,
  onDark,
  children,
}: {
  to: string;
  active: boolean;
  onDark?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);
  return (
    <Link
      ref={ref}
      to={to as "/"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
        active
          ? "bg-[#f4faf6] text-[#1b3f32]"
          : onDark
            ? "text-[#f4faf6] hover:bg-white/12"
            : "text-fg hover:bg-bg-warm",
      )}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hotel = useLedger((s) => s.hotel);
  const { user, signOut } = useStaffSession();
  const cloud = useCloudSync();
  const [leaving, setLeaving] = useState(false);
  const saved =
    cloud.phase === "saving"
      ? "Saving…"
      : cloud.phase === "error"
        ? "Not saved"
        : cloud.phase === "loading"
          ? "Loading…"
          : cloud.phase === "missing-schema"
            ? "Not in account"
            : "Saved";

  function onSignOut() {
    setLeaving(true);
    void signOut().catch(() => setLeaving(false));
  }

  return (
    <div className="min-h-dvh text-[#1b2e28]">
      <div className="flex min-w-0 flex-col">
        <header className="page-bar sticky top-0 z-30 border-b text-[#f4faf6] print:hidden">
          <div className="flex items-center gap-2 px-3 py-2 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="rounded-md bg-[#f4faf6] px-1 py-0.5">
                <HotelLogo mark className="h-9 w-auto shrink-0" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-base font-semibold leading-tight">
                  {hotel.name}
                </div>
                <div
                  className={cn(
                    "truncate text-[11px] font-semibold uppercase tracking-[0.12em]",
                    cloud.phase === "error" ? "text-[#ffd0c8]" : "text-[#d7efe4]",
                  )}
                >
                  {saved}
                </div>
              </div>
            </div>
            <DateNav light />
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 !text-[#f4faf6] hover:!bg-white/12"
                aria-label={leaving ? "Signing out" : "Sign out"}
                onClick={onSignOut}
                disabled={leaving}
              >
                <LogOut className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="border-t border-white/15 px-3 pb-2 md:px-6">
            <NavLinks onDark />
          </div>
        </header>
        <main className="w-full flex-1 px-3 py-4 print:px-0 print:py-0 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <ReminderPopup />
    </div>
  );
}
