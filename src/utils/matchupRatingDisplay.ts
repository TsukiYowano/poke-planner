import type { MatchupRating } from "../types/pokemon";

export const matchupRatingConfig: Record<
  MatchupRating,
  { label: string; name: string; className: string }
> = {
  unrated: {
    label: "－",
    name: "未評価",
    className: "border-slate-200 bg-white text-slate-400",
  },
  "very-good": {
    label: "◎",
    name: "とても有利",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  good: {
    label: "○",
    name: "有利",
    className: "border-green-300 bg-green-50 text-green-700",
  },
  even: {
    label: "△",
    name: "互角",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  bad: {
    label: "×",
    name: "不利",
    className: "border-red-300 bg-red-50 text-red-700",
  },
  "very-bad": {
    label: "××",
    name: "とても不利",
    className: "border-rose-400 bg-rose-100 text-rose-800",
  },
};
