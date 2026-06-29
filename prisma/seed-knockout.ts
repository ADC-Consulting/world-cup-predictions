import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All 16 R32 matches sourced from FIFA official schedule.
// Times are in UTC. M73 (South Africa vs Canada, June 28) already played 0-1.
//
// Bracket path (who winner plays next):
//   M73 winner + M75 winner → M90 (R16, July 4 17:00 UTC)
//   M74 winner + M77 winner → M89 (R16, July 4 21:00 UTC)
//   M76 winner + M78 winner → M91 (R16, July 5 20:00 UTC)
//   M79 winner + M80 winner → M92 (R16, July 6 00:00 UTC)
//   M83 winner + M84 winner → M93 (R16, July 6 19:00 UTC)
//   M81 winner + M82 winner → M94 (R16, July 7 00:00 UTC)
//   M86 winner + M88 winner → M95 (R16, July 7 16:00 UTC)
//   M85 winner + M87 winner → M96 (R16, July 7 20:00 UTC)

const R32: {
  home: string;
  away: string;
  scheduledAt: string;
  homeScore?: number;
  awayScore?: number;
}[] = [
  // June 28
  { home: "South Africa", away: "Canada",              scheduledAt: "2026-06-28T19:00:00Z", homeScore: 0, awayScore: 1 }, // M73 – played
  // June 29
  { home: "Brazil",       away: "Japan",               scheduledAt: "2026-06-29T17:00:00Z" }, // M76 – 12:00 CDT
  { home: "Germany",      away: "Paraguay",            scheduledAt: "2026-06-29T20:30:00Z" }, // M74 – 16:30 EDT
  { home: "Netherlands",  away: "Morocco",             scheduledAt: "2026-06-30T01:00:00Z" }, // M75 – 19:00 UTC-6
  // June 30
  { home: "Ivory Coast",  away: "Norway",              scheduledAt: "2026-06-30T17:00:00Z" }, // M78 – 12:00 CDT
  { home: "France",       away: "Sweden",              scheduledAt: "2026-06-30T21:00:00Z" }, // M77 – 17:00 EDT
  // July 1
  { home: "Mexico",       away: "Ecuador",             scheduledAt: "2026-07-01T01:00:00Z" }, // M79 – 19:00 UTC-6
  { home: "England",      away: "DR Congo",            scheduledAt: "2026-07-01T16:00:00Z" }, // M80 – 12:00 EDT
  { home: "Belgium",      away: "Senegal",             scheduledAt: "2026-07-01T20:00:00Z" }, // M82 – 13:00 PDT
  { home: "USA",          away: "Bosnia and Herzegovina", scheduledAt: "2026-07-02T00:00:00Z" }, // M81 – 17:00 PDT
  // July 2
  { home: "Spain",        away: "Austria",             scheduledAt: "2026-07-02T19:00:00Z" }, // M84 – 12:00 PDT
  { home: "Portugal",     away: "Croatia",             scheduledAt: "2026-07-02T23:00:00Z" }, // M83 – 19:00 EDT
  // July 3
  { home: "Switzerland",  away: "Algeria",             scheduledAt: "2026-07-03T03:00:00Z" }, // M85 – 20:00 PDT
  { home: "Australia",    away: "Egypt",               scheduledAt: "2026-07-03T18:00:00Z" }, // M88 – 13:00 CDT
  { home: "Argentina",    away: "Cape Verde",          scheduledAt: "2026-07-03T22:00:00Z" }, // M86 – 18:00 EDT
  // July 4
  { home: "Colombia",     away: "Ghana",               scheduledAt: "2026-07-04T01:30:00Z" }, // M87 – 20:30 CDT
];

async function main() {
  const teams = await prisma.team.findMany();
  const t = (name: string) => {
    const team = teams.find((tm) => tm.name === name);
    if (!team) throw new Error(`Team not found: "${name}"`);
    return team.id;
  };

  let created = 0;
  let skipped = 0;

  for (const m of R32) {
    const homeTeamId = t(m.home);
    const awayTeamId = t(m.away);

    const existing = await prisma.match.findFirst({
      where: { homeTeamId, awayTeamId, stage: "R32" },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.match.create({
      data: {
        stage: "R32",
        group: "R32",
        homeTeamId,
        awayTeamId,
        scheduledAt: new Date(m.scheduledAt),
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
      },
    });
    created++;
    console.log(`✓ ${m.home} vs ${m.away} (${m.scheduledAt})`);
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
