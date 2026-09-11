export const SEEDED_DATES = [
  "2026-09-06",
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
] as const;

type Seedish = {
  id?: string;
  date: string;
  amount?: number;
  name?: string;
  roomNo?: string;
  mode?: string;
  source?: string | null;
  particular?: string;
};

function userEditedSeedRow<T extends Seedish>(have: T, seed: T) {
  return (
    Number(have.amount) !== Number(seed.amount) ||
    (have.name ?? "") !== (seed.name ?? "") ||
    (have.roomNo ?? "") !== (seed.roomNo ?? "") ||
    (have.mode ?? "") !== (seed.mode ?? "") ||
    (have.source ?? "") !== (seed.source ?? "") ||
    (have.particular ?? "") !== (seed.particular ?? "")
  );
}

export function fillSeedDate<T extends Seedish>(
  persisted: T[] | undefined,
  seedRows: T[],
  date: string,
  force = false,
): T[] {
  const have = persisted ?? [];
  const seedOn = seedRows.filter((r) => r.date === date);
  const others = have.filter((r) => r.date !== date);
  const haveOn = have.filter((r) => r.date === date);
  if (!seedOn.length) return force ? others : have;
  if (!haveOn.length) return [...others, ...seedOn];

  const seedById = new Map(seedOn.map((r) => [r.id, r]));
  const touched = haveOn.some((row) => {
    if (!row.id || !seedById.has(row.id)) return false;
    return userEditedSeedRow(row, seedById.get(row.id)!);
  });
  if (touched) return have;

  if (!force) {
    const seedAmt = seedOn.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const haveAmt = haveOn.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    if (haveOn.length === seedOn.length && haveAmt === seedAmt) return have;
  }
  return [...others, ...seedOn];
}

export function fillAllSeedDates<T extends Seedish>(
  persisted: T[] | undefined,
  seedRows: T[],
  dates: readonly string[] = SEEDED_DATES,
): T[] {
  let next = persisted ?? [];
  for (const date of dates) next = fillSeedDate(next, seedRows, date, true);
  return next;
}
