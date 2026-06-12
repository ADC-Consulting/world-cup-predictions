import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, username, password } = await req.json();

  if (!name?.trim() || !username?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (exists) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), username: username.trim(), passwordHash },
  });

  return NextResponse.json({ id: user.id, name: user.name });
}
