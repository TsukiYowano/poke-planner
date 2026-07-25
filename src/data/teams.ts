import type { Team } from "../types/pokemon";

export const teams: Team[] = [
  {
    id: "team-metagross-balance",
    name: "メガメタグロス軸",
    description:
      "メガメタグロスを中心に、対面操作と高速アタッカーを組み合わせた攻めサイクル構築。",
    status: "active",
    createdAt: "2026-07-18T10:00:00+09:00",
    updatedAt: "2026-07-24T15:30:00+09:00",
    pokemon: [
      {
        id: "team-pokemon-metagross",
        pokemonId: "mega-metagross",
        abilityId: "tough-claws",
        nature: "ようき",
        item: "メガストーン",
        moves: [
          "サイコファング",
          "れいとうパンチ",
          "バレットパンチ",
          "かみなりパンチ",
        ],
        effortValues: {
          hp: 12,
          attack: 29,
          speed: 25,
        },
        roleIds: [
          "physical-attacker",
          "fast-attacker",
          "wallbreaker",
          "priority-user",
        ],
        tags: [
          "軸",
          "対面性能",
          "終盤",
        ],
        memo:
          "広い攻撃範囲と先制技で対面性能を確保する。",
      },
      {
        id: "team-pokemon-aegislash",
        pokemonId: "aegislash-shield",
        abilityId: "stance-change",
        nature: "れいせい",
        item: "たべのこし",
        moves: [
          "シャドーボール",
          "ラスターカノン",
          "かげうち",
          "キングシールド",
        ],
        effortValues: {
          hp: 32,
          defense: 1,
          specialAttack: 32,
          specialDefense: 1,
        },
        roleIds: [
          "special-attacker",
          "physical-wall",
          "priority-user",
        ],
        tags: [
          "ブリジュラス対策",
          "クッション",
        ],
        memo:
          "耐性を活かして鋼やフェアリーへ後出しする。",
      },
      {
        id: "team-pokemon-primarina",
        pokemonId: "primarina",
        nature: "ひかえめ",
        item: "オボンのみ",
        moves: [
          "うたかたのアリア",
          "ムーンフォース",
          "クイックターン",
          "エナジーボール",
        ],
        effortValues: {
          hp: 28,
          defense: 20,
          specialAttack: 17,
          speed: 1,
        },
        roleIds: [
          "special-attacker",
          "pivot",
          "special-wall",
        ],
        tags: [
          "雨対策",
          "バシャーモ対策",
          "引き先",
        ],
        memo:
          "クイックターンで有利対面を作る。",
      },
      {
        id: "team-pokemon-hydreigon",
        pokemonId: "hydreigon",
        abilityId: "levitate",
        nature: "おくびょう",
        item: "こだわりスカーフ",
        moves: [
          "あくのはどう",
          "りゅうせいぐん",
          "だいもんじ",
          "とんぼがえり",
        ],
        effortValues: {
          hp: 2,
          specialAttack: 32,
          speed: 32,
        },
        roleIds: [
          "special-attacker",
          "fast-attacker",
          "revenge-killer",
          "pivot",
        ],
        tags: [
          "スカーフ",
          "炎打点",
          "地面無効",
        ],
        memo:
          "スカーフで上から攻撃し、蜻蛉返りで対面操作する。",
      },
      {
        id: "team-pokemon-meowscarada",
        pokemonId: "meowscarada",
        nature: "ようき",
        item: "こだわりスカーフ",
        moves: [
          "トリックフラワー",
          "トリプルアクセル",
          "かわらわり",
          "とんぼがえり",
        ],
        effortValues: {
          hp: 2,
          attack: 32,
          speed: 32,
        },
        roleIds: [
          "physical-attacker",
          "fast-attacker",
          "revenge-killer",
          "pivot",
        ],
        tags: [
          "高速枠",
          "終盤処理",
        ],
        memo:
          "高速と広い攻撃範囲を活かす。",
      },
      {
        id: "team-pokemon-tyranitar",
        pokemonId: "mega-tyranitar",
        nature: "いじっぱり",
        item: "メガストーン",
        moves: [],
        roleIds: [
          "physical-attacker",
          "special-wall",
          "wallbreaker",
        ],
        tags: [
          "リザードンY対策",
          "裏メガ",
        ],
        memo:
          "天候変更と高い特殊耐久を活かす。",
      },
    ],
  },
];