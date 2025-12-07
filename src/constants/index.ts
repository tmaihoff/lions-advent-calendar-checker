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

export const WICHTEL_AVATARS = [
  // Babies & Kids
  "👶", // Baby
  "👧", // Girl
  "👦", // Boy
  "🧒", // Child
  "👼", // Baby Angel
  // Pets
  "🐕", // Dog
  "🐩", // Poodle
  "🐈", // Cat
  "🐱", // Cat face
  "🐶", // Dog face
  "🐰", // Bunny
  "🐹", // Hamster
  "🐦", // Bird
  "🐠", // Fish
  "🦜", // Parrot
  "🐢", // Turtle
  "🦔", // Hedgehog
  // Cute winter animals
  "🐧", // Penguin
  "🦊", // Fox
  "🐻", // Bear
  "🐨", // Koala
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Meine Losnummern",
    members: [],
  },
];

export const STORAGE_KEYS = {
  GROUPS: "lions_groups_v2",
  WINS: "lions_wins_v3",
  LAST_CHECK: "lions_last_check",
  DATA_SOURCE: "lions_data_source",
  HOWTO_DISMISSED: "lions_howto_dismissed",
} as const;

export const LIVE_INDICATOR_DURATION = 15 * 60 * 1000; // 15 minutes

// Event configuration
export const EVENT_CONFIG = {
  // Event runs from Dec 1 to Dec 24, 2025
  YEAR: 2025,
  START_DAY: 1,
  END_DAY: 24,
  // After this date, don't try to fetch live data anymore
  EVENT_END_DATE: new Date("2025-12-25T00:00:00"),
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  WICHTEL_ENABLED: false, // Set to true to enable Wichtel feature
} as const;
