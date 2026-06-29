export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminClient } from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) redirect("/");

  const [matches, goalEntries, users, predictions, championPicks, topScorerPicks, teams] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: "asc" }],
    }),
    prisma.scorerGoalEntry.findMany({ orderBy: { goals: "desc" } }),
    prisma.user.findMany({ where: { username: { not: "admin" } }, orderBy: { name: "asc" } }),
    prisma.prediction.findMany(),
    prisma.championPick.findMany({ include: { team: true } }),
    prisma.topScorerPick.findMany({ orderBy: [{ userId: "asc" }, { slot: "asc" }] }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
  ]);

  const serialized = matches.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    homeTeam: { ...m.homeTeam },
    awayTeam: { ...m.awayTeam },
  }));

  return (
    <AdminClient
      matches={serialized}
      initialGoalEntries={goalEntries}
      teams={teams.map((t) => ({ id: t.id, name: t.name, flag: t.flag }))}
      users={users.map((u) => ({ id: u.id, name: u.name, username: u.username }))}
      predictions={predictions.map((p) => ({ userId: p.userId, matchId: p.matchId, homeScore: p.homeScore, awayScore: p.awayScore }))}
      championPicks={championPicks.map((c) => ({ userId: c.userId, teamName: c.team.name, teamFlag: c.team.flag }))}
      topScorerPicks={topScorerPicks.map((t) => ({ userId: t.userId, slot: t.slot, playerName: t.playerName, position: t.position }))}
    />
  );
}
