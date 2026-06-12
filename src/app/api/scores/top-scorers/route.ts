import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const entries = await prisma.scorerGoalEntry.findMany({
    orderBy: { goals: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { playerName, goals } = await req.json();
  if (!playerName?.trim()) {
    return NextResponse.json({ error: "Player name required" }, { status: 400 });
  }

  const entry = await prisma.scorerGoalEntry.upsert({
    where: { playerName: playerName.trim() },
    update: { goals: Number(goals) },
    create: { playerName: playerName.trim(), goals: Number(goals) },
  });

  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.scorerGoalEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
