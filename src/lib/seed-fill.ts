const CHART_DATE = "2026-09-06";

export function fillSeedDate<T extends { date: string; amount?: number }>(
  persisted: T[] | undefined,
  seedRows: T[],
  date: string = CHART_DATE,
): T[] {
  const have = persisted ?? [];
  const seedOn = seedRows.filter((r) => r.date === date);
  if (!seedOn.length) return have;
  const haveOn = have.filter((r) => r.date === date);
  const seedAmt = seedOn.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const haveAmt = haveOn.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  if (haveOn.length >= seedOn.length && haveAmt >= seedAmt) return have;
  return [...have.filter((r) => r.date !== date), ...seedOn];
}
