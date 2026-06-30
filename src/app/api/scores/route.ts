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

  const advanced = await advanceWinner(match);
  return NextResponse.json({ match, advanced });
}

type MatchWithTeams = {
  id: string;
  stage: string;
  scheduledAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string;
  awayTeamId: string;
  penaltyWinnerId: string | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
};

export async function advanceWinner(match: MatchWithTeams) {
  if (!["R32", "R16", "QF", "SF"].includes(match.stage)) return null;
  if (match.homeScore === null || match.awayScore === null) return null;

  const matchTime = match.scheduledAt.toISOString();
  const path = BRACKET_PATHS.find((p) => p.m1 === matchTime || p.m2 === matchTime);
  if (!path) return null;

  // Determine this match's winner — draws require penaltyWinnerId
  let winnerId: string;
  if (match.homeScore > match.awayScore) {
    winnerId = match.homeTeamId;
  } else if (match.awayScore > match.homeScore) {
    winnerId = match.awayTeamId;
  } else {
    if (!match.penaltyWinnerId) return { status: "draw_needs_penalty_winner" };
    winnerId = match.penaltyWinnerId;
  }

  const partnerTime = path.m1 === matchTime ? path.m2 : path.m1;
  const isM1 = path.m1 === matchTime;

  const partnerMatch = await prisma.match.findFirst({
    where: { scheduledAt: new Date(partnerTime) },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!partnerMatch || partnerMatch.homeScore === null || partnerMatch.awayScore === null) {
    return { status: "waiting_for_partner" };
  }

  // Determine partner's winner
  let partnerWinnerId: string;
  if (partnerMatch.homeScore > partnerMatch.awayScore) {
    partnerWinnerId = partnerMatch.homeTeamId;
  } else if (partnerMatch.awayScore > partnerMatch.homeScore) {
    partnerWinnerId = partnerMatch.awayTeamId;
  } else {
    if (!partnerMatch.penaltyWinnerId) return { status: "partner_draw_needs_penalty_winner" };
    partnerWinnerId = partnerMatch.penaltyWinnerId;
  }

  const homeTeamId = isM1 ? winnerId : partnerWinnerId;
  const awayTeamId = isM1 ? partnerWinnerId : winnerId;

  const existing = await prisma.match.findFirst({
    where: { scheduledAt: new Date(path.next), stage: path.nextStage },
  });
  if (existing) {
    // Update teams if needed (re-running after a correction)
    if (existing.homeTeamId !== homeTeamId || existing.awayTeamId !== awayTeamId) {
      await prisma.match.update({
        where: { id: existing.id },
        data: { homeTeamId, awayTeamId },
      });
      return { status: "updated", matchId: existing.id };
    }
    return { status: "already_exists", matchId: existing.id };
  }

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
