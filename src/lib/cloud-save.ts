export function preferLocalOverCloud(input: {
  localSavedAt: number;
  cloudUpdatedAt: number;
  localScore: number;
  cloudScore: number;
}) {
  if (input.localSavedAt > input.cloudUpdatedAt + 250) return true;
  if (input.cloudUpdatedAt > input.localSavedAt + 250) return false;
  return input.localScore > input.cloudScore;
}
