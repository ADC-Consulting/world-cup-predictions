import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const R32: { home: string; away: string; scheduledAt: string; homeScore?: number; awayScore?: number }[] = [
  { home: "South Africa", away: "Canada",              scheduledAt: "2026-06-28T19:00:00Z", homeScore: 0, awayScore: 1 },
  { home: "Brazil",       away: "Japan",               scheduledAt: "2026-06-29T17:00:00Z" },
  { home: "Germany",      away: "Paraguay",            scheduledAt: "2026-06-29T20:30:00Z" },
  { home: "Netherlands",  away: "Morocco",             scheduledAt: "2026-06-30T01:00:00Z" },
  { home: "Ivory Coast",  away: "Norway",              scheduledAt: "2026-06-30T17:00:00Z" },
  { home: "France",       away: "Sweden",              scheduledAt: "2026-06-30T21:00:00Z" },
  { home: "Mexico",       away: "Ecuador",             scheduledAt: "2026-07-01T01:00:00Z" },
  { home: "England",      away: "DR Congo",            scheduledAt: "2026-07-01T16:00:00Z" },
  { home: "Belgium",      away: "Senegal",             scheduledAt: "2026-07-01T20:00:00Z" },
  { home: "USA",          away: "Bosnia and Herzegovina", scheduledAt: "2026-07-02T00:00:00Z" },
  { home: "Spain",        away: "Austria",             scheduledAt: "2026-07-02T19:00:00Z" },
  { home: "Portugal",     away: "Croatia",             scheduledAt: "2026-07-02T23:00:00Z" },
  { home: "Switzerland",  away: "Algeria",             scheduledAt: "2026-07-03T03:00:00Z" },
  { home: "Australia",    away: "Egypt",               scheduledAt: "2026-07-03T18:00:00Z" },
  { home: "Argentina",    away: "Cape Verde",          scheduledAt: "2026-07-03T22:00:00Z" },
  { home: "Colombia",     away: "Ghana",               scheduledAt: "2026-07-04T01:30:00Z" },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

    if (existing) { skipped++; continue; }

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
  }

  return NextResponse.json({ created, skipped });
}
