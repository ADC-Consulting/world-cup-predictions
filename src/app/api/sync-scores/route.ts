import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// football-data.org names → our DB team names
const NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "Czech Republic": "Czechia",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Cape Verde Islands": "Cape Verde",
  "Congo DR": "DR Congo",
  "Curacao": "Curaçao",
};

function normaliseName(name: string): string {
  return NAME_MAP[name] ?? name;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY not set in environment variables" },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": apiKey } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Football API error: ${res.status} — ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const finished: Array<{
    homeTeam: { name: string };
    awayTeam: { name: string };
    score: { fullTime: { home: number | null; away: number | null } };
  }> = data.matches ?? [];

  const allMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const m of finished) {
    const home = normaliseName(m.homeTeam.name);
    const away = normaliseName(m.awayTeam.name);
    const homeScore = m.score.fullTime.home;
    const awayScore = m.score.fullTime.away;

    if (homeScore === null || awayScore === null) continue;

    const dbMatch = allMatches.find(
      (dbm) => dbm.homeTeam.name === home && dbm.awayTeam.name === away
    );

    if (!dbMatch) {
      skipped++;
      continue;
    }

    // skip if score already matches (avoid unnecessary writes)
    if (dbMatch.homeScore === homeScore && dbMatch.awayScore === awayScore) continue;

    await prisma.match.update({
      where: { id: dbMatch.id },
      data: { homeScore, awayScore },
    });
    updated++;
  }

  return NextResponse.json({ updated, skipped, total: finished.length });
}
