import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore } = await req.json();

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
  });

  return NextResponse.json(match);
}
