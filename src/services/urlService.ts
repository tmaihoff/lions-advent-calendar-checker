import type { Group, Member } from "../types";
import { generateId } from "./utils";

export const UrlService = {
  serialize: (groups: Group[]): string => {
    try {
      const group = groups[0];
      if (!group) return "";
      const groupName = group.name;
      const members = group.members;
      const membersPart = members
        .map((m) => `${m.name}~${m.number}~${m.avatar}`)
        .join("|");
      const compact = `${groupName};${membersPart}`;
      return encodeURIComponent(compact);
    } catch (e) {
      console.error("Failed to serialize", e);
      return "";
    }
  },

  deserialize: (hash: string): Group[] | null => {
    try {
      if (!hash || !hash.startsWith("#data=")) return null;
      const data = hash.replace("#data=", "");

      const decoded = decodeURIComponent(data);
      if (decoded.includes("~")) {
        let groupName = "Meine Familie";
        let membersData = decoded;

        if (decoded.includes(";")) {
          const [namePart, ...rest] = decoded.split(";");
          groupName = namePart || "Meine Familie";
          membersData = rest.join(";");
        }

        const memberStrings = membersData.split("|").filter(Boolean);
        const members: Member[] = memberStrings.map((str) => {
          const [name, number, avatar] = str.split("~");
          return {
            id: generateId(),
            name: name || "Unbekannt",
            number: number || "0000",
            avatar: avatar || "🎅",
          };
        });
        return [{ id: "g1", name: groupName, members }];
      }

      // Fallback: try old Base64 JSON format
      const json = decodeURIComponent(atob(data));
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].members) {
        parsed.forEach((g: Group) => {
          g.members.forEach((m: Member) => {
            if (!m.avatar) m.avatar = "🎅";
          });
        });
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Failed to deserialize URL data", e);
      return null;
    }
  },
};
