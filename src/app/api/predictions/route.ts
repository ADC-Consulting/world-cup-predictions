import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? session.user.id;

  const [predictions, champion, topScorerPicks] = await Promise.all([
    prisma.prediction.findMany({ where: { userId } }),
    prisma.championPick.findUnique({ where: { userId }, include: { team: true } }),
    prisma.topScorerPick.findMany({ where: { userId }, orderBy: { slot: "asc" } }),
  ]);

  return NextResponse.json({ predictions, champion, topScorerPicks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { matchId, homeScore, awayScore, championTeamId, topScorerPick } = body;

  // Bonus picks (champion + top scorer) lock Monday 15 Jun 23:59 CEST (21:59 UTC)
  const BONUS_LOCK = new Date("2026-06-15T21:59:00Z");
  const bonusLocked = new Date() >= BONUS_LOCK;

  if (championTeamId !== undefined) {
    if (bonusLocked) return NextResponse.json({ error: "Champion pick is locked" }, { status: 400 });
    const pick = await prisma.championPick.upsert({
      where: { userId: session.user.id },
      update: { teamId: championTeamId },
      create: { userId: session.user.id, teamId: championTeamId },
    });
    return NextResponse.json(pick);
  }

  // topScorerPick: { slot: 1-5, playerName: string, position: string }
  if (topScorerPick !== undefined) {
    if (bonusLocked) return NextResponse.json({ error: "Top scorer picks are locked" }, { status: 400 });
    const { slot, playerName, position } = topScorerPick;
    if (!playerName?.trim()) {
      // Delete the slot if cleared
      await prisma.topScorerPick.deleteMany({
        where: { userId: session.user.id, slot },
      });
      return NextResponse.json({ deleted: true });
    }
    const pick = await prisma.topScorerPick.upsert({
      where: { userId_slot: { userId: session.user.id, slot } },
      update: { playerName: playerName.trim(), position },
      create: { userId: session.user.id, slot, playerName: playerName.trim(), position },
    });
    return NextResponse.json(pick);
  }

  // Match prediction
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (new Date(match.scheduledAt) <= new Date()) {
    return NextResponse.json({ error: "Predictions are locked for this match" }, { status: 400 });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
  });

  return NextResponse.json(prediction);
}
