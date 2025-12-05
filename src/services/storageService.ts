import type { Group, DayData, DataSource } from "../types";
import { INITIAL_GROUPS, STORAGE_KEYS } from "../constants";
import { UrlService } from "./urlService";

export const StorageService = {
  loadGroups: (): Group[] => {
    if (window.location.hash.startsWith("#data=")) {
      const fromUrl = UrlService.deserialize(window.location.hash);
      if (fromUrl) return fromUrl;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  },

  saveGroups: (groups: Group[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.error("Failed to save groups", e);
    }
  },

  loadWins: (): DayData[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WINS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveWins: (wins: DayData[]) => {
    localStorage.setItem(STORAGE_KEYS.WINS, JSON.stringify(wins));
  },

  loadLastCheck: (): Date | null => {
    const lastTime = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
    if (lastTime && lastTime !== "Invalid Date") {
      try {
        return new Date(lastTime);
      } catch {
        return null;
      }
    }
    return null;
  },

  saveLastCheck: (date: Date) => {
    localStorage.setItem(STORAGE_KEYS.LAST_CHECK, date.toISOString());
  },

  loadDataSource: (): DataSource => {
    const saved = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE);
    return (saved as DataSource) || "none";
  },

  saveDataSource: (source: DataSource) => {
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCE, source);
  },
};
