import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const [winnerSetting, goalsSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "goldenBootWinner" } }),
    prisma.appSetting.findUnique({ where: { key: "goldenBootGoals" } }),
  ]);
  return NextResponse.json({
    winner: winnerSetting?.value ?? null,
    goals: goalsSetting?.value ? Number(goalsSetting.value) : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { playerName, goals } = await req.json();

  const updates = [];

  if (playerName !== undefined) {
    updates.push(
      prisma.appSetting.upsert({
        where: { key: "goldenBootWinner" },
        update: { value: playerName },
        create: { key: "goldenBootWinner", value: playerName },
      })
    );
  }

  if (goals !== undefined) {
    updates.push(
      prisma.appSetting.upsert({
        where: { key: "goldenBootGoals" },
        update: { value: String(goals) },
        create: { key: "goldenBootGoals", value: String(goals) },
      })
    );
  }

  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
