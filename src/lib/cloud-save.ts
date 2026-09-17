export function preferLocalOverCloud(input: {
  localSavedAt: number;
  cloudUpdatedAt: number;
  localScore: number;
  cloudScore: number;
}) {
  if (input.localScore > 0 && input.cloudScore < 5) return true;
  if (input.localScore > input.cloudScore) return true;
  if (input.localSavedAt > input.cloudUpdatedAt + 250) return true;
  if (
    input.cloudUpdatedAt > input.localSavedAt + 250 &&
    input.cloudScore >= input.localScore
  ) {
    return false;
  }
  return true;
}

export function mergeRowsByDate<T extends { date: string }>(
  primary: T[] | undefined,
  filler: T[] | undefined,
): T[] {
  const keep = primary ?? [];
  const extra = filler ?? [];
  if (!extra.length) return keep;
  const dates = new Set(keep.map((r) => r.date));
  return [...keep, ...extra.filter((r) => !dates.has(r.date))];
}

export function earlierDate(a?: string, b?: string) {
  const x = (a || "").slice(0, 10);
  const y = (b || "").slice(0, 10);
  if (!x) return y;
  if (!y) return x;
  return x < y ? x : y;
}
