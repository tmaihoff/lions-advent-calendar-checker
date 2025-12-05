export interface Member {
  id: string;
  name: string;
  number: string;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
}

export interface WinGroup {
  numbers: string[];
  prize: string;
  sponsor: string;
}

export interface DayData {
  day: number;
  winGroups: WinGroup[];
}

export interface WinEntry {
  day: number;
  member: Member;
  prize: string;
  sponsor: string;
}

export type DataSource = "real" | "simulated" | "none";
export type ActiveTab = "dashboard" | "groups";
