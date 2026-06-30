-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'group',
    "scheduledAt" DATETIME NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "penaltyWinnerId" TEXT,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_penaltyWinnerId_fkey" FOREIGN KEY ("penaltyWinnerId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("awayScore", "awayTeamId", "group", "homeScore", "homeTeamId", "id", "scheduledAt", "stage") SELECT "awayScore", "awayTeamId", "group", "homeScore", "homeTeamId", "id", "scheduledAt", "stage" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
