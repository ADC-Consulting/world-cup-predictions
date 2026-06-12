/*
  Warnings:

  - You are about to drop the `GoldenBootPick` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoldenBootPick";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TopScorerPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    CONSTRAINT "TopScorerPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScorerGoalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "TopScorerPick_userId_slot_key" ON "TopScorerPick"("userId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "ScorerGoalEntry_playerName_key" ON "ScorerGoalEntry"("playerName");
