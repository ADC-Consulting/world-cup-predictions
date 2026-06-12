import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const teams = [
  // Group A
  { name: "Mexico", group: "A", flag: "🇲🇽" },
  { name: "South Korea", group: "A", flag: "🇰🇷" },
  { name: "Czechia", group: "A", flag: "🇨🇿" },
  { name: "South Africa", group: "A", flag: "🇿🇦" },
  // Group B
  { name: "Bosnia and Herzegovina", group: "B", flag: "🇧🇦" },
  { name: "Canada", group: "B", flag: "🇨🇦" },
  { name: "Qatar", group: "B", flag: "🇶🇦" },
  { name: "Switzerland", group: "B", flag: "🇨🇭" },
  // Group C
  { name: "Brazil", group: "C", flag: "🇧🇷" },
  { name: "Haiti", group: "C", flag: "🇭🇹" },
  { name: "Morocco", group: "C", flag: "🇲🇦" },
  { name: "Scotland", group: "C", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  { name: "Australia", group: "D", flag: "🇦🇺" },
  { name: "Paraguay", group: "D", flag: "🇵🇾" },
  { name: "Turkey", group: "D", flag: "🇹🇷" },
  { name: "USA", group: "D", flag: "🇺🇸" },
  // Group E
  { name: "Curaçao", group: "E", flag: "🇨🇼" },
  { name: "Ecuador", group: "E", flag: "🇪🇨" },
  { name: "Germany", group: "E", flag: "🇩🇪" },
  { name: "Ivory Coast", group: "E", flag: "🇨🇮" },
  // Group F
  { name: "Japan", group: "F", flag: "🇯🇵" },
  { name: "Netherlands", group: "F", flag: "🇳🇱" },
  { name: "Sweden", group: "F", flag: "🇸🇪" },
  { name: "Tunisia", group: "F", flag: "🇹🇳" },
  // Group G
  { name: "Belgium", group: "G", flag: "🇧🇪" },
  { name: "Egypt", group: "G", flag: "🇪🇬" },
  { name: "Iran", group: "G", flag: "🇮🇷" },
  { name: "New Zealand", group: "G", flag: "🇳🇿" },
  // Group H
  { name: "Cape Verde", group: "H", flag: "🇨🇻" },
  { name: "Saudi Arabia", group: "H", flag: "🇸🇦" },
  { name: "Spain", group: "H", flag: "🇪🇸" },
  { name: "Uruguay", group: "H", flag: "🇺🇾" },
  // Group I
  { name: "France", group: "I", flag: "🇫🇷" },
  { name: "Iraq", group: "I", flag: "🇮🇶" },
  { name: "Norway", group: "I", flag: "🇳🇴" },
  { name: "Senegal", group: "I", flag: "🇸🇳" },
  // Group J
  { name: "Algeria", group: "J", flag: "🇩🇿" },
  { name: "Argentina", group: "J", flag: "🇦🇷" },
  { name: "Austria", group: "J", flag: "🇦🇹" },
  { name: "Jordan", group: "J", flag: "🇯🇴" },
  // Group K
  { name: "Colombia", group: "K", flag: "🇨🇴" },
  { name: "DR Congo", group: "K", flag: "🇨🇩" },
  { name: "Portugal", group: "K", flag: "🇵🇹" },
  { name: "Uzbekistan", group: "K", flag: "🇺🇿" },
  // Group L
  { name: "Croatia", group: "L", flag: "🇭🇷" },
  { name: "England", group: "L", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Ghana", group: "L", flag: "🇬🇭" },
  { name: "Panama", group: "L", flag: "🇵🇦" },
];

// Matches: [homeTeam, awayTeam, scheduledAt ISO string]
// Pattern per group: MD1 (T1vT2, T3vT4), MD2 (T1vT3, T2vT4), MD3 (T1vT4, T2vT3)
const matchFixtures = [
  // GROUP A — Mexico, South Korea, Czechia, South Africa
  ["Mexico", "South Korea", "2026-06-11T19:00:00Z"],
  ["Czechia", "South Africa", "2026-06-11T22:00:00Z"],
  ["Mexico", "Czechia", "2026-06-15T19:00:00Z"],
  ["South Korea", "South Africa", "2026-06-15T22:00:00Z"],
  ["Mexico", "South Africa", "2026-06-19T19:00:00Z"],
  ["South Korea", "Czechia", "2026-06-19T19:00:00Z"],

  // GROUP B — Bosnia and Herzegovina, Canada, Qatar, Switzerland
  ["Bosnia and Herzegovina", "Canada", "2026-06-12T16:00:00Z"],
  ["Qatar", "Switzerland", "2026-06-12T19:00:00Z"],
  ["Bosnia and Herzegovina", "Qatar", "2026-06-16T16:00:00Z"],
  ["Canada", "Switzerland", "2026-06-16T19:00:00Z"],
  ["Bosnia and Herzegovina", "Switzerland", "2026-06-20T16:00:00Z"],
  ["Canada", "Qatar", "2026-06-20T16:00:00Z"],

  // GROUP C — Brazil, Haiti, Morocco, Scotland
  ["Brazil", "Morocco", "2026-06-13T19:00:00Z"],
  ["Haiti", "Scotland", "2026-06-13T22:00:00Z"],
  ["Brazil", "Haiti", "2026-06-17T19:00:00Z"],
  ["Morocco", "Scotland", "2026-06-17T22:00:00Z"],
  ["Brazil", "Scotland", "2026-06-21T19:00:00Z"],
  ["Haiti", "Morocco", "2026-06-21T19:00:00Z"],

  // GROUP D — Australia, Paraguay, Turkey, USA
  ["USA", "Paraguay", "2026-06-12T22:00:00Z"],
  ["Australia", "Turkey", "2026-06-13T16:00:00Z"],
  ["USA", "Australia", "2026-06-16T22:00:00Z"],
  ["Paraguay", "Turkey", "2026-06-17T16:00:00Z"],
  ["USA", "Turkey", "2026-06-20T22:00:00Z"],
  ["Paraguay", "Australia", "2026-06-20T22:00:00Z"],

  // GROUP E — Curaçao, Ecuador, Germany, Ivory Coast
  ["Germany", "Ivory Coast", "2026-06-14T16:00:00Z"],
  ["Ecuador", "Curaçao", "2026-06-14T19:00:00Z"],
  ["Germany", "Ecuador", "2026-06-18T16:00:00Z"],
  ["Ivory Coast", "Curaçao", "2026-06-18T19:00:00Z"],
  ["Germany", "Curaçao", "2026-06-22T16:00:00Z"],
  ["Ivory Coast", "Ecuador", "2026-06-22T16:00:00Z"],

  // GROUP F — Japan, Netherlands, Sweden, Tunisia
  ["Netherlands", "Tunisia", "2026-06-14T22:00:00Z"],
  ["Japan", "Sweden", "2026-06-15T16:00:00Z"],
  ["Netherlands", "Japan", "2026-06-18T22:00:00Z"],
  ["Sweden", "Tunisia", "2026-06-19T16:00:00Z"],
  ["Netherlands", "Sweden", "2026-06-22T22:00:00Z"],
  ["Tunisia", "Japan", "2026-06-22T22:00:00Z"],

  // GROUP G — Belgium, Egypt, Iran, New Zealand
  ["Belgium", "Egypt", "2026-06-15T16:00:00Z"],
  ["Iran", "New Zealand", "2026-06-15T22:00:00Z"],
  ["Belgium", "Iran", "2026-06-19T16:00:00Z"],
  ["Egypt", "New Zealand", "2026-06-19T22:00:00Z"],
  ["Belgium", "New Zealand", "2026-06-23T16:00:00Z"],
  ["Egypt", "Iran", "2026-06-23T16:00:00Z"],

  // GROUP H — Cape Verde, Saudi Arabia, Spain, Uruguay
  ["Spain", "Cape Verde", "2026-06-15T19:00:00Z"],
  ["Uruguay", "Saudi Arabia", "2026-06-16T16:00:00Z"],
  ["Spain", "Uruguay", "2026-06-19T22:00:00Z"],
  ["Saudi Arabia", "Cape Verde", "2026-06-20T19:00:00Z"],
  ["Spain", "Saudi Arabia", "2026-06-23T19:00:00Z"],
  ["Cape Verde", "Uruguay", "2026-06-23T19:00:00Z"],

  // GROUP I — France, Iraq, Norway, Senegal
  ["France", "Senegal", "2026-06-16T22:00:00Z"],
  ["Norway", "Iraq", "2026-06-17T16:00:00Z"],
  ["France", "Norway", "2026-06-20T19:00:00Z"],
  ["Senegal", "Iraq", "2026-06-21T16:00:00Z"],
  ["France", "Iraq", "2026-06-24T16:00:00Z"],
  ["Norway", "Senegal", "2026-06-24T16:00:00Z"],

  // GROUP J — Algeria, Argentina, Austria, Jordan
  ["Argentina", "Algeria", "2026-06-17T19:00:00Z"],
  ["Austria", "Jordan", "2026-06-17T22:00:00Z"],
  ["Argentina", "Austria", "2026-06-21T22:00:00Z"],
  ["Algeria", "Jordan", "2026-06-22T16:00:00Z"],
  ["Argentina", "Jordan", "2026-06-25T16:00:00Z"],
  ["Algeria", "Austria", "2026-06-25T16:00:00Z"],

  // GROUP K — Colombia, DR Congo, Portugal, Uzbekistan
  ["Portugal", "Uzbekistan", "2026-06-18T16:00:00Z"],
  ["Colombia", "DR Congo", "2026-06-18T19:00:00Z"],
  ["Portugal", "Colombia", "2026-06-22T19:00:00Z"],
  ["DR Congo", "Uzbekistan", "2026-06-22T22:00:00Z"],
  ["Portugal", "DR Congo", "2026-06-25T19:00:00Z"],
  ["Colombia", "Uzbekistan", "2026-06-25T19:00:00Z"],

  // GROUP L — Croatia, England, Ghana, Panama
  ["England", "Panama", "2026-06-18T22:00:00Z"],
  ["Croatia", "Ghana", "2026-06-19T16:00:00Z"],
  ["England", "Croatia", "2026-06-22T22:00:00Z"],
  ["Panama", "Ghana", "2026-06-23T16:00:00Z"],
  ["England", "Ghana", "2026-06-25T22:00:00Z"],
  ["Panama", "Croatia", "2026-06-25T22:00:00Z"],
];

async function main() {
  console.log("Seeding database...");

  // Create teams
  const createdTeams = new Map<string, string>();
  for (const team of teams) {
    const created = await prisma.team.upsert({
      where: { name: team.name },
      update: {},
      create: team,
    });
    createdTeams.set(team.name, created.id);
  }
  console.log(`✓ ${teams.length} teams created`);

  // Create matches
  let matchCount = 0;
  for (const [home, away, scheduledAt] of matchFixtures) {
    const homeId = createdTeams.get(home as string);
    const awayId = createdTeams.get(away as string);
    if (!homeId || !awayId) {
      console.error(`Team not found: ${home} or ${away}`);
      continue;
    }
    const homeTeam = teams.find((t) => t.name === home)!;
    await prisma.match.upsert({
      where: {
        id:
          `match-${home}-${away}-${scheduledAt}`
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .substring(0, 25) + matchCount,
      },
      update: {},
      create: {
        id:
          `match-${home}-${away}-${scheduledAt}`
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .substring(0, 25) + matchCount,
        homeTeamId: homeId,
        awayTeamId: awayId,
        group: homeTeam.group,
        scheduledAt: new Date(scheduledAt as string),
      },
    });
    matchCount++;
  }
  console.log(`✓ ${matchCount} matches created`);

  // Create default admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      passwordHash: adminHash,
      isAdmin: true,
    },
  });
  console.log("✓ Admin user created (username: admin, password: admin123)");
  console.log("\nSeeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
