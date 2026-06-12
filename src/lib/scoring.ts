export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(actualHome - actualAway);
  if (predResult === actualResult) return 2;
  return 0;
}

export function getResultLabel(points: number): string {
  if (points === 3) return "Exact";
  if (points === 1) return "Result";
  return "Miss";
}

export const POSITION_MULTIPLIER: Record<string, number> = {
  DEFENDER: 1.5,
  MIDFIELDER: 1.0,
  FORWARD: 0.5,
};

export function normalise(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function scorerPoints(
  picks: { playerName: string; position: string }[],
  goalEntries: { playerName: string; goals: number }[]
): number {
  let total = 0;
  for (const pick of picks) {
    const entry = goalEntries.find((e) => normalise(e.playerName) === normalise(pick.playerName));
    if (entry && entry.goals > 0) {
      const mult = POSITION_MULTIPLIER[pick.position] ?? 0.5;
      total += entry.goals * mult;
    }
  }
  return total;
}
