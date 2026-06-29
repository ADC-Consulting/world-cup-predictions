import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ group: "asc" }, { scheduledAt: "asc" }],
  });
  return NextResponse.json(matches);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stage, homeTeamId, awayTeamId, scheduledAt } = await req.json();
  if (!stage || !homeTeamId || !awayTeamId || !scheduledAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: { stage, group: stage, homeTeamId, awayTeamId, scheduledAt: new Date(scheduledAt) },
    include: { homeTeam: true, awayTeam: true },
  });
  return NextResponse.json(match);
}
