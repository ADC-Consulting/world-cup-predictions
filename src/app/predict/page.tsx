import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PredictClient } from "@/components/PredictClient";

export default async function PredictPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [matches, predictions, champion, topScorerPicks, teams] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ group: "asc" }, { scheduledAt: "asc" }],
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
    prisma.championPick.findUnique({
      where: { userId: session.user.id },
      include: { team: true },
    }),
    prisma.topScorerPick.findMany({
      where: { userId: session.user.id },
      orderBy: { slot: "asc" },
    }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
  ]);

  const now = new Date();
  const enrichedMatches = matches.map((m) => ({
    ...m,
    locked: new Date(m.scheduledAt) <= now,
    prediction: predictions.find((p) => p.matchId === m.id) ?? null,
    scheduledAt: m.scheduledAt.toISOString(),
    homeTeam: { ...m.homeTeam },
    awayTeam: { ...m.awayTeam },
  }));

  const grouped = enrichedMatches.reduce<Record<string, typeof enrichedMatches>>(
    (acc, m) => { (acc[m.group] ??= []).push(m); return acc; },
    {}
  );

  const initialTopScorers = Array.from({ length: 5 }, (_, i) => {
    const pick = topScorerPicks.find((p) => p.slot === i + 1);
    return { slot: i + 1, playerName: pick?.playerName ?? "", position: pick?.position ?? "FORWARD" };
  });

  return (
    <PredictClient
      grouped={grouped}
      teams={teams}
      initialChampion={champion?.teamId ?? null}
      initialTopScorers={initialTopScorers}
    />
  );
}
