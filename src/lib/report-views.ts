export const REPORT_VIEWS = [
  "daily",
  "detail",
  "month",
  "inventory",
  "ws",
  "kitchen",
  "salary",
  "advance",
] as const;

export type ReportView = (typeof REPORT_VIEWS)[number];

export const REPORT_TAB: { id: ReportView; label: string }[] = [
  { id: "daily", label: "Daily report" },
  { id: "detail", label: "Detailed daily" },
  { id: "month", label: "Monthly report" },
  { id: "inventory", label: "Linen report" },
  { id: "ws", label: "WS report" },
  { id: "kitchen", label: "Kitchen report" },
  { id: "salary", label: "Salary report" },
  { id: "advance", label: "Staff advance" },
];

export const HOUSEKEEPING_REPORTS: ReportView[] = ["inventory", "ws", "kitchen"];

export function parseReportView(value: unknown): ReportView {
  return REPORT_VIEWS.includes(value as ReportView)
    ? (value as ReportView)
    : "daily";
}
