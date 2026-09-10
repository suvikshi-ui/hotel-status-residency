export function staffPay(
  basic: number,
  working: number,
  extra: number,
  advance: number,
  monthDays: number,
) {
  const days = monthDays > 0 ? monthDays : 30;
  const earned = Math.round(
    (Math.max(0, basic) * (Math.max(0, working) + Math.max(0, extra))) / days,
  );
  const payable = earned - (advance || 0);
  return { earned, payable };
}
