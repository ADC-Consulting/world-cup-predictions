import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All 72 group stage matches with correct UTC kick-off times
// Times sourced from ESPN/FIFA official schedule, converted from US Eastern (EDT = UTC-4)
// Dutch time (CEST = UTC+2) = UTC + 2h
const matches: [string, string, string, string][] = [
  // [homeTeam, awayTeam, UTC datetime, group]

  // GROUP A
  ["Mexico",       "South Africa",  "2026-06-11T19:00:00Z", "A"], // 21:00 Dutch
  ["South Korea",  "Czechia",       "2026-06-13T02:00:00Z", "A"], // 04:00 Dutch Jun 13
  ["Czechia",      "South Africa",  "2026-06-18T16:00:00Z", "A"], // 18:00 Dutch
  ["Mexico",       "South Korea",   "2026-06-20T01:00:00Z", "A"], // 03:00 Dutch Jun 20
  ["Czechia",      "Mexico",        "2026-06-25T01:00:00Z", "A"], // 03:00 Dutch Jun 25
  ["South Africa", "South Korea",   "2026-06-25T01:00:00Z", "A"], // 03:00 Dutch Jun 25

  // GROUP B
  ["Canada",               "Bosnia and Herzegovina", "2026-06-12T19:00:00Z", "B"], // 21:00 Dutch
  ["Qatar",                "Switzerland",            "2026-06-13T19:00:00Z", "B"], // 21:00 Dutch
  ["Switzerland",          "Bosnia and Herzegovina", "2026-06-18T19:00:00Z", "B"], // 21:00 Dutch
  ["Canada",               "Qatar",                  "2026-06-18T22:00:00Z", "B"], // 00:00 Dutch Jun 19
  ["Switzerland",          "Canada",                 "2026-06-24T19:00:00Z", "B"], // 21:00 Dutch
  ["Bosnia and Herzegovina","Qatar",                 "2026-06-24T19:00:00Z", "B"], // 21:00 Dutch

  // GROUP C
  ["Brazil",   "Morocco",  "2026-06-13T22:00:00Z", "C"], // 00:00 Dutch Jun 14
  ["Haiti",    "Scotland", "2026-06-15T01:00:00Z", "C"], // 03:00 Dutch Jun 15
  ["Scotland", "Morocco",  "2026-06-19T22:00:00Z", "C"], // 00:00 Dutch Jun 20
  ["Brazil",   "Haiti",    "2026-06-20T00:30:00Z", "C"], // 02:30 Dutch Jun 20
  ["Scotland", "Brazil",   "2026-06-24T22:00:00Z", "C"], // 00:00 Dutch Jun 25
  ["Morocco",  "Haiti",    "2026-06-24T22:00:00Z", "C"], // 00:00 Dutch Jun 25

  // GROUP D
  ["USA",        "Paraguay",  "2026-06-13T01:00:00Z", "D"], // 03:00 Dutch Jun 13
  ["Australia",  "Turkey",    "2026-06-14T04:00:00Z", "D"], // 06:00 Dutch Jun 14
  ["USA",        "Australia", "2026-06-19T19:00:00Z", "D"], // 21:00 Dutch
  ["Turkey",     "Paraguay",  "2026-06-20T04:00:00Z", "D"], // 06:00 Dutch Jun 20
  ["Turkey",     "USA",       "2026-06-26T02:00:00Z", "D"], // 04:00 Dutch Jun 26
  ["Paraguay",   "Australia", "2026-06-26T02:00:00Z", "D"], // 04:00 Dutch Jun 26

  // GROUP E
  ["Germany",      "Curaçao",      "2026-06-14T17:00:00Z", "E"], // 19:00 Dutch
  ["Ivory Coast",  "Ecuador",      "2026-06-14T23:00:00Z", "E"], // 01:00 Dutch Jun 15
  ["Germany",      "Ivory Coast",  "2026-06-20T20:00:00Z", "E"], // 22:00 Dutch
  ["Ecuador",      "Curaçao",      "2026-06-21T00:00:00Z", "E"], // 02:00 Dutch Jun 21
  ["Curaçao",      "Ivory Coast",  "2026-06-25T20:00:00Z", "E"], // 22:00 Dutch
  ["Ecuador",      "Germany",      "2026-06-25T20:00:00Z", "E"], // 22:00 Dutch

  // GROUP F
  ["Netherlands",  "Japan",        "2026-06-14T20:00:00Z", "F"], // 22:00 Dutch
  ["Sweden",       "Tunisia",      "2026-06-15T02:00:00Z", "F"], // 04:00 Dutch Jun 15
  ["Netherlands",  "Sweden",       "2026-06-20T17:00:00Z", "F"], // 19:00 Dutch
  ["Tunisia",      "Japan",        "2026-06-21T04:00:00Z", "F"], // 06:00 Dutch Jun 21
  ["Japan",        "Sweden",       "2026-06-25T23:00:00Z", "F"], // 01:00 Dutch Jun 26
  ["Tunisia",      "Netherlands",  "2026-06-25T23:00:00Z", "F"], // 01:00 Dutch Jun 26

  // GROUP G
  ["Belgium",     "Egypt",        "2026-06-15T19:00:00Z", "G"], // 21:00 Dutch
  ["Iran",        "New Zealand",  "2026-06-17T01:00:00Z", "G"], // 03:00 Dutch Jun 17
  ["Belgium",     "Iran",         "2026-06-21T19:00:00Z", "G"], // 21:00 Dutch
  ["New Zealand", "Egypt",        "2026-06-22T01:00:00Z", "G"], // 03:00 Dutch Jun 22
  ["Egypt",       "Iran",         "2026-06-27T03:00:00Z", "G"], // 05:00 Dutch Jun 27
  ["New Zealand", "Belgium",      "2026-06-27T03:00:00Z", "G"], // 05:00 Dutch Jun 27

  // GROUP H
  ["Spain",         "Cape Verde",   "2026-06-15T16:00:00Z", "H"], // 18:00 Dutch
  ["Saudi Arabia",  "Uruguay",      "2026-06-15T22:00:00Z", "H"], // 00:00 Dutch Jun 16
  ["Spain",         "Saudi Arabia", "2026-06-21T16:00:00Z", "H"], // 18:00 Dutch
  ["Uruguay",       "Cape Verde",   "2026-06-21T22:00:00Z", "H"], // 00:00 Dutch Jun 22
  ["Cape Verde",    "Saudi Arabia", "2026-06-27T00:00:00Z", "H"], // 02:00 Dutch Jun 27
  ["Uruguay",       "Spain",        "2026-06-27T00:00:00Z", "H"], // 02:00 Dutch Jun 27

  // GROUP I
  ["France",   "Senegal", "2026-06-16T19:00:00Z", "I"], // 21:00 Dutch
  ["Iraq",     "Norway",  "2026-06-16T22:00:00Z", "I"], // 00:00 Dutch Jun 17
  ["France",   "Iraq",    "2026-06-22T21:00:00Z", "I"], // 23:00 Dutch
  ["Norway",   "Senegal", "2026-06-23T00:00:00Z", "I"], // 02:00 Dutch Jun 23
  ["Norway",   "France",  "2026-06-26T19:00:00Z", "I"], // 21:00 Dutch
  ["Senegal",  "Iraq",    "2026-06-26T19:00:00Z", "I"], // 21:00 Dutch

  // GROUP J
  ["Argentina", "Algeria", "2026-06-17T01:00:00Z", "J"], // 03:00 Dutch Jun 17
  ["Austria",   "Jordan",  "2026-06-17T04:00:00Z", "J"], // 06:00 Dutch Jun 17
  ["Argentina", "Austria", "2026-06-22T17:00:00Z", "J"], // 19:00 Dutch
  ["Jordan",    "Algeria", "2026-06-24T03:00:00Z", "J"], // 05:00 Dutch Jun 24
  ["Algeria",   "Austria", "2026-06-28T02:00:00Z", "J"], // 04:00 Dutch Jun 28
  ["Jordan",    "Argentina","2026-06-28T02:00:00Z", "J"], // 04:00 Dutch Jun 28

  // GROUP K
  ["Portugal",   "DR Congo",  "2026-06-17T17:00:00Z", "K"], // 19:00 Dutch
  ["Uzbekistan", "Colombia",  "2026-06-18T02:00:00Z", "K"], // 04:00 Dutch Jun 18
  ["Portugal",   "Uzbekistan","2026-06-23T17:00:00Z", "K"], // 19:00 Dutch
  ["Colombia",   "DR Congo",  "2026-06-24T02:00:00Z", "K"], // 04:00 Dutch Jun 24
  ["Colombia",   "Portugal",  "2026-06-27T23:30:00Z", "K"], // 01:30 Dutch Jun 28
  ["DR Congo",   "Uzbekistan","2026-06-27T23:30:00Z", "K"], // 01:30 Dutch Jun 28

  // GROUP L
  ["England",  "Croatia",  "2026-06-17T20:00:00Z", "L"], // 22:00 Dutch
  ["Ghana",    "Panama",   "2026-06-17T23:00:00Z", "L"], // 01:00 Dutch Jun 18
  ["England",  "Ghana",    "2026-06-23T20:00:00Z", "L"], // 22:00 Dutch
  ["Panama",   "Croatia",  "2026-06-23T23:00:00Z", "L"], // 01:00 Dutch Jun 24
  ["Panama",   "England",  "2026-06-27T21:00:00Z", "L"], // 23:00 Dutch
  ["Croatia",  "Ghana",    "2026-06-27T21:00:00Z", "L"], // 23:00 Dutch
];

async function main() {
  // Check if any real predictions exist
  const predCount = await prisma.prediction.count();
  const champCount = await prisma.championPick.count();
  console.log(`Found ${predCount} predictions and ${champCount} champion picks`);

  // Clear all predictions and matches for clean reseed
  await prisma.prediction.deleteMany();
  await prisma.championPick.deleteMany();
  await prisma.match.deleteMany();
  console.log("Cleared existing matches and predictions");

  // Get team map
  const teams = await prisma.team.findMany();
  const teamMap = new Map(teams.map((t) => [t.name, t.id]));

  let count = 0;
  for (const [home, away, scheduledAt, group] of matches) {
    const homeId = teamMap.get(home);
    const awayId = teamMap.get(away);
    if (!homeId) { console.error(`Team not found: "${home}"`); continue; }
    if (!awayId) { console.error(`Team not found: "${away}"`); continue; }
    await prisma.match.create({
      data: { homeTeamId: homeId, awayTeamId: awayId, group, scheduledAt: new Date(scheduledAt) },
    });
    count++;
  }

  console.log(`✓ ${count}/72 matches created with correct schedule`);
  console.log("\nDutch time preview (CEST = UTC+2):");
  const sample = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });
  for (const m of sample) {
    const dutch = new Date(m.scheduledAt);
    dutch.setHours(dutch.getHours() + 2);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dutchStr = `${pad(dutch.getUTCDate())} Jun ${pad(dutch.getUTCHours())}:${pad(dutch.getUTCMinutes())}`;
    console.log(`  ${dutchStr} — ${m.homeTeam.name} vs ${m.awayTeam.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
