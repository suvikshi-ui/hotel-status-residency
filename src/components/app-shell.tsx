import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  CircleUser,
  LayoutDashboard,
  FileText,
  Landmark,
  Layers,
  LogOut,
  Menu,
  MessageSquareWarning,
  Receipt,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DateNav } from "@/components/date-nav";
import { HotelLogo } from "@/components/hotel-logo";
import { useLedger } from "@/lib/store";
import { bottomNavPaths, canOpenPath } from "@/lib/roles";
import { useStaffSession } from "@/lib/supabase-auth";
import { useCloudSync } from "@/lib/supabase-sync";
import { ReminderPopup } from "@/components/reminder-popup";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/register", label: "Register", icon: BookOpen },
  { to: "/invoice", label: "Invoice", icon: FileText },
  { to: "/bank-recon", label: "Bank recon", icon: Landmark },
  { to: "/balance", label: "Balance", icon: Scale },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/reminders", label: "Reminder", icon: Bell },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Layers },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: CircleUser },
] as const;

function NavLinks({
  onNavigate,
  variant,
}: {
  onNavigate?: () => void;
  variant: "side" | "bottom" | "top";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useStaffSession();
  const role = user?.role ?? "admin";
  const items = NAV.filter((item) => canOpenPath(role, item.to));
  if (variant === "bottom") {
    const allowed = new Set(bottomNavPaths(role));
    const primary = items.filter((item) => allowed.has(item.to));
    return (
      <>
        {primary.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as "/"}
              onClick={onNavigate}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }
  return (
    <nav className={cn("flex gap-1", variant === "top" ? "flex-wrap" : "flex-col px-3")}>
      {items.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to as "/"}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium transition-colors",
              variant === "top" ? "px-3" : "gap-3 px-3",
              variant === "top"
                ? active
                  ? "bg-primary text-primary-fg"
                  : "text-fg hover:bg-bg-warm"
                : active
                  ? "bg-sidebar-line text-sidebar-fg"
                  : "text-sidebar-muted hover:bg-sidebar-line/60 hover:text-sidebar-fg",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hotel = useLedger((s) => s.hotel);
  const { user, signOut } = useStaffSession();
  const role = user?.role ?? "admin";
  const cloud = useCloudSync();
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  function onSignOut() {
    setLeaving(true);
    void signOut().catch(() => setLeaving(false));
  }

  return (
    <div className="min-h-dvh">
      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2 px-3 py-2 md:px-6">
            <Sheet open={menu} onOpenChange={setMenu}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar pt-14 text-sidebar-fg">
                <div className="mb-6 flex items-center gap-3 px-5">
                  <HotelLogo mark className="h-10 w-auto shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display text-lg font-semibold leading-tight">
                      {hotel.name}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-sidebar-muted">
                      {hotel.place}
                    </div>
                  </div>
                </div>
                <NavLinks variant="side" onNavigate={() => setMenu(false)} />
                {user ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    disabled={leaving}
                    className="mt-6 flex min-h-11 w-full items-center gap-2 rounded-lg px-5 text-sm text-sidebar-muted hover:bg-sidebar-line/60"
                  >
                    <LogOut className="size-4" />
                    {leaving ? "Signing out…" : "Sign out"}
                  </button>
                ) : null}
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <HotelLogo mark className="h-9 w-auto shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-display text-base font-semibold">
                  {hotel.name}
                </div>
                <div className="hidden truncate text-[10px] uppercase tracking-[0.12em] text-muted md:block">
                  {cloud.phase === "saving"
                    ? "Sending to other desks…"
                    : cloud.phase === "missing-schema"
                      ? "Not in account yet"
                      : cloud.phase === "error"
                        ? "Account save failed"
                        : cloud.phase === "loading"
                          ? "Loading books…"
                          : "Account saved"}
                </div>
              </div>
            </div>
            <DateNav />
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={leaving ? "Signing out" : "Sign out"}
                onClick={onSignOut}
                disabled={leaving}
              >
                <LogOut className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="hidden border-t border-border px-3 py-2 md:block md:px-6">
            <NavLinks variant="top" />
          </div>
        </header>
        <main className="w-full flex-1 px-3 py-5 print:px-0 print:py-0 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md print:hidden md:hidden">
        <NavLinks variant="bottom" />
        {role === "housekeeping" ? null : (
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted"
            >
              <Menu className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-sidebar pt-14 text-sidebar-fg">
            <div className="mb-6 flex items-center gap-3 px-5">
              <HotelLogo mark className="h-10 w-auto shrink-0" />
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold leading-tight">
                  {hotel.name}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-sidebar-muted">
                  {hotel.place}
                </div>
              </div>
            </div>
            <NavLinks variant="side" />
          </SheetContent>
        </Sheet>
        )}
      </nav>
      <ReminderPopup />
    </div>
  );
}
