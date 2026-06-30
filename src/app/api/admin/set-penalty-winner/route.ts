import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { advanceWinner } from "@/app/api/scores/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { matchId, teamId } = await req.json();
  if (!matchId || !teamId) {
    return NextResponse.json({ error: "matchId and teamId required" }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { penaltyWinnerId: teamId },
    include: { homeTeam: true, awayTeam: true },
  });

  const advanced = await advanceWinner(match);
  return NextResponse.json({ ok: true, advanced });
}
