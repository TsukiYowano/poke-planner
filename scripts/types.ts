export interface PokemonMaster {
  id: string;
  jpName: string;
  enName: string;

  types: string[];

  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };

  abilities: string[];

  height: number;
  weight: number;

  sprite: string;
}