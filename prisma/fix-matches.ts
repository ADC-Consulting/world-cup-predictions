import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const matchFixtures: [string, string, string][] = [
  // GROUP A
  ["Mexico", "South Africa", "2026-06-11T19:00:00Z"],
  ["South Korea", "Czechia", "2026-06-12T02:00:00Z"],
  ["Czechia", "South Africa", "2026-06-18T16:00:00Z"],
  ["Mexico", "South Korea", "2026-06-19T01:00:00Z"],
  ["Czechia", "Mexico", "2026-06-25T01:00:00Z"],
  ["South Africa", "South Korea", "2026-06-25T01:00:00Z"],
  // GROUP B
  ["Canada", "Bosnia and Herzegovina", "2026-06-12T19:00:00Z"],
  ["Qatar", "Switzerland", "2026-06-13T19:00:00Z"],
  ["Switzerland", "Bosnia and Herzegovina", "2026-06-18T19:00:00Z"],
  ["Canada", "Qatar", "2026-06-18T22:00:00Z"],
  ["Switzerland", "Canada", "2026-06-24T19:00:00Z"],
  ["Bosnia and Herzegovina", "Qatar", "2026-06-24T19:00:00Z"],
  // GROUP C
  ["Brazil", "Morocco", "2026-06-13T22:00:00Z"],
  ["Haiti", "Scotland", "2026-06-14T01:00:00Z"],
  ["Scotland", "Morocco", "2026-06-19T22:00:00Z"],
  ["Brazil", "Haiti", "2026-06-20T01:00:00Z"],
  ["Scotland", "Brazil", "2026-06-24T22:00:00Z"],
  ["Morocco", "Haiti", "2026-06-24T22:00:00Z"],
  // GROUP D
  ["USA", "Paraguay", "2026-06-13T01:00:00Z"],
  ["Australia", "Turkey", "2026-06-13T04:00:00Z"],
  ["Turkey", "Paraguay", "2026-06-19T04:00:00Z"],
  ["USA", "Australia", "2026-06-19T19:00:00Z"],
  ["Turkey", "USA", "2026-06-26T02:00:00Z"],
  ["Paraguay", "Australia", "2026-06-26T02:00:00Z"],
  // GROUP E
  ["Germany", "Curaçao", "2026-06-14T17:00:00Z"],
  ["Ivory Coast", "Ecuador", "2026-06-14T23:00:00Z"],
  ["Germany", "Ivory Coast", "2026-06-20T20:00:00Z"],
  ["Ecuador", "Curaçao", "2026-06-21T00:00:00Z"],
  ["Ecuador", "Germany", "2026-06-25T20:00:00Z"],
  ["Curaçao", "Ivory Coast", "2026-06-25T20:00:00Z"],
  // GROUP F
  ["Netherlands", "Japan", "2026-06-14T20:00:00Z"],
  ["Sweden", "Tunisia", "2026-06-15T02:00:00Z"],
  ["Netherlands", "Sweden", "2026-06-20T17:00:00Z"],
  ["Tunisia", "Japan", "2026-06-20T04:00:00Z"],
  ["Tunisia", "Netherlands", "2026-06-25T23:00:00Z"],
  ["Japan", "Sweden", "2026-06-25T23:00:00Z"],
  // GROUP G
  ["Belgium", "Egypt", "2026-06-15T19:00:00Z"],
  ["Iran", "New Zealand", "2026-06-16T01:00:00Z"],
  ["Belgium", "Iran", "2026-06-21T19:00:00Z"],
  ["New Zealand", "Egypt", "2026-06-22T01:00:00Z"],
  ["New Zealand", "Belgium", "2026-06-27T03:00:00Z"],
  ["Egypt", "Iran", "2026-06-27T03:00:00Z"],
  // GROUP H
  ["Spain", "Cape Verde", "2026-06-15T16:00:00Z"],
  ["Saudi Arabia", "Uruguay", "2026-06-15T22:00:00Z"],
  ["Spain", "Saudi Arabia", "2026-06-21T16:00:00Z"],
  ["Uruguay", "Cape Verde", "2026-06-21T22:00:00Z"],
  ["Uruguay", "Spain", "2026-06-27T00:00:00Z"],
  ["Cape Verde", "Saudi Arabia", "2026-06-27T00:00:00Z"],
  // GROUP I
  ["France", "Senegal", "2026-06-16T19:00:00Z"],
  ["Iraq", "Norway", "2026-06-16T22:00:00Z"],
  ["France", "Iraq", "2026-06-22T21:00:00Z"],
  ["Norway", "Senegal", "2026-06-23T00:00:00Z"],
  ["Norway", "France", "2026-06-26T19:00:00Z"],
  ["Senegal", "Iraq", "2026-06-26T19:00:00Z"],
  // GROUP J
  ["Austria", "Jordan", "2026-06-16T04:00:00Z"],
  ["Argentina", "Algeria", "2026-06-17T01:00:00Z"],
  ["Argentina", "Austria", "2026-06-22T17:00:00Z"],
  ["Jordan", "Algeria", "2026-06-23T03:00:00Z"],
  ["Jordan", "Argentina", "2026-06-28T02:00:00Z"],
  ["Algeria", "Austria", "2026-06-28T02:00:00Z"],
  // GROUP K
  ["Portugal", "DR Congo", "2026-06-17T17:00:00Z"],
  ["Uzbekistan", "Colombia", "2026-06-18T02:00:00Z"],
  ["Portugal", "Uzbekistan", "2026-06-23T17:00:00Z"],
  ["Colombia", "DR Congo", "2026-06-24T02:00:00Z"],
  ["Colombia", "Portugal", "2026-06-27T23:30:00Z"],
  ["DR Congo", "Uzbekistan", "2026-06-27T23:30:00Z"],
  // GROUP L
  ["England", "Croatia", "2026-06-17T20:00:00Z"],
  ["Ghana", "Panama", "2026-06-17T23:00:00Z"],
  ["England", "Ghana", "2026-06-23T20:00:00Z"],
  ["Panama", "Croatia", "2026-06-23T23:00:00Z"],
  ["Panama", "England", "2026-06-27T21:00:00Z"],
  ["Croatia", "Ghana", "2026-06-27T21:00:00Z"],
];

async function main() {
  console.log("Fixing match data...");

  const deletedPredictions = await prisma.prediction.deleteMany({});
  console.log(`✓ Deleted ${deletedPredictions.count} predictions`);

  const deletedMatches = await prisma.match.deleteMany({});
  console.log(`✓ Deleted ${deletedMatches.count} matches`);

  const allTeams = await prisma.team.findMany();
  const teamMap = new Map(allTeams.map((t) => [t.name, t]));

  let matchCount = 0;
  for (const [home, away, scheduledAt] of matchFixtures) {
    const homeTeam = teamMap.get(home);
    const awayTeam = teamMap.get(away);
    if (!homeTeam || !awayTeam) {
      console.error(`  ✗ Team not found: "${home}" or "${away}"`);
      continue;
    }
    await prisma.match.create({
      data: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        group: homeTeam.group,
        scheduledAt: new Date(scheduledAt),
      },
    });
    matchCount++;
  }
  console.log(`✓ Created ${matchCount} matches with correct fixtures`);
  console.log("\nDone! Users will need to re-enter their predictions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
