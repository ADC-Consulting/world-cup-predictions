import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Official 2026 FIFA World Cup goalscorers — AFTER CUTOFF ONLY
// Cutoff: 16 Jun 23:59 CEST (= 16 Jun 21:59 UTC)
// Goals scored in matches that ended before that time are excluded.
// Pre-cutoff matches: all games Jun 12–15 + France-Senegal on Jun 16 (ended ~21:05 UTC).
// Source: Wikipedia — 2026 FIFA World Cup#Goalscorers
// Includes common name variants for fuzzy matching.
const OFFICIAL_SCORERS: { playerName: string; goals: number }[] = [
  // ── 8 goals ──────────────────────────────────────────────────────────────
  // Mbappé: 10 total − 2 pre-cutoff (France-Senegal Jun 16, 66' & 90+6') = 8
  { playerName: "Mbappé", goals: 8 },
  { playerName: "Mbappe", goals: 8 },
  { playerName: "Kylian Mbappé", goals: 8 },

  // ── 8 goals ──────────────────────────────────────────────────────────────
  { playerName: "Messi", goals: 8 },
  { playerName: "Lionel Messi", goals: 8 },

  // ── 7 goals ──────────────────────────────────────────────────────────────
  { playerName: "Bellingham", goals: 7 },
  { playerName: "Jude Bellingham", goals: 7 },
  { playerName: "Haaland", goals: 7 },
  { playerName: "Erling Haaland", goals: 7 },

  // ── 6 goals ──────────────────────────────────────────────────────────────
  { playerName: "Dembélé", goals: 6 },
  { playerName: "Dembele", goals: 6 },
  { playerName: "Kane", goals: 6 },
  { playerName: "Harry Kane", goals: 6 },

  // ── 5 goals ──────────────────────────────────────────────────────────────
  { playerName: "Oyarzabal", goals: 5 },
  { playerName: "Mikel Oyarzabal", goals: 5 },

  // ── 4 goals ──────────────────────────────────────────────────────────────
  { playerName: "Sarr", goals: 4 },
  { playerName: "Ismaila Sarr", goals: 4 },
  { playerName: "Quiñones", goals: 4 },
  { playerName: "Quinones", goals: 4 },

  // ── 3 goals ──────────────────────────────────────────────────────────────
  // Vinícius: 4 total − 1 pre-cutoff (Brazil-Morocco Jun 13, 32') = 3
  { playerName: "Vinícius Júnior", goals: 3 },
  { playerName: "Vinicius Junior", goals: 3 },
  { playerName: "Vinicius Jr", goals: 3 },

  { playerName: "Saka", goals: 3 },
  { playerName: "Bukayo Saka", goals: 3 },

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
  { playerName: "Jiménez", goals: 3 },
  { playerName: "Jimenez", goals: 3 },
  { playerName: "Raul Jimenez", goals: 3 },
  { playerName: "Lautaro Martínez", goals: 3 },
  { playerName: "Lautaro Martinez", goals: 3 },
  { playerName: "Ronaldo", goals: 3 },
  { playerName: "Cristiano Ronaldo", goals: 3 },
  { playerName: "Manzambi", goals: 3 },

  // ── 2 goals ──────────────────────────────────────────────────────────────
  // Barcola: 3 total − 1 pre-cutoff (France-Senegal Jun 16, 82') = 2
  { playerName: "Barcola", goals: 2 },

  // Undav: 3 total − 1 pre-cutoff (Germany-Curaçao Jun 14, 78') = 2
  { playerName: "Undav", goals: 2 },

  // Saibari: 3 total − 1 pre-cutoff (Brazil-Morocco Jun 13, 21') = 2
  { playerName: "Saibari", goals: 2 },

  { playerName: "Mahrez", goals: 2 },
  { playerName: "Riyad Mahrez", goals: 2 },
  { playerName: "Arnautovic", goals: 2 },
  { playerName: "Arnautović", goals: 2 },
  { playerName: "Tielemans", goals: 2 },
  { playerName: "Trossard", goals: 2 },
  { playerName: "Mahmić", goals: 2 },
  { playerName: "Muñoz", goals: 2 },
  { playerName: "Munoz", goals: 2 },
  { playerName: "Pépé", goals: 2 },
  { playerName: "Pepe", goals: 2 },
  { playerName: "Ueda", goals: 2 },
  { playerName: "Ounahi", goals: 2 },
  { playerName: "Rahimi", goals: 2 },
  { playerName: "Merino", goals: 2 },
  { playerName: "Porro", goals: 2 },
  { playerName: "Elanga", goals: 2 },
  { playerName: "Anthony Elanga", goals: 2 },
  { playerName: "Ndoye", goals: 2 },
  { playerName: "Vargas", goals: 2 },
  { playerName: "Enzo Fernández", goals: 2 },
  { playerName: "Enzo Fernandez", goals: 2 },
  { playerName: "Tillman", goals: 2 },
  { playerName: "Malik Tillman", goals: 2 },
  { playerName: "H. Diarra", goals: 2 },
  { playerName: "Hamidou Diarra", goals: 2 },
  { playerName: "Gueye", goals: 2 },
  { playerName: "Idrissa Gueye", goals: 2 },
  { playerName: "Ziko", goals: 2 },

  // ── 1 goal ───────────────────────────────────────────────────────────────
  // Havertz: 3 total − 2 pre-cutoff (Germany-Curaçao Jun 14, 45+5' & 88') = 1
  { playerName: "Havertz", goals: 1 },
  { playerName: "Kai Havertz", goals: 1 },

  // Balogun: 3 total − 2 pre-cutoff (USA-Paraguay Jun 12, 31' & 45+5') = 1
  { playerName: "Balogun", goals: 1 },
  { playerName: "Folarin Balogun", goals: 1 },

  // Larin: 2 total − 1 pre-cutoff (Canada-Bosnia Jun 12, 78') = 1
  { playerName: "Larin", goals: 1 },

  // Summerville: 2 total − 1 pre-cutoff (Netherlands-Japan Jun 14, 64') = 1
  { playerName: "Summerville", goals: 1 },

  // Kamada: 2 total − 1 pre-cutoff (Netherlands-Japan Jun 14, 88') = 1
  { playerName: "Kamada", goals: 1 },

  // Embolo: 2 total − 1 pre-cutoff (Qatar-Switzerland Jun 13, 17') = 1
  { playerName: "Embolo", goals: 1 },
  { playerName: "Breel Embolo", goals: 1 },

  // Diallo (CIV): 2 total − 1 pre-cutoff (Ivory Coast-Ecuador Jun 14, 90') = 1
  { playerName: "Diallo", goals: 1 },

  // Araújo: 2 total − 1 pre-cutoff (Saudi Arabia-Uruguay Jun 15, 80') = 1
  { playerName: "Araújo", goals: 1 },
  { playerName: "Araujo", goals: 1 },

  // Ashour: 2 total − 1 pre-cutoff (Belgium-Egypt Jun 15, 19') = 1
  { playerName: "Ashour", goals: 1 },

  // Rezaeian: 2 total − 1 pre-cutoff (Iran-NZ Jun 15, 32') = 1
  { playerName: "Rezaeian", goals: 1 },

  // Just: 3 total − 2 pre-cutoff (Iran-NZ Jun 15, 7' & 54') = 1
  { playerName: "Just", goals: 1 },

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
  { playerName: "De Bruyne", goals: 1 },
  { playerName: "Kevin De Bruyne", goals: 1 },
  { playerName: "Yamal", goals: 1 },
  { playerName: "Lamine Yamal", goals: 1 },
  { playerName: "Perisic", goals: 1 },
  { playerName: "Perišić", goals: 1 },
  { playerName: "Hakimi", goals: 1 },
  { playerName: "Achraf Hakimi", goals: 1 },
  { playerName: "Kessié", goals: 1 },
  { playerName: "Kessie", goals: 1 },
  { playerName: "Xhaka", goals: 1 },
  { playerName: "Granit Xhaka", goals: 1 },
  { playerName: "Trézéguet", goals: 1 },
  { playerName: "Trezeguet", goals: 1 },
  { playerName: "Enciso", goals: 1 },
  { playerName: "Arda Güler", goals: 1 },
  { playerName: "Arda Guler", goals: 1 },
  { playerName: "Surman", goals: 1 },

  // ── 0 goals after cutoff (all goals were pre-cutoff) ─────────────────────
  // Kept at 0 so the audit table shows ✓ "0 goals" instead of ✗ "not found"
  // Van Dijk: 1 total − 1 pre-cutoff (Netherlands-Japan Jun 14, 51') = 0
  { playerName: "van Dijk", goals: 0 },
  { playerName: "Virgil van Dijk", goals: 0 },
  // Musiala: 1 − 1 (Germany-Curaçao Jun 14) = 0
  { playerName: "Musiala", goals: 0 },
  { playerName: "Jamal Musiala", goals: 0 },
  // Other Germany-Curaçao Jun 14 scorers
  { playerName: "Brown", goals: 0 },
  { playerName: "Nmecha", goals: 0 },
  { playerName: "Schlotterbeck", goals: 0 },
  // Sweden-Tunisia Jun 14 scorers
  { playerName: "Ayari", goals: 0 },
  { playerName: "Isak", goals: 0 },
  { playerName: "Alexander Isak", goals: 0 },
  { playerName: "Gyökeres", goals: 0 },
  { playerName: "Gyokeres", goals: 0 },
  { playerName: "Viktor Gyokeres", goals: 0 },
  { playerName: "Svanberg", goals: 0 },
  // Netherlands-Japan Jun 14
  { playerName: "Nakamura", goals: 0 },
  // USA-Paraguay Jun 12
  { playerName: "Reyna", goals: 0 },
  { playerName: "Gio Reyna", goals: 0 },
  { playerName: "Maurício", goals: 0 },
  // Canada-Bosnia Jun 12
  { playerName: "Cyle Larin", goals: 0 },
  // Haiti-Scotland Jun 13
  { playerName: "McGinn", goals: 0 },
  // Australia-Turkey Jun 13
  { playerName: "Irankunda", goals: 0 },
  { playerName: "Metcalfe", goals: 0 },
  // Iran-NZ Jun 15
  { playerName: "Mohebi", goals: 0 },
  // Saudi-Uruguay Jun 15
  { playerName: "Al-Amri", goals: 0 },
  // France-Senegal Jun 16 (Senegal scorer)
  { playerName: "Mbaye", goals: 0 },
  // Curaçao scorer
  { playerName: "Comenencia", goals: 0 },
  // Tunisia scorer
  { playerName: "Rekik", goals: 0 },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Deduplicate by playerName — keep the first occurrence of each name
  const seen = new Set<string>();
  const unique = OFFICIAL_SCORERS.filter(({ playerName }) => {
    const key = playerName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
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
