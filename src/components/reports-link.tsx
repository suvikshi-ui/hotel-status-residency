import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseReportView, type ReportView } from "@/lib/report-views";

export function ReportsLink({
  view,
  label = "Reports",
}: {
  view?: ReportView;
  label?: string;
}) {
  return (
    <Button asChild variant="outline">
      <Link to="/reports" search={{ view: parseReportView(view) }}>
        {label}
        <ArrowUpRight className="size-4" />
      </Link>
    </Button>
  );
}
