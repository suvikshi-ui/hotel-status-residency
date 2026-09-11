export const REPORT_VIEWS = [
  "daily",
  "detail",
  "month",
  "inventory",
  "salary",
  "advance",
] as const;

export type ReportView = (typeof REPORT_VIEWS)[number];

export const REPORT_TAB: { id: ReportView; label: string }[] = [
  { id: "daily", label: "Daily report" },
  { id: "detail", label: "Detailed daily" },
  { id: "month", label: "Monthly report" },
  { id: "inventory", label: "Inventory report" },
  { id: "salary", label: "Staff salary" },
  { id: "advance", label: "Staff advance" },
];

export function parseReportView(value: unknown): ReportView {
  return REPORT_VIEWS.includes(value as ReportView)
    ? (value as ReportView)
    : "daily";
}
