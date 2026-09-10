import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CircleUser,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Scale,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DateNav } from "@/components/date-nav";
import { HotelLogo } from "@/components/hotel-logo";
import { useLedger } from "@/lib/store";
import { useStaffSession } from "@/lib/supabase-auth";
import { useCloudSync } from "@/lib/supabase-sync";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/register", label: "Register", icon: BookOpen },
  { to: "/balance", label: "Balance", icon: Scale },
  { to: "/rooms", label: "Rooms", icon: Building2 },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: CircleUser },
] as const;

function NavLinks({
  onNavigate,
  variant,
}: {
  onNavigate?: () => void;
  variant: "side" | "bottom";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (variant === "bottom") {
    const primary = NAV.filter((item) =>
      ["/", "/register", "/balance", "/reports"].includes(item.to),
    );
    return (
      <>
        {primary.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
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
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
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
  const cloud = useCloudSync();
  const [menu, setMenu] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  function onSignOut() {
    setLeaving(true);
    void signOut().catch(() => setLeaving(false));
  }

  const accountLabel = user?.name || user?.email || "Staff";

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16.5rem_1fr]">
      <aside className="hidden bg-sidebar text-sidebar-fg print:hidden md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-5">
          <HotelLogo mark className="h-11 w-auto shrink-0" />
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight tracking-tight">
              {hotel.name}
            </div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-sidebar-muted">
              {hotel.place}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks variant="side" />
        </div>
        <div className="border-t border-sidebar-line px-5 py-4">
          {user ? (
            <>
              <div className="truncate text-xs font-medium text-sidebar-fg">
                {accountLabel}
              </div>
              {user.email && user.name ? (
                <div className="truncate text-[11px] text-sidebar-muted">
                  {user.email}
                </div>
              ) : null}
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
                {cloud.phase === "saving"
                  ? "Saving to account…"
                  : cloud.phase === "missing-schema"
                    ? "On this device"
                    : cloud.phase === "error"
                      ? "Cloud unreachable"
                      : cloud.phase === "loading"
                        ? "Loading books…"
                        : "Saved to account"}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                disabled={leaving}
                className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm text-sidebar-muted hover:bg-sidebar-line/60 hover:text-sidebar-fg disabled:cursor-wait"
              >
                <LogOut className="size-4" />
                {leaving ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <p className="text-[10px] leading-snug text-sidebar-muted">
              {hotel.blessing}
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-bg/90 px-3 py-2 backdrop-blur-md print:hidden md:px-6">
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
            <SheetContent side="left" className="pt-14">
              <div className="mb-6 flex items-center gap-3 px-5">
                <HotelLogo mark className="h-10 w-auto shrink-0" />
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold leading-tight">
                    {hotel.name}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
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
                  className="mt-6 flex min-h-11 w-full items-center gap-2 rounded-lg px-5 text-sm text-muted hover:bg-bg-warm"
                >
                  <LogOut className="size-4" />
                  {leaving ? "Signing out…" : "Sign out"}
                </button>
              ) : null}
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HotelLogo mark className="h-9 w-auto shrink-0" />
            <div className="min-w-0 truncate font-display text-base font-semibold">
              {hotel.name}
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
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 print:max-w-none print:px-0 print:py-0 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md print:hidden md:hidden">
        <NavLinks variant="bottom" />
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
          <SheetContent side="left" className="pt-14">
            <div className="mb-6 flex items-center gap-3 px-5">
              <HotelLogo mark className="h-10 w-auto shrink-0" />
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold leading-tight">
                  {hotel.name}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  {hotel.place}
                </div>
              </div>
            </div>
            <NavLinks variant="side" />
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                disabled={leaving}
                className="mt-6 flex min-h-11 w-full items-center gap-2 rounded-lg px-5 text-sm text-muted hover:bg-bg-warm"
              >
                <LogOut className="size-4" />
                {leaving ? "Signing out…" : "Sign out"}
              </button>
            ) : null}
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
