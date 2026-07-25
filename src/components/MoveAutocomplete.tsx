import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import movesJson from "../../master/moves.json";
import {
  getPokemonTypeBadgeClass,
  getPokemonTypeName,
} from "../data/types";
import type { PokemonTypeId } from "../types/pokemon";

type MoveMaster = {
  id: string;
  jpName: string;
  enName: string;
  type: PokemonTypeId;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
};

type MoveAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const moveMaster: MoveMaster[] = movesJson.map((move) => ({
  ...move,
  type: move.type as PokemonTypeId,
}));

export function getMoveByName(
  moveName: string,
): MoveMaster | undefined {
  const normalizedName = moveName.trim();

  return moveMaster.find(
    (move) => move.jpName === normalizedName,
  );
}

export default function MoveAutocomplete({
  value,
  onChange,
  placeholder = "技名を入力",
}: MoveAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimerRef = useRef<number | null>(null);

  const selectedMove = useMemo(
    () => getMoveByName(value),
    [value],
  );

  const suggestions = useMemo(() => {
    const keyword = value.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return moveMaster
      .filter(
        (move) =>
          move.jpName
            .toLowerCase()
            .includes(keyword) ||
          move.enName
            .toLowerCase()
            .includes(keyword),
      )
      .slice(0, 8);
  }, [value]);

  function selectMove(move: MoveMaster) {
    onChange(move.jpName);
    setIsOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.min(
          current + 1,
          suggestions.length - 1,
        ),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.max(current - 1, 0),
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedSuggestion =
        suggestions[activeIndex];

      if (selectedSuggestion) {
        selectMove(selectedSuggestion);
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => {
          if (blurTimerRef.current) {
            window.clearTimeout(
              blurTimerRef.current,
            );
          }

          setIsOpen(true);
        }}
        onBlur={() => {
          blurTimerRef.current =
            window.setTimeout(() => {
              setIsOpen(false);
            }, 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={[
          "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          selectedMove
            ? getPokemonTypeBadgeClass(
                selectedMove.type,
              )
            : "border-slate-300 bg-white text-slate-900",
        ].join(" ")}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((move, index) => (
            <button
              key={move.id}
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => selectMove(move)}
              className={[
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                index === activeIndex
                  ? "bg-blue-50"
                  : "hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="font-medium text-slate-800">
                {move.jpName}
              </span>

              <span
                className={getPokemonTypeBadgeClass(
                  move.type,
                )}
              >
                {getPokemonTypeName(move.type)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}