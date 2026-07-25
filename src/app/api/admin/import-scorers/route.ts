import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Official 2026 FIFA World Cup goalscorers
// Source: Wikipedia — 2026 FIFA World Cup#Goalscorers
// Includes common name variants so fuzzy matching works for typical user inputs
const OFFICIAL_SCORERS: { playerName: string; goals: number }[] = [
  // Top scorers
  { playerName: "Mbappé", goals: 10 },
  { playerName: "Mbappe", goals: 10 },
  { playerName: "Kylian Mbappé", goals: 10 },
  { playerName: "Messi", goals: 8 },
  { playerName: "Lionel Messi", goals: 8 },
  { playerName: "Bellingham", goals: 7 },
  { playerName: "Jude Bellingham", goals: 7 },
  { playerName: "Haaland", goals: 7 },
  { playerName: "Erling Haaland", goals: 7 },
  { playerName: "Dembélé", goals: 6 },
  { playerName: "Dembele", goals: 6 },
  { playerName: "Kane", goals: 6 },
  { playerName: "Harry Kane", goals: 6 },
  { playerName: "Oyarzabal", goals: 5 },
  { playerName: "Mikel Oyarzabal", goals: 5 },
  { playerName: "Sarr", goals: 4 },
  { playerName: "Ismaila Sarr", goals: 4 },
  { playerName: "Quiñones", goals: 4 },
  { playerName: "Quinones", goals: 4 },
  { playerName: "Vinícius Júnior", goals: 4 },
  { playerName: "Vinicius Junior", goals: 4 },
  { playerName: "Vinicius Jr", goals: 4 },
  // 3 goals
  { playerName: "Saka", goals: 3 },
  { playerName: "Bukayo Saka", goals: 3 },
  { playerName: "Barcola", goals: 3 },
  { playerName: "De Ketelaere", goals: 3 },
  { playerName: "Lukaku", goals: 3 },
  { playerName: "Romelu Lukaku", goals: 3 },
  { playerName: "Jonathan David", goals: 3 },
  { playerName: "J. David", goals: 3 },
  { playerName: "Cunha", goals: 3 },
  { playerName: "Matheus Cunha", goals: 3 },
  { playerName: "Wissa", goals: 3 },
  { playerName: "Yoane Wissa", goals: 3 },
  { playerName: "Brobbey", goals: 3 },
  { playerName: "Brian Brobbey", goals: 3 },
  { playerName: "Gakpo", goals: 3 },
  { playerName: "Cody Gakpo", goals: 3 },
  { playerName: "Just", goals: 3 },
  { playerName: "Jiménez", goals: 3 },
  { playerName: "Jimenez", goals: 3 },
  { playerName: "Raul Jimenez", goals: 3 },
  { playerName: "Havertz", goals: 3 },
  { playerName: "Kai Havertz", goals: 3 },
  { playerName: "Undav", goals: 3 },
  { playerName: "Lautaro Martínez", goals: 3 },
  { playerName: "Lautaro Martinez", goals: 3 },
  { playerName: "Saibari", goals: 3 },
  { playerName: "Ronaldo", goals: 3 },
  { playerName: "Cristiano Ronaldo", goals: 3 },
  { playerName: "Balogun", goals: 3 },
  { playerName: "Folarin Balogun", goals: 3 },
  { playerName: "Manzambi", goals: 3 },
  // 2 goals
  { playerName: "Mahrez", goals: 2 },
  { playerName: "Riyad Mahrez", goals: 2 },
  { playerName: "Arnautovic", goals: 2 },
  { playerName: "Arnautović", goals: 2 },
  { playerName: "Tielemans", goals: 2 },
  { playerName: "Trossard", goals: 2 },
  { playerName: "Mahmić", goals: 2 },
  { playerName: "Larin", goals: 2 },
  { playerName: "Muñoz", goals: 2 },
  { playerName: "Munoz", goals: 2 },
  { playerName: "Diallo", goals: 2 },
  { playerName: "Pépé", goals: 2 },
  { playerName: "Pepe", goals: 2 },
  { playerName: "Kamada", goals: 2 },
  { playerName: "Ueda", goals: 2 },
  { playerName: "Summerville", goals: 2 },
  { playerName: "Ounahi", goals: 2 },
  { playerName: "Rahimi", goals: 2 },
  { playerName: "Merino", goals: 2 },
  { playerName: "Porro", goals: 2 },
  { playerName: "Ayari", goals: 2 },
  { playerName: "Elanga", goals: 2 },
  { playerName: "Anthony Elanga", goals: 2 },
  { playerName: "Embolo", goals: 2 },
  { playerName: "Breel Embolo", goals: 2 },
  { playerName: "Ndoye", goals: 2 },
  { playerName: "Vargas", goals: 2 },
  { playerName: "Enzo Fernández", goals: 2 },
  { playerName: "Enzo Fernandez", goals: 2 },
  { playerName: "Tillman", goals: 2 },
  { playerName: "Malik Tillman", goals: 2 },
  { playerName: "Araújo", goals: 2 },
  { playerName: "Araujo", goals: 2 },
  { playerName: "H. Diarra", goals: 2 },
  { playerName: "Hamidou Diarra", goals: 2 },
  { playerName: "Gueye", goals: 2 },
  { playerName: "Idrissa Gueye", goals: 2 },
  { playerName: "Ashour", goals: 2 },
  { playerName: "Ziko", goals: 2 },
  { playerName: "Rezaeian", goals: 2 },
  { playerName: "Iran Rezaeian", goals: 2 },
  // 1 goal
  { playerName: "Salah", goals: 1 },
  { playerName: "Mohamed Salah", goals: 1 },
  { playerName: "Neymar", goals: 1 },
  { playerName: "Casemiro", goals: 1 },
  { playerName: "Martinelli", goals: 1 },
  { playerName: "Gabriel Martinelli", goals: 1 },
  { playerName: "Gordon", goals: 1 },
  { playerName: "Rashford", goals: 1 },
  { playerName: "Marcus Rashford", goals: 1 },
  { playerName: "Rice", goals: 1 },
  { playerName: "Declan Rice", goals: 1 },
  { playerName: "Konsa", goals: 1 },
  { playerName: "Musiala", goals: 1 },
  { playerName: "Jamal Musiala", goals: 1 },
  { playerName: "De Bruyne", goals: 1 },
  { playerName: "Kevin De Bruyne", goals: 1 },
  { playerName: "Yamal", goals: 1 },
  { playerName: "Lamine Yamal", goals: 1 },
  { playerName: "Gyökeres", goals: 1 },
  { playerName: "Gyokeres", goals: 1 },
  { playerName: "Viktor Gyokeres", goals: 1 },
  { playerName: "Isak", goals: 1 },
  { playerName: "Alexander Isak", goals: 1 },
  { playerName: "Perisic", goals: 1 },
  { playerName: "Perišić", goals: 1 },
  { playerName: "van Dijk", goals: 1 },
  { playerName: "Virgil van Dijk", goals: 1 },
  { playerName: "Hakimi", goals: 1 },
  { playerName: "Achraf Hakimi", goals: 1 },
  { playerName: "Kessié", goals: 1 },
  { playerName: "Kessie", goals: 1 },
  { playerName: "Reyna", goals: 1 },
  { playerName: "Gio Reyna", goals: 1 },
  { playerName: "Xhaka", goals: 1 },
  { playerName: "Granit Xhaka", goals: 1 },
  { playerName: "Trézéguet", goals: 1 },
  { playerName: "Trezeguet", goals: 1 },
  { playerName: "Enciso", goals: 1 },
  { playerName: "Arda Güler", goals: 1 },
  { playerName: "Arda Guler", goals: 1 },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Deduplicate by normalized name — keep the first occurrence
  const seen = new Set<string>();
  const unique = OFFICIAL_SCORERS.filter(({ playerName }) => {
    if (seen.has(playerName.toLowerCase())) return false;
    seen.add(playerName.toLowerCase());
    return true;
  });

  await Promise.all(
    unique.map(({ playerName, goals }) =>
      prisma.scorerGoalEntry.upsert({
        where: { playerName },
        update: { goals },
        create: { playerName, goals },
      })
    )
  );

  return NextResponse.json({ ok: true, imported: unique.length });
}
