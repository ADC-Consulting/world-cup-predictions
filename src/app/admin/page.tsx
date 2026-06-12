import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminClient } from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) redirect("/");

  const [matches, goalEntries] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: "asc" }],
    }),
    prisma.scorerGoalEntry.findMany({ orderBy: { goals: "desc" } }),
  ]);

  const serialized = matches.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    homeTeam: { ...m.homeTeam },
    awayTeam: { ...m.awayTeam },
  }));

  return <AdminClient matches={serialized} initialGoalEntries={goalEntries} />;
}
