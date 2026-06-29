"use client";
import { useState } from "react";

// Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿 and England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 use tag-sequence flags, not regional indicators.
const SPECIAL_FLAGS: Record<string, string> = {
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿": "gb-sct",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿": "gb-eng",
};

function emojiToISO(flag: string): string {
  if (SPECIAL_FLAGS[flag]) return SPECIAL_FLAGS[flag];
  return [...flag]
    .map((c) => String.fromCharCode(c.codePointAt(0)! - 0x1f1a5))
    .join("")
    .toLowerCase();
}

export function Flag({
  flag,
  name,
  size = "sm",
}: {
  flag: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-base leading-none">{flag}</span>;
  }

  const iso = emojiToISO(flag);
  const dims: Record<string, [number, number]> = {
    sm: [20, 15],
    md: [24, 18],
    lg: [32, 24],
  };
  const [w, h] = dims[size];
  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${iso}.png`}
      srcSet={`https://flagcdn.com/${w * 2}x${h * 2}/${iso}.png 2x`}
      width={w}
      height={h}
      alt={name}
      className="inline-block rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}
