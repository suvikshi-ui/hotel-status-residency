import type { ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HotelLogo } from "@/components/hotel-logo";
import { canOpenPath, homePath } from "@/lib/roles";
import { useLedger } from "@/lib/store";
import { useStaffSession } from "@/lib/supabase-auth";

function SessionSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <HotelLogo mark className="h-14 w-auto" />
        <div className="h-8 w-48 animate-pulse rounded-md bg-bg-warm" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-bg-warm" />
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const { user, isPending, configured } = useStaffSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const storedRole = useLedger((s) => s.appRole);
  const role = user?.role ?? storedRole;
  const onLogin = pathname === "/login";

  if (!configured) {
    if (onLogin) return <>{children}</>;
    return <AppShell>{children}</AppShell>;
  }

  if (isPending) {
    return onLogin ? <>{children}</> : <SessionSkeleton />;
  }

  if (!user) {
    if (onLogin) return <>{children}</>;
    return <Navigate to="/login" />;
  }

  if (onLogin) return <Navigate to={homePath(role)} />;

  if (!canOpenPath(role, pathname)) {
    return <Navigate to={homePath(role)} />;
  }

  return <AppShell>{children}</AppShell>;
}
