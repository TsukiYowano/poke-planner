import type { MatchupRating } from "../../types/pokemon";
import { matchupRatingConfig } from "../../utils/matchupRatingDisplay";

function MatchupRatingBadge({
  rating,
  className = "",
}: {
  rating: MatchupRating;
  className?: string;
}) {
  const config = matchupRatingConfig[rating];

  return (
    <span
      title={config.name}
      className={[
        "inline-flex min-w-12 shrink-0 justify-center rounded-md border px-2 py-0.5 text-xs font-bold",
        config.className,
        className,
      ].join(" ")}
    >
      {rating === "unrated" ? "未評価" : config.label}
    </span>
  );
}

export default MatchupRatingBadge;
