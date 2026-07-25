import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { searchMove } from "../../data/moves";
import type {
  MoveCategory,
  MoveMaster,
} from "../../types/move";
import type { PokemonTypeId } from "../../types/pokemon";

type MoveAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const typeLabels: Record<PokemonTypeId, string> = {
  normal: "ノーマル",
  fire: "ほのお",
  water: "みず",
  electric: "でんき",
  grass: "くさ",
  ice: "こおり",
  fighting: "かくとう",
  poison: "どく",
  ground: "じめん",
  flying: "ひこう",
  psychic: "エスパー",
  bug: "むし",
  rock: "いわ",
  ghost: "ゴースト",
  dragon: "ドラゴン",
  dark: "あく",
  steel: "はがね",
  fairy: "フェアリー",
};

const typeBadgeClasses: Record<
  PokemonTypeId,
  string
> = {
  normal:
    "bg-slate-100 text-slate-700",
  fire:
    "bg-red-100 text-red-700",
  water:
    "bg-blue-100 text-blue-700",
  electric:
    "bg-yellow-100 text-yellow-800",
  grass:
    "bg-green-100 text-green-700",
  ice:
    "bg-cyan-100 text-cyan-700",
  fighting:
    "bg-orange-100 text-orange-700",
  poison:
    "bg-purple-100 text-purple-700",
  ground:
    "bg-amber-100 text-amber-800",
  flying:
    "bg-sky-100 text-sky-700",
  psychic:
    "bg-pink-100 text-pink-700",
  bug:
    "bg-lime-100 text-lime-700",
  rock:
    "bg-stone-200 text-stone-700",
  ghost:
    "bg-violet-100 text-violet-700",
  dragon:
    "bg-indigo-100 text-indigo-700",
  dark:
    "bg-slate-800 text-white",
  steel:
    "bg-zinc-200 text-zinc-700",
  fairy:
    "bg-rose-100 text-rose-700",
};

const categoryLabels: Record<MoveCategory, string> = {
  physical: "物理",
  special: "特殊",
  status: "変化",
};

function formatNumber(
  value: number | null,
): string {
  return value === null ? "―" : String(value);
}

export function getMoveByName(
  moveName: string,
): MoveMaster | undefined {
  const normalizedName = moveName.trim();

  if (!normalizedName) {
    return undefined;
  }

  return searchMove(normalizedName).find(
    (move) => move.name === normalizedName,
  );
}

function MoveAutocomplete({
  value,
  onChange,
  placeholder = "技名を入力",
}: MoveAutocompleteProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [activeIndex, setActiveIndex] =
    useState(-1);

  const suggestions = useMemo(() => {
    const keyword = value.trim();

    if (!keyword) {
      return [];
    }

    return searchMove(keyword).slice(0, 20);
  }, [value]);

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  function selectMove(move: MoveMaster) {
    onChange(move.name);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleInputChange(
    newValue: string,
  ) {
    onChange(newValue);
    setIsOpen(Boolean(newValue.trim()));
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (!isOpen || suggestions.length === 0) {
      if (
        event.key === "ArrowDown" &&
        value.trim()
      ) {
        setIsOpen(true);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        current >= suggestions.length - 1
          ? 0
          : current + 1,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        current <= 0
          ? suggestions.length - 1
          : current - 1,
      );

      return;
    }

    if (event.key === "Enter") {
      if (activeIndex < 0) {
        return;
      }

      event.preventDefault();
      selectMove(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();

      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function clearValue() {
    onChange("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  const showSuggestions =
    isOpen &&
    value.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) =>
            handleInputChange(
              event.target.value,
            )
          }
          onFocus={() => {
            if (value.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />

        {value && (
          <button
            type="button"
            onClick={clearValue}
            className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="技名を消去"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {suggestions.length > 0 ? (
            suggestions.map(
              (move, index) => {
                const isActive =
                  index === activeIndex;

                return (
                  <button
                    key={move.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() =>
                      setActiveIndex(index)
                    }
                    onClick={() =>
                      selectMove(move)
                    }
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition",
                      isActive
                        ? "bg-blue-50"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {move.name}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span
  className={[
    "inline-flex items-center rounded-full px-2 py-0.5 font-semibold",
    typeBadgeClasses[move.type],
  ].join(" ")}
>
  {typeLabels[move.type]}
</span>

                        <span>
                          {
                            categoryLabels[
                              move.category
                            ]
                          }
                        </span>

                        <span>
                          威力{" "}
                          {formatNumber(
                            move.power,
                          )}
                        </span>

                        <span>
                          命中{" "}
                          {formatNumber(
                            move.accuracy,
                          )}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-slate-400">
                      PP {move.pp}
                    </span>
                  </button>
                );
              },
            )
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              一致する技がありません。
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MoveAutocomplete;