import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BRACKET_PATHS } from "@/lib/bracketPaths";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore } = await req.json();

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
    include: { homeTeam: true, awayTeam: true },
  });

  // Auto-advance winner to the next round
  const advanced = await advanceWinner(match);

  return NextResponse.json({ match, advanced });
}

type MatchWithTeams = Awaited<ReturnType<typeof prisma.match.update>> & {
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
};

async function advanceWinner(match: MatchWithTeams) {
  // Only apply to knockout stages
  if (!["R32", "R16", "QF", "SF"].includes(match.stage)) return null;
  if (match.homeScore === null || match.awayScore === null) return null;

  const matchTime = match.scheduledAt.toISOString();

  // Find the bracket path this match belongs to
  const path = BRACKET_PATHS.find(
    (p) => p.m1 === matchTime || p.m2 === matchTime
  );
  if (!path) return null;

  // Get winner team ID
  const winnerId =
    match.homeScore > match.awayScore
      ? match.homeTeamId
      : match.awayTeamId;

  // Find the partner match (the other feeder in the same path)
  const partnerTime = path.m1 === matchTime ? path.m2 : path.m1;
  const isM1 = path.m1 === matchTime;

  const partnerMatch = await prisma.match.findFirst({
    where: { scheduledAt: new Date(partnerTime) },
    include: { homeTeam: true, awayTeam: true },
  });

  // If partner hasn't been played yet, nothing to create
  if (!partnerMatch || partnerMatch.homeScore === null || partnerMatch.awayScore === null) {
    return { status: "waiting_for_partner" };
  }

  const partnerWinnerId =
    partnerMatch.homeScore > partnerMatch.awayScore
      ? partnerMatch.homeTeamId
      : partnerMatch.awayTeamId;

  // Determine home/away: m1 winner = home, m2 winner = away
  const homeTeamId = isM1 ? winnerId : partnerWinnerId;
  const awayTeamId = isM1 ? partnerWinnerId : winnerId;

  // Check if next match already exists (manually added or previously auto-created)
  const existing = await prisma.match.findFirst({
    where: { scheduledAt: new Date(path.next), stage: path.nextStage },
  });
  if (existing) return { status: "already_exists", matchId: existing.id };

  // Auto-create the next round match
  const nextMatch = await prisma.match.create({
    data: {
      stage: path.nextStage,
      group: path.nextStage,
      homeTeamId,
      awayTeamId,
      scheduledAt: new Date(path.next),
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return {
    status: "created",
    nextMatch: `${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name} (${path.nextStage})`,
  };
}
