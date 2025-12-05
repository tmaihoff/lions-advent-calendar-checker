import type { Group } from "../types";

export const LIONS_URL =
  "https://www.lionsclub-badduerkheim.de/adventskalender/gewinne-2025";

export const CHRISTMAS_AVATARS = [
  "🎅", // Santa
  "🤶", // Mrs. Claus
  "🦌", // Reindeer
  "⛄", // Snowman
  "🎄", // Christmas Tree
  "🎁", // Gift
  "👼", // Angel
  "🕯️", // Candle
  "⭐", // Star
  "❄️", // Snowflake
  "🔔", // Bell
  "🍪", // Cookie
  "🧦", // Stocking
  "🛷", // Sled
  "🎿", // Skis
  "☃️", // Snowman with snow
  "🌟", // Glowing star
  "🍬", // Candy
  "🧣", // Scarf
  "🎶", // Music notes (carols)
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Meine Familie",
    members: [
      { id: "m1", name: "Papa", number: "1234", avatar: "🎅" },
      { id: "m2", name: "Mama", number: "5678", avatar: "🤶" },
    ],
  },
];

export const STORAGE_KEYS = {
  GROUPS: "lions_groups_v2",
  WINS: "lions_wins_v3",
  LAST_CHECK: "lions_last_check",
  DATA_SOURCE: "lions_data_source",
} as const;

export const LIVE_INDICATOR_DURATION = 15 * 60 * 1000; // 15 minutes
