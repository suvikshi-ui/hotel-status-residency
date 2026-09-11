export function isDayLocked(
  lockedDates: Record<string, true> | undefined,
  date: string,
) {
  return Boolean(lockedDates?.[date]);
}

export function withLocked(lockedDates: Record<string, true>, date: string) {
  return { ...lockedDates, [date]: true as const };
}

export function withoutLocked(lockedDates: Record<string, true>, date: string) {
  const next = { ...lockedDates };
  delete next[date];
  return next;
}
