"use client";
import { useState, useCallback } from "react";
import { calculatePointsForStage, stagePoints } from "@/lib/scoring";
import { PredictTabs } from "@/components/PredictTabs";

type Team = { id: string; name: string; flag: string };
type BracketMatch = {
  id: string;
  stage: string;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  locked: boolean;
  prediction: { homeScore: number; awayScore: number } | null;
};

// WC 2026 bracket — fixed by FIFA draw
// Left half: feeds into M101 (SF Jul 14)
// Right half: feeds into M102 (SF Jul 15)
const LEFT_R32: [string, string][] = [
  ["Germany", "Paraguay"],       // M74 → M89 (R16)
  ["France", "Sweden"],          // M77 → M89
  ["South Africa", "Canada"],    // M73 → M90 (R16)
  ["Netherlands", "Morocco"],    // M75 → M90
  ["Portugal", "Croatia"],       // M83 → M93 (R16)
  ["Spain", "Austria"],          // M84 → M93
  ["USA", "Bosnia and Herzegovina"], // M81 → M94 (R16)
  ["Belgium", "Senegal"],        // M82 → M94
];
const RIGHT_R32: [string, string][] = [
  ["Brazil", "Japan"],           // M76 → M91 (R16)
  ["Ivory Coast", "Norway"],     // M78 → M91
  ["Mexico", "Ecuador"],         // M79 → M92 (R16)
  ["England", "DR Congo"],       // M80 → M92
  ["Argentina", "Cape Verde"],   // M86 → M95 (R16)
  ["Australia", "Egypt"],        // M88 → M95
  ["Switzerland", "Algeria"],    // M85 → M96 (R16)
  ["Colombia", "Ghana"],         // M87 → M96
];
const R16_DATES = ["2026-07-04T21:00:00Z","2026-07-04T17:00:00Z","2026-07-06T19:00:00Z","2026-07-07T00:00:00Z"];
const R16_DATES_RIGHT = ["2026-07-05T20:00:00Z","2026-07-06T00:00:00Z","2026-07-07T16:00:00Z","2026-07-07T20:00:00Z"];
const QF_DATES_LEFT = ["2026-07-09T20:00:00Z","2026-07-10T19:00:00Z"];
const QF_DATES_RIGHT = ["2026-07-11T21:00:00Z","2026-07-12T01:00:00Z"];
const SF_DATE_LEFT = "2026-07-14T19:00:00Z";
const SF_DATE_RIGHT = "2026-07-15T19:00:00Z";
const FINAL_DATE = "2026-07-19T19:00:00Z";
const THIRD_DATE = "2026-07-18T21:00:00Z";

// Slot height in px — all columns use multiples of this
const S = 132;

function fmtShort(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function winner(m: BracketMatch | null): string | null {
  if (!m || m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeam.name;
  if (m.awayScore > m.homeScore) return m.awayTeam.name;
  return null;
}

function PointsBadge({ pts, stage }: { pts: number; stage: string }) {
  const { exact } = stagePoints(stage);
  if (pts === exact) return <span className="text-[9px] font-bold text-green-400 bg-green-500/15 border border-green-500/30 rounded px-1">+{pts}</span>;
  if (pts > 0) return <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-1">+{pts}</span>;
  return <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1">0</span>;
}

function MatchCard({
  match,
  slotH,
  onSaved,
}: {
  match: BracketMatch;
  slotH: number;
  onSaved: (id: string, h: number, a: number) => void;
}) {
  const [home, setHome] = useState(match.prediction?.homeScore?.toString() ?? "");
  const [away, setAway] = useState(match.prediction?.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    if (home === "" || away === "" || match.locked) return;
    setSaving(true);
    try {
      await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: +home, awayScore: +away }),
      });
      onSaved(match.id, +home, +away);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }, [home, away, match.id, match.locked, onSaved]);

  const played = match.homeScore !== null;
  const pts = played && match.prediction !== null
    ? calculatePointsForStage(match.prediction.homeScore, match.prediction.awayScore, match.homeScore!, match.awayScore!, match.stage)
    : null;

  const isWinnerHome = played && match.homeScore! > match.awayScore!;
  const isWinnerAway = played && match.awayScore! > match.homeScore!;

  return (
    <div
      className={`rounded-xl border text-xs w-52 flex flex-col justify-center ${
        played
          ? "bg-white/5 border-white/10"
          : match.locked
          ? "bg-white/3 border-white/5"
          : "bg-[#0f1629] border-white/15"
      }`}
      style={{ maxHeight: slotH - 8 }}
    >
      <div className="px-2.5 pt-2 text-[9px] text-slate-600 font-medium">
        {fmtShort(match.scheduledAt)}
      </div>

      {/* Home */}
      <div className="flex items-center justify-between px-2.5 py-1.5 gap-1.5">
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isWinnerHome ? "opacity-100" : played ? "opacity-40" : ""}`}>
          <span className="text-sm shrink-0">{match.homeTeam.flag}</span>
          <span className={`truncate font-medium ${isWinnerHome ? "text-white" : "text-slate-300"}`}>{match.homeTeam.name}</span>
        </div>
        {played ? (
          <span className={`font-bold text-base w-5 text-center shrink-0 ${isWinnerHome ? "text-white" : "text-slate-500"}`}>{match.homeScore}</span>
        ) : match.locked ? (
          <span className="text-slate-700 text-xs w-5 text-center shrink-0">–</span>
        ) : (
          <input
            type="number" min={0} max={20} value={home}
            onChange={(e) => setHome(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-8 text-center bg-white/10 border border-white/20 rounded py-0.5 text-xs font-bold outline-none focus:border-amber-400 transition-colors shrink-0"
          />
        )}
      </div>

      {/* Away */}
      <div className="flex items-center justify-between px-2.5 pb-1.5 gap-1.5 border-t border-white/5 pt-1.5">
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isWinnerAway ? "opacity-100" : played ? "opacity-40" : ""}`}>
          <span className="text-sm shrink-0">{match.awayTeam.flag}</span>
          <span className={`truncate font-medium ${isWinnerAway ? "text-white" : "text-slate-300"}`}>{match.awayTeam.name}</span>
        </div>
        {played ? (
          <span className={`font-bold text-base w-5 text-center shrink-0 ${isWinnerAway ? "text-white" : "text-slate-500"}`}>{match.awayScore}</span>
        ) : match.locked ? (
          <span className="text-slate-700 text-xs w-5 text-center shrink-0">–</span>
        ) : (
          <input
            type="number" min={0} max={20} value={away}
            onChange={(e) => setAway(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-8 text-center bg-white/10 border border-white/20 rounded py-0.5 text-xs font-bold outline-none focus:border-amber-400 transition-colors shrink-0"
          />
        )}
      </div>

      {/* Footer */}
      {(match.prediction || saving || saved) && (
        <div className="px-2.5 pb-1.5 flex items-center justify-between border-t border-white/5 pt-1">
          <span className="text-[9px] text-slate-600 truncate">
            {match.prediction ? `${match.prediction.homeScore}–${match.prediction.awayScore}` : ""}
          </span>
          <div className="flex items-center gap-1">
            {saving && <span className="text-[9px] text-slate-500">…</span>}
            {saved && <span className="text-[9px] text-green-400">✓</span>}
            {pts !== null && <PointsBadge pts={pts} stage={match.stage} />}
          </div>
        </div>
      )}
    </div>
  );
}

function TBDCard({
  date, round, slotH,
  team1 = null, team2 = null,
}: {
  date: string; round: string; slotH: number;
  team1?: Team | null; team2?: Team | null;
}) {
  return (
    <div
      className="rounded-xl border border-white/5 bg-white/3 w-52 flex flex-col justify-center"
      style={{ maxHeight: slotH - 8, minHeight: 70 }}
    >
      <div className="px-2.5 pt-2 text-[9px] text-slate-600">{fmtShort(date)}</div>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-white/5 mt-1">
        {team1 ? (
          <>
            <span className="text-sm shrink-0">{team1.flag}</span>
            <span className="text-xs text-slate-400 truncate font-medium">{team1.name}</span>
          </>
        ) : (
          <span className="text-xs text-slate-600">TBD</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2.5 pb-1.5 border-t border-white/5">
        {team2 ? (
          <>
            <span className="text-sm shrink-0">{team2.flag}</span>
            <span className="text-xs text-slate-400 truncate font-medium">{team2.name}</span>
          </>
        ) : (
          <span className="text-xs text-slate-600">TBD</span>
        )}
      </div>
      <div className="px-2.5 pb-1.5">
        <span className="text-[9px] text-amber-400/50 font-semibold uppercase tracking-wider">{round}</span>
      </div>
    </div>
  );
}

// A connector arm: draws the ] bracket shape connecting 2 child slots to 1 parent slot
function Arm({ childSlotH }: { childSlotH: number }) {
  return (
    <div className="flex flex-col w-3 shrink-0" style={{ height: childSlotH * 2 }}>
      <div className="flex-1 border-r-2 border-t-2 border-white/10 rounded-tr-lg" />
      <div className="flex-1 border-r-2 border-b-2 border-white/10 rounded-br-lg" />
    </div>
  );
}
// Mirrored arm (for right half)
function ArmLeft({ childSlotH }: { childSlotH: number }) {
  return (
    <div className="flex flex-col w-3 shrink-0" style={{ height: childSlotH * 2 }}>
      <div className="flex-1 border-l-2 border-t-2 border-white/10 rounded-tl-lg" />
      <div className="flex-1 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
    </div>
  );
}

function Slot({ h, children }: { h: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center" style={{ height: h }}>
      {children}
    </div>
  );
}

export function BracketClient({ byStage }: { byStage: Record<string, BracketMatch[]> }) {
  const [matches, setMatches] = useState(byStage);

  const handleSaved = useCallback((stage: string, id: string, h: number, a: number) => {
    setMatches((prev) => ({
      ...prev,
      [stage]: (prev[stage] ?? []).map((m) =>
        m.id === id ? { ...m, prediction: { homeScore: h, awayScore: a } } : m
      ),
    }));
  }, []);

  // Look up R32 match by team names
  const r32 = (home: string, away: string): BracketMatch | null =>
    matches.R32?.find((m) => m.homeTeam.name === home && m.awayTeam.name === away) ?? null;

  // Look up any non-R32 match by stage + either expected team
  const findMatch = (stage: string, team1: string | null, team2: string | null): BracketMatch | null => {
    if (!team1 || !team2) return null;
    return (
      matches[stage]?.find(
        (m) =>
          (m.homeTeam.name === team1 && m.awayTeam.name === team2) ||
          (m.homeTeam.name === team2 && m.awayTeam.name === team1)
      ) ?? null
    );
  };

  const saved = (stage: string) => (id: string, h: number, a: number) =>
    handleSaved(stage, id, h, a);

  // Helper: get the Team object for the winner of a match
  const winnerTeam = (m: BracketMatch | null): Team | null => {
    if (!m || m.homeScore === null || m.awayScore === null) return null;
    if (m.homeScore > m.awayScore) return m.homeTeam;
    if (m.awayScore > m.homeScore) return m.awayTeam;
    return null;
  };

  // Resolve bracket slots for left and right halves
  // Each "group" is 2 R32 → 1 R16 → feeds into QF
  // Returns match (if exists in DB) + advancing teams (shown in TBD slots)
  type Slot = { match: BracketMatch | null; adv1: Team | null; adv2: Team | null };

  const resolveHalf = (
    r32Pairs: [string, string][],
    r16Dates: string[],
    qfDates: string[],
    sfDate: string,
    r16Stage: string,
    qfStage: string,
    sfStage: string,
  ) => {
    const r32Matches = r32Pairs.map(([h, a]) => r32(h, a));

    // R16: winner of pair[0]+pair[1], pair[2]+pair[3], ...
    const r16: Slot[] = [0, 1, 2, 3].map((i) => {
      const m1 = r32Matches[i * 2];
      const m2 = r32Matches[i * 2 + 1];
      const w1 = winner(m1);
      const w2 = winner(m2);
      return {
        match: findMatch(r16Stage, w1, w2),
        adv1: winnerTeam(m1),
        adv2: winnerTeam(m2),
      };
    });

    // QF: winner of r16[0]+r16[1], r16[2]+r16[3]
    const qf: Slot[] = [0, 1].map((i) => {
      const s1 = r16[i * 2];
      const s2 = r16[i * 2 + 1];
      const w1 = winner(s1.match);
      const w2 = winner(s2.match);
      return {
        match: findMatch(qfStage, w1, w2),
        adv1: winnerTeam(s1.match),
        adv2: winnerTeam(s2.match),
      };
    });

    // SF: winner of qf[0]+qf[1]
    const w1 = winner(qf[0].match);
    const w2 = winner(qf[1].match);
    const sf: Slot = {
      match: findMatch(sfStage, w1, w2),
      adv1: winnerTeam(qf[0].match),
      adv2: winnerTeam(qf[1].match),
    };

    return { r32: r32Matches, r16, qf, sf };
  };

  const left = resolveHalf(LEFT_R32, R16_DATES, QF_DATES_LEFT, SF_DATE_LEFT, "R16", "QF", "SF");
  const right = resolveHalf(RIGHT_R32, R16_DATES_RIGHT, QF_DATES_RIGHT, SF_DATE_RIGHT, "R16", "QF", "SF");

  const finalW1 = winner(left.sf.match);
  const finalW2 = winner(right.sf.match);
  const finalSlot: Slot = {
    match: findMatch("F", finalW1, finalW2),
    adv1: winnerTeam(left.sf.match),
    adv2: winnerTeam(right.sf.match),
  };

  const hasR32 = (matches.R32?.length ?? 0) > 0;

  function renderSlot(
    slot: Slot,
    slotH: number,
    tbd_date: string,
    tbd_label: string,
    stage: string,
  ) {
    return slot.match ? (
      <MatchCard match={slot.match} slotH={slotH} onSaved={saved(stage)} />
    ) : (
      <TBDCard date={tbd_date} round={tbd_label} slotH={slotH} team1={slot.adv1} team2={slot.adv2} />
    );
  }

  // Column renderers
  function R32Col({ r32s, side: _side }: { r32s: (BracketMatch | null)[]; side?: string }) {
    return (
      <div className="flex flex-col shrink-0">
        <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest text-center mb-2">R32</div>
        {r32s.map((m, i) => (
          <Slot key={i} h={S}>
            {m ? (
              <MatchCard match={m} slotH={S} onSaved={saved("R32")} />
            ) : (
              <div className="w-52 h-16 rounded-xl border border-white/5 bg-white/3 flex items-center justify-center">
                <span className="text-slate-700 text-xs">TBD</span>
              </div>
            )}
          </Slot>
        ))}
      </div>
    );
  }

  function R16Col({ r16s, dates }: { r16s: Slot[]; dates: string[] }) {
    return (
      <div className="flex flex-col shrink-0">
        <div className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-widest text-center mb-2">R16</div>
        {r16s.map((slot, i) => (
          <Slot key={i} h={S * 2}>
            {renderSlot(slot, S * 2, dates[i], "R16", "R16")}
          </Slot>
        ))}
      </div>
    );
  }

  function QFCol({ qfs, dates }: { qfs: Slot[]; dates: string[] }) {
    return (
      <div className="flex flex-col shrink-0">
        <div className="text-[10px] font-semibold text-amber-400/60 uppercase tracking-widest text-center mb-2">QF</div>
        {qfs.map((slot, i) => (
          <Slot key={i} h={S * 4}>
            {renderSlot(slot, S * 4, dates[i], "Quarter-final", "QF")}
          </Slot>
        ))}
      </div>
    );
  }

  function SFCol({ sf, date }: { sf: Slot; date: string }) {
    return (
      <div className="flex flex-col shrink-0">
        <div className="text-[10px] font-semibold text-amber-400/40 uppercase tracking-widest text-center mb-2">SF</div>
        <Slot h={S * 8}>
          {renderSlot(sf, S * 8, date, "Semi-final", "SF")}
        </Slot>
      </div>
    );
  }

  // Arms between rounds
  function LeftArms({ slots, childH }: { slots: number; childH: number }) {
    return (
      <div className="flex flex-col shrink-0 mt-[22px]">
        {Array.from({ length: slots }).map((_, i) => <Arm key={i} childSlotH={childH} />)}
      </div>
    );
  }
  function RightArms({ slots, childH }: { slots: number; childH: number }) {
    return (
      <div className="flex flex-col shrink-0 mt-[22px]">
        {Array.from({ length: slots }).map((_, i) => <ArmLeft key={i} childSlotH={childH} />)}
      </div>
    );
  }

  if (!hasR32) {
    return (
      <div className="text-center py-20 text-slate-500">
        <div className="text-4xl mb-3">⚔️</div>
        <p className="text-lg">No knockout matches added yet.</p>
        <p className="text-sm mt-1">Check back once the bracket is confirmed.</p>
      </div>
    );
  }

  return (
    <div>
      <PredictTabs />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-400">⚔️ Knockouts</h1>
        <p className="text-slate-400 text-sm mt-1">Predict scores for each match — locks at kick-off. Points escalate each round.</p>
      </div>

      {/* Scoring legend */}
      <div className="flex gap-2 flex-wrap text-[11px] text-slate-500 mb-6">
        {(["R32","R16","QF","SF","F"] as const).map((s) => {
          const { exact, result } = stagePoints(s);
          const label = s === "F" ? "Final" : s;
          return <span key={s} className="bg-white/5 rounded px-2 py-1">{label}: {exact}/{result}</span>;
        })}
        <span className="bg-white/5 rounded px-2 py-1 text-slate-600">exact / correct result</span>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex items-start gap-0" style={{ minWidth: "max-content" }}>

          {/* === LEFT HALF === */}
          <R32Col r32s={left.r32} side="left" />
          <LeftArms slots={4} childH={S} />
          <R16Col r16s={left.r16} dates={R16_DATES} />
          <LeftArms slots={2} childH={S * 2} />
          <QFCol qfs={left.qf} dates={QF_DATES_LEFT} />
          <LeftArms slots={1} childH={S * 4} />
          <SFCol sf={left.sf} date={SF_DATE_LEFT} />

          {/* Connector to Final */}
          <div className="flex flex-col w-4 shrink-0 mt-[22px]" style={{ height: S * 8 }}>
            <div className="flex-1 border-r-2 border-t-2 border-white/10 rounded-tr-lg" />
            <div className="flex-1 border-r-2 border-b-2 border-white/10 rounded-br-lg" />
          </div>

          {/* === CENTER: Final === */}
          <div className="flex flex-col shrink-0">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest text-center mb-2">Final</div>
            <Slot h={S * 16}>
              <div className="flex flex-col items-center gap-3">
                {renderSlot(finalSlot, S * 8, FINAL_DATE, "Final", "F")}
              </div>
            </Slot>
          </div>

          {/* Connector from Final */}
          <div className="flex flex-col w-4 shrink-0 mt-[22px]" style={{ height: S * 8 }}>
            <div className="flex-1 border-l-2 border-t-2 border-white/10 rounded-tl-lg" />
            <div className="flex-1 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
          </div>

          {/* === RIGHT HALF (mirrored) === */}
          <SFCol sf={right.sf} date={SF_DATE_RIGHT} />
          <RightArms slots={1} childH={S * 4} />
          <QFCol qfs={right.qf} dates={QF_DATES_RIGHT} />
          <RightArms slots={2} childH={S * 2} />
          <R16Col r16s={right.r16} dates={R16_DATES_RIGHT} />
          <RightArms slots={4} childH={S} />
          <R32Col r32s={right.r32} />
        </div>
      </div>
    </div>
  );
}
