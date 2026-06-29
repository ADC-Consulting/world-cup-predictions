export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BracketClient } from "@/components/BracketClient";

const STAGE_ORDER = ["R32", "R16", "QF", "SF", "F"];

export default async function BracketPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({
      where: { stage: { in: STAGE_ORDER } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
  ]);

  const serialized = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    scheduledAt: m.scheduledAt.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, flag: m.homeTeam.flag },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, flag: m.awayTeam.flag },
    locked: new Date(m.scheduledAt) <= new Date(),
    prediction: predictions.find((p) => p.matchId === m.id)
      ? { homeScore: predictions.find((p) => p.matchId === m.id)!.homeScore, awayScore: predictions.find((p) => p.matchId === m.id)!.awayScore }
      : null,
  }));

  const byStage = STAGE_ORDER.reduce<Record<string, typeof serialized>>((acc, s) => {
    acc[s] = serialized.filter((m) => m.stage === s);
    return acc;
  }, {});

  return <BracketClient byStage={byStage} />;
}
