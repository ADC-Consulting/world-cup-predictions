import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ group: "asc" }, { scheduledAt: "asc" }],
  });
  return NextResponse.json(matches);
}
