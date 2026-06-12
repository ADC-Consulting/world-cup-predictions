import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  const t = (name: string) => {
    const team = teams.find((tm) => tm.name === name);
    if (!team) throw new Error(`Team not found: "${name}"`);
    return team.id;
  };

  const fixes: [string, string, string][] = [
    // [homeTeam, awayTeam, correctUTC]
    ["Turkey",    "USA",          "2026-06-26T02:00:00Z"],  // was Jun 27, correct Jun 26
    ["Paraguay",  "Australia",    "2026-06-26T02:00:00Z"],  // was Jun 27, correct Jun 26
    ["Egypt",     "Iran",         "2026-06-27T03:00:00Z"],  // was Jun 28, correct Jun 27
    ["New Zealand","Belgium",     "2026-06-27T03:00:00Z"],  // was Jun 28, correct Jun 27
    ["Cape Verde","Saudi Arabia", "2026-06-27T00:00:00Z"],  // was Jun 28, correct Jun 27
    ["Uruguay",   "Spain",        "2026-06-27T00:00:00Z"],  // was Jun 28, correct Jun 27
  ];

  let updated = 0;
  for (const [home, away, correctUTC] of fixes) {
    const result = await prisma.match.updateMany({
      where: { homeTeamId: t(home), awayTeamId: t(away) },
      data: { scheduledAt: new Date(correctUTC) },
    });
    console.log(`${home} vs ${away}: ${result.count} row(s) → ${correctUTC}`);
    updated += result.count;
  }
  console.log(`\nDone — ${updated} matches updated`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
