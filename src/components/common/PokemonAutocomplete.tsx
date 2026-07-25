import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  getPokemonById,
  pokemonMaster,
} from "../../data/pokemon";
import type { PokemonMaster } from "../../types/pokemon";
import TypeBadge from "./TypeBadge";

type PokemonAutocompleteProps = {
  value: string;
  onChange: (pokemonId: string) => void;

  options?: PokemonMaster[];
  placeholder?: string;
  disabled?: boolean;
};

function toHiragana(text: string) {
  return text.replace(
    /[\u30a1-\u30f6]/g,
    (char) =>
      String.fromCharCode(
        char.charCodeAt(0) - 0x60,
      ),
  );
}

function PokemonAutocomplete({
  value,
  onChange,
  options = pokemonMaster,
  placeholder = "ポケモン名を入力",
  disabled = false,
}: PokemonAutocompleteProps) {
  const selectedPokemon = getPokemonById(value);

  const [inputValue, setInputValue] = useState(
    selectedPokemon?.name ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(selectedPokemon?.name ?? "");
  }, [selectedPokemon?.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);

        const currentPokemon =
          getPokemonById(value);

        setInputValue(
          currentPokemon?.name ?? "",
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [value]);

  const filteredPokemon = useMemo(() => {
  const keyword = toHiragana(
    inputValue.trim().toLowerCase(),
  );

  if (!keyword) {
    return options;
  }

  return options.filter((pokemon) => {
    const searchableText = toHiragana(
      [
        pokemon.name,
        pokemon.enName,
        pokemon.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    );

    return searchableText.includes(keyword);
  });
}, [inputValue, options]);

  function handleInputChange(
    newValue: string,
  ) {
    setInputValue(newValue);
    setIsOpen(true);
    setActiveIndex(0);

    if (!newValue) {
      onChange("");
    }
  }

  function handleSelect(
    pokemon: PokemonMaster,
  ) {
    onChange(pokemon.id);
    setInputValue(pokemon.name);
    setIsOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter"
      ) {
        setIsOpen(true);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.min(
          current + 1,
          filteredPokemon.length - 1,
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

      const pokemon =
        filteredPokemon[activeIndex];

      if (pokemon) {
        handleSelect(pokemon);
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setInputValue(
        selectedPokemon?.name ?? "",
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <input
        type="text"
        value={inputValue}
        onChange={(event) =>
          handleInputChange(event.target.value)
        }
        onFocus={() => {
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filteredPokemon.length > 0 ? (
            filteredPokemon.map(
              (pokemon, index) => (
                <button
                  key={pokemon.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(pokemon);
                  }}
                  onMouseEnter={() =>
                    setActiveIndex(index)
                  }
                  className={[
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition",
                    index === activeIndex
                      ? "bg-blue-50"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {pokemon.name}
                    </p>

                    {pokemon.enName && (
                      <p className="truncate text-xs text-slate-400">
                        {pokemon.enName}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    {pokemon.types
                      .filter(
                        (
                          typeId,
                        ): typeId is NonNullable<
                          typeof typeId
                        > => Boolean(typeId),
                      )
                      .map((typeId) => (
                        <TypeBadge
                          key={typeId}
                          typeId={typeId}
                        />
                      ))}
                  </div>
                </button>
              ),
            )
          ) : (
            <p className="px-3 py-3 text-sm text-slate-400">
              該当するポケモンがいません。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PokemonAutocomplete;