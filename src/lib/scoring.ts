const STAGE_PTS: Record<string, { exact: number; result: number }> = {
  group: { exact: 3, result: 2 },
  R32:   { exact: 3, result: 2 },
  R16:   { exact: 4, result: 3 },
  QF:    { exact: 6, result: 4 },
  SF:    { exact: 8, result: 6 },
  F:     { exact: 12, result: 8 },
};

export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  return calculatePointsForStage(predHome, predAway, actualHome, actualAway, "group");
}

export function calculatePointsForStage(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  stage: string
): number {
  const pts = STAGE_PTS[stage] ?? STAGE_PTS.group;
  if (predHome === actualHome && predAway === actualAway) return pts.exact;
  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(actualHome - actualAway);
  if (predResult === actualResult) return pts.result;
  return 0;
}

export function stagePoints(stage: string) {
  return STAGE_PTS[stage] ?? STAGE_PTS.group;
}

export const STAGE_LABELS: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  F: "Final",
};

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
