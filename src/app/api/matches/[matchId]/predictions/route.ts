import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePointsForStage } from "@/lib/scoring";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await params;

  const [match, predictions, users] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.prediction.findMany({
      where: { matchId },
      include: { user: true },
    }),
    prisma.user.findMany({ where: { isAdmin: false } }),
  ]);

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const locked = new Date(match.scheduledAt) <= new Date();
  const played = match.homeScore !== null;

  if (!locked) {
    return NextResponse.json({
      locked: false,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      scheduledAt: match.scheduledAt.toISOString(),
      totalPredictions: predictions.length,
      totalUsers: users.length,
      predictions: null,
    });
  }

  const rows = predictions.map((p) => ({
    name: p.user.name,
    predHome: p.homeScore,
    predAway: p.awayScore,
    points: played
      ? calculatePointsForStage(p.homeScore, p.awayScore, match.homeScore!, match.awayScore!, match.stage)
      : null,
  })).sort((a, b) => (b.points ?? -1) - (a.points ?? -1));

  return NextResponse.json({
    locked: true,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    scheduledAt: match.scheduledAt.toISOString(),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    totalPredictions: predictions.length,
    totalUsers: users.length,
    predictions: rows,
  });
}
