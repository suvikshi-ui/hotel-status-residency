import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseReportView, type ReportView } from "@/lib/report-views";
import { canOpenPath } from "@/lib/roles";
import { useStaffSession } from "@/lib/supabase-auth";

export function ReportsLink({
  view,
  label = "Reports",
}: {
  view?: ReportView;
  label?: string;
}) {
  const { user } = useStaffSession();
  const role = user?.role ?? "admin";
  if (!canOpenPath(role, "/reports")) return null;
  return (
    <Button asChild variant="outline">
      <Link to="/reports" search={{ view: parseReportView(view) }}>
        {label}
        <ArrowUpRight className="size-4" />
      </Link>
    </Button>
  );
}
