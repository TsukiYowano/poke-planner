import { useMemo, useState } from "react";
import { getPokemonById } from "../../data/pokemon";
import type { CandidatePokemon } from "../../types/pokemon";

type CandidateSelectorProps = {
  candidates: CandidatePokemon[];
  value: string;
  onChange: (candidateId: string) => void;
  excludedPokemonIds?: ReadonlySet<string>;
  placeholder?: string;
  disabled?: boolean;
};

function CandidateSelector({
  candidates,
  value,
  onChange,
  excludedPokemonIds,
  placeholder = "候補を選択",
  disabled = false,
}: CandidateSelectorProps) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (excludedPokemonIds?.has(candidate.pokemonId)) return false;
      if (!normalized) return true;
      const pokemon = getPokemonById(candidate.pokemonId);
      return [pokemon?.name, candidate.label, candidate.pokemonId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [candidates, excludedPokemonIds, query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="名前・ラベルで絞り込み"
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      >
        <option value="">{placeholder}</option>
        {options.map((candidate) => {
          const pokemon = getPokemonById(candidate.pokemonId);
          return (
            <option key={candidate.id} value={candidate.id}>
              {pokemon?.name ?? candidate.pokemonId} / {candidate.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default CandidateSelector;
