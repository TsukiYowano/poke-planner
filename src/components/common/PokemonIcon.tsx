import {
  useEffect,
  useState,
} from "react";

type PokemonIconProps = {
  pokemonId: string;
  pokemonName?: string;
  size?: number;
  className?: string;
};

type PokeApiPokemonResponse = {
  sprites: {
    front_default: string | null;
    other: {
      home: {
        front_default: string | null;
      };
      "official-artwork": {
        front_default: string | null;
      };
    };
  };
};

const imageUrlCache = new Map<
  string,
  string | null
>();

function toPokeApiPokemonId(
  pokemonId: string,
): string {
  if (pokemonId.startsWith("mega-")) {
    return `${pokemonId.slice("mega-".length)}-mega`;
  }

  return pokemonId;
}

function PokemonIcon({
  pokemonId,
  pokemonName,
  size = 48,
  className = "",
}: PokemonIconProps) {
  const pokeApiId =
    toPokeApiPokemonId(pokemonId);

  const [imageUrl, setImageUrl] = useState<
    string | null
  >(
    imageUrlCache.get(pokeApiId) ?? null,
  );

  const [isLoading, setIsLoading] =
    useState(
      !imageUrlCache.has(pokeApiId),
    );

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      if (imageUrlCache.has(pokeApiId)) {
        setImageUrl(
          imageUrlCache.get(pokeApiId) ??
            null,
        );
        setIsLoading(false);
        return;
      }

      setImageUrl(null);
      setIsLoading(true);

      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(
            pokeApiId,
          )}`,
        );

        if (!response.ok) {
          throw new Error(
            `PokéAPI request failed: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as PokeApiPokemonResponse;

        const url =
          data.sprites.other.home
            .front_default ??
          data.sprites.other[
            "official-artwork"
          ].front_default ??
          data.sprites.front_default;

        imageUrlCache.set(pokeApiId, url);

        if (!cancelled) {
          setImageUrl(url);
        }
      } catch (error) {
        console.error(
          `ポケモン画像の取得に失敗しました: ${pokemonId} → ${pokeApiId}`,
          error,
        );

        imageUrlCache.set(pokeApiId, null);

        if (!cancelled) {
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
    };
  }, [pokemonId, pokeApiId]);

  if (isLoading) {
    return (
      <div
        className={[
          "shrink-0 animate-pulse rounded-full bg-slate-100",
          className,
        ].join(" ")}
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  if (!imageUrl) {
    return (
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500",
          className,
        ].join(" ")}
        style={{
          width: size,
          height: size,
        }}
        title={pokemonName}
      >
        {pokemonName?.slice(0, 1) ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      width={size}
      height={size}
      alt={pokemonName ?? ""}
      loading="lazy"
      className={[
        "shrink-0 object-contain",
        className,
      ].join(" ")}
    />
  );
}

export default PokemonIcon;