import { getPokemonTypeName } from "../../data/types";
import type { PokemonTypeId } from "../../types/pokemon";
import { getTypeClassName } from "../../utils/typeColors";

type TypeBadgeProps = {
  typeId: PokemonTypeId;
  size?: "sm" | "md";
};

function TypeBadge({
  typeId,
  size = "sm",
}: TypeBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border font-semibold",
        getTypeClassName(typeId),
        size === "sm"
          ? "px-2 py-0.5 text-xs"
          : "px-2.5 py-1 text-sm",
      ].join(" ")}
    >
      {getPokemonTypeName(typeId)}
    </span>
  );
}

export default TypeBadge;