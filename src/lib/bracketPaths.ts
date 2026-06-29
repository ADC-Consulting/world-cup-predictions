// WC 2026 bracket path definitions.
// Each entry: two matches (by their UTC scheduledAt) that feed into a next-round match.
// m1 winner → home team, m2 winner → away team in the next match.

export type BracketPath = {
  m1: string;   // scheduledAt UTC of the "upper" match
  m2: string;   // scheduledAt UTC of the "lower" match
  next: string; // scheduledAt UTC of the next-round match to create
  nextStage: "R16" | "QF" | "SF" | "F";
};

export const BRACKET_PATHS: BracketPath[] = [
  // ── R32 → R16 ──────────────────────────────────────────────────────────
  // Left half
  { m1: "2026-06-29T20:30:00Z", m2: "2026-06-30T21:00:00Z", next: "2026-07-04T21:00:00Z", nextStage: "R16" }, // GER/PAR + FRA/SWE → M89
  { m1: "2026-06-28T19:00:00Z", m2: "2026-06-30T01:00:00Z", next: "2026-07-04T17:00:00Z", nextStage: "R16" }, // SAF/CAN + NED/MAR → M90
  { m1: "2026-07-02T23:00:00Z", m2: "2026-07-02T19:00:00Z", next: "2026-07-06T19:00:00Z", nextStage: "R16" }, // POR/CRO + ESP/AUT → M93
  { m1: "2026-07-02T00:00:00Z", m2: "2026-07-01T20:00:00Z", next: "2026-07-07T00:00:00Z", nextStage: "R16" }, // USA/BIH + BEL/SEN → M94
  // Right half
  { m1: "2026-06-29T17:00:00Z", m2: "2026-06-30T17:00:00Z", next: "2026-07-05T20:00:00Z", nextStage: "R16" }, // BRA/JPN + CIV/NOR → M91
  { m1: "2026-07-01T01:00:00Z", m2: "2026-07-01T16:00:00Z", next: "2026-07-06T00:00:00Z", nextStage: "R16" }, // MEX/ECU + ENG/COD → M92
  { m1: "2026-07-03T22:00:00Z", m2: "2026-07-03T18:00:00Z", next: "2026-07-07T16:00:00Z", nextStage: "R16" }, // ARG/CPV + AUS/EGY → M95
  { m1: "2026-07-03T03:00:00Z", m2: "2026-07-04T01:30:00Z", next: "2026-07-07T20:00:00Z", nextStage: "R16" }, // SUI/ALG + COL/GHA → M96

  // ── R16 → QF ───────────────────────────────────────────────────────────
  { m1: "2026-07-04T21:00:00Z", m2: "2026-07-04T17:00:00Z", next: "2026-07-09T20:00:00Z", nextStage: "QF" }, // M89 + M90 → M97
  { m1: "2026-07-05T20:00:00Z", m2: "2026-07-06T00:00:00Z", next: "2026-07-11T21:00:00Z", nextStage: "QF" }, // M91 + M92 → M99
  { m1: "2026-07-06T19:00:00Z", m2: "2026-07-07T00:00:00Z", next: "2026-07-10T19:00:00Z", nextStage: "QF" }, // M93 + M94 → M98
  { m1: "2026-07-07T16:00:00Z", m2: "2026-07-07T20:00:00Z", next: "2026-07-12T01:00:00Z", nextStage: "QF" }, // M95 + M96 → M100

  // ── QF → SF ────────────────────────────────────────────────────────────
  { m1: "2026-07-09T20:00:00Z", m2: "2026-07-10T19:00:00Z", next: "2026-07-14T19:00:00Z", nextStage: "SF" }, // M97 + M98 → M101
  { m1: "2026-07-11T21:00:00Z", m2: "2026-07-12T01:00:00Z", next: "2026-07-15T19:00:00Z", nextStage: "SF" }, // M99 + M100 → M102

  // ── SF → Final ─────────────────────────────────────────────────────────
  { m1: "2026-07-14T19:00:00Z", m2: "2026-07-15T19:00:00Z", next: "2026-07-19T19:00:00Z", nextStage: "F" },  // M101 + M102 → Final
];
