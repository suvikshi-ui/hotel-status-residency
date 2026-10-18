import { useEffect, useRef, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  CircleUser,
  LayoutDashboard,
  Contact,
  FileText,
  Landmark,
  Layers,
  MessageSquareWarning,
  Phone,
  Receipt,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateNav } from "@/components/date-nav";
import { HotelLogo } from "@/components/hotel-logo";
import { useLedger } from "@/lib/store";
import { canOpenPath } from "@/lib/roles";
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
  { to: "/cash-count", label: "Cash count", icon: Banknote, group: "Close" },
  { to: "/profile", label: "Profile", icon: CircleUser, group: "Close" },
] as const;

function NavLinks({ onDark = false }: { onDark?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = "admin" as const;
  const items = NAV.filter((item) => canOpenPath(role, item.to));
  return (
    <nav className="nav-scroll flex items-center gap-1" aria-label="Pages">
      {items.map((item, index) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        const groupBreak = index > 0 && items[index - 1].group !== item.group;
        return (
          <span key={item.to} className="contents">
            {groupBreak ? (
              <span className="mx-1.5 size-1 shrink-0 rounded-full bg-[#f4c430]/80" aria-hidden />
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
        "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold tracking-[-0.01em]",
        active
          ? "bg-[#f4c430] text-[#1b332a] shadow-[0_1px_0_rgba(255,255,255,0.35)]"
          : onDark
            ? "text-[#f7f3ea] hover:bg-white/10"
            : "text-fg hover:bg-bg-warm",
      )}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hotel = useLedger((s) => s.hotel);

  return (
    <div className="min-h-dvh text-[#1b2e28]">
      <div className="flex min-w-0 flex-col">
        <header className="page-bar sticky top-0 z-30 border-b text-[#f4faf6] print:hidden">
          <div className="flex items-center gap-2 px-3 py-2 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <HotelLogo mark className="logo-3d h-11 w-auto shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-[17px] font-bold leading-tight tracking-[-0.03em] text-[#fffaf3]">
                  {hotel.name}
                </div>
                <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f4c430]">
                  On this computer
                </div>
              </div>
            </div>
            <DateNav light />
          </div>
          <div className="border-t border-[#f4c430]/25 px-2 py-2 md:px-5">
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
