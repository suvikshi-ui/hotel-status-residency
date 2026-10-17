export const REPORT_VIEWS = ["daily", "detail", "month"] as const;

export type ReportView = (typeof REPORT_VIEWS)[number];

export const REPORT_TAB: { id: ReportView; label: string }[] = [
  { id: "daily", label: "Daily report" },
  { id: "detail", label: "Detailed daily" },
  { id: "month", label: "Monthly report" },
];

export function parseReportView(value: unknown): ReportView {
  return REPORT_VIEWS.includes(value as ReportView)
    ? (value as ReportView)
    : "daily";
}
