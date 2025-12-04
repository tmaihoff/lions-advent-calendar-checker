import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Users,
  Calendar,
  Gift,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trophy,
  QrCode,
  X,
  Pencil,
} from "lucide-react";

// --- Types ---

// Simplified Member type with fixed avatar (emoji)
interface Member {
  id: string;
  name: string;
  number: string;
  avatar: string; // Emoji character
}

interface Group {
  id: string;
  name: string;
  members: Member[];
}

// Grouped Win type: One prize/sponsor can have multiple winning numbers
interface WinGroup {
  numbers: string[];
  prize: string;
  sponsor: string;
}

interface DayData {
  day: number;
  winGroups: WinGroup[];
}

// --- Constants & Utilities ---

const LIONS_URL =
  "https://www.lionsclub-badduerkheim.de/adventskalender/gewinne-2025";

const CHRISTMAS_AVATARS = [
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

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Meine Familie",
    members: [
      { id: "m1", name: "Papa", number: "1234", avatar: "🎅" },
      { id: "m2", name: "Mama", number: "5678", avatar: "🤶" },
    ],
  },
];

// --- Services ---

const UrlService = {
  // Compact format: groupName;name~number~avatar|name~number~avatar
  // Much shorter than JSON + Base64
  serialize: (groups: Group[]): string => {
    try {
      const group = groups[0];
      if (!group) return "";
      const groupName = group.name;
      const members = group.members;
      // Format: groupName;name~number~avatar|name~number~avatar
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

      // Try new compact format first
      const decoded = decodeURIComponent(data);
      if (decoded.includes("~")) {
        // Check for group name (format: groupName;members)
        let groupName = "Meine Familie";
        let membersData = decoded;

        if (decoded.includes(";")) {
          const [namePart, ...rest] = decoded.split(";");
          groupName = namePart || "Meine Familie";
          membersData = rest.join(";"); // In case name contains semicolons
        }

        // Parse members: name~number~avatar|name~number~avatar
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

      // Fallback: try old Base64 JSON format for backwards compatibility
      const json = decodeURIComponent(atob(data));
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].members) {
        parsed.forEach((g: any) => {
          g.members.forEach((m: any) => {
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

const StorageService = {
  loadGroups: (): Group[] => {
    if (window.location.hash.startsWith("#data=")) {
      const fromUrl = UrlService.deserialize(window.location.hash);
      if (fromUrl) return fromUrl;
    }
    try {
      // Changed key to v2 to avoid conflicts with old complex avatar data
      const saved = localStorage.getItem("lions_groups_v2");
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch (e) {
      return INITIAL_GROUPS;
    }
  },
  saveGroups: (groups: Group[]) => {
    try {
      localStorage.setItem("lions_groups_v2", JSON.stringify(groups));
    } catch (e) {
      console.error("Failed to save groups", e);
    }
  },
  loadWins: (): DayData[] => {
    try {
      // Changed key to v3 for grouped win structure
      const saved = localStorage.getItem("lions_wins_v3");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },
  saveWins: (wins: DayData[]) => {
    localStorage.setItem("lions_wins_v3", JSON.stringify(wins));
  },
};

// --- Components ---

const MemberAvatar: React.FC<{
  avatar: string;
  className?: string;
}> = ({ avatar, className = "w-10 h-10 text-2xl" }) => (
  <div
    className={`flex items-center justify-center rounded-full border-2 border-white shadow-sm bg-slate-50 select-none ${className}`}
  >
    {avatar}
  </div>
);

// Special day decorations for 2025
const getSpecialDayDecoration = (
  day: number
): { emoji: string; label: string } | null => {
  // Nikolaus: December 6
  if (day === 6) return { emoji: "🎅", label: "Nikolaus" };

  // Christmas Eve: December 24
  if (day === 24) return { emoji: "🎄", label: "Heiligabend" };

  // Advent Sundays 2025:
  // 1st Advent: Nov 30 (not shown), 2nd: Dec 7, 3rd: Dec 14, 4th: Dec 21
  if (day === 7) return { emoji: "🕯️🕯️", label: "2. Advent" };
  if (day === 14) return { emoji: "🕯️🕯️🕯️", label: "3. Advent" };
  if (day === 21) return { emoji: "🕯️🕯️🕯️🕯️", label: "4. Advent" };

  return null;
};

// --- Modern V2 Components ---

const HeaderV2 = ({ scrollY }: { scrollY: number }) => {
  // Header starts at 2x size and shrinks to normal as you scroll
  // Logo size stays constant

  // Logo dimensions: 12.6rem = ~202px, so radius = 101px
  const logoSize = 202;
  const logoRadius = logoSize / 2; // 101px

  // Header heights
  const headerHeightMin = 119; // Final/minimum header height (0.85 factor)
  const headerHeightMax = 224; // Starting header height (1.6x, ~80% of previous 2x)
  const headerShrinkRange = headerHeightMax - headerHeightMin; // 84px of shrinking

  // Calculate how much we've scrolled through the shrink phase
  const shrinkProgress = Math.min(1, scrollY / headerShrinkRange);

  // After shrinking completes, header and logo scroll up together
  // They stop when logo center aligns with navbar bottom edge
  const scrollAfterShrink = Math.max(0, scrollY - headerShrinkRange);

  // Logo center at start: headerHeightMax + 64px (from -bottom-16) - logoRadius = 280 + 64 - 84 = 260px
  // Logo center when shrunk: headerHeightMin + 64 - 84 = 120px from header top
  // When sticky: logo center should be at logoRadius (84px) from viewport top
  // So header needs to scroll up by: 120 - 84 = 36px after shrinking
  const maxScrollAfterShrink = headerHeightMin - logoRadius - 20; // ~36px more scroll after shrink

  const parallaxSpeed = 0.5;
  const headerOffset = Math.min(
    scrollAfterShrink * parallaxSpeed,
    maxScrollAfterShrink
  );

  const headerOpacity = Math.max(0, 1 - scrollY / 400);

  // Extra padding that shrinks as header shrinks
  const extraPadding = (1 - shrinkProgress) * 84; // 84px extra at start, 0 at end

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 bg-gradient-to-b from-christmas-red via-red-700 to-christmas-red text-white overflow-visible z-50"
        style={{
          transform: `translateY(-${headerOffset}px)`,
        }}
      >
        {/* Decorative snow dots */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div
          className="max-w-6xl mx-auto px-6 pt-6 relative overflow-hidden"
          style={{
            paddingBottom: `${96 + extraPadding}px`, // pb-24 = 96px base + extra
          }}
        >
          {/* Centered content - scrolls up and fades out */}
          <div
            className="flex flex-col items-center text-center transition-all duration-100"
            style={{
              opacity: headerOpacity,
              transform: `translateY(-${scrollY * 0.8}px)`,
            }}
          >
            <p className="text-red-200 text-sm font-medium mb-3 tracking-wide">
              Lions Club Bad Dürkheim
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2">
              🎄 Adventskalender Checker
            </h1>
            <p className="text-red-100/80 text-sm">Dezember 2025</p>
          </div>
        </div>

        {/* Logo - positioned at bottom of header, moves with header */}
        <div
          className="absolute left-1/2 -bottom-16 z-20"
          style={{
            transform: "translateX(-50%)",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-christmas-gold rounded-full blur-2xl opacity-50 scale-125 animate-pulse-soft"></div>
            <div className="relative w-[12.6rem] h-[12.6rem] bg-white rounded-full shadow-2xl flex items-center justify-center overflow-hidden border-4 border-christmas-gold ring-4 ring-christmas-red">
              <img
                src="/lionslogo.png"
                alt="Lions Club"
                className="object-contain"
                style={{ width: "10.2rem", height: "10.2rem" }}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

const CardV2: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = "", hover = true }) => (
  <div
    className={`bg-white rounded-2xl shadow-soft border border-christmas-green/10 overflow-hidden ${
      hover ? "card-hover" : ""
    } ${className}`}
  >
    {children}
  </div>
);

const DayCardV2: React.FC<{
  day: number;
  data?: DayData;
  groups: Group[];
}> = ({ day, data, groups }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const specialDecoration = getSpecialDayDecoration(day);

  const allMembers = useMemo(() => groups.flatMap((g) => g.members), [groups]);

  const getWinnersForGroup = useCallback(
    (winGroup: WinGroup) => {
      return allMembers.filter((m) => winGroup.numbers.includes(m.number));
    },
    [allMembers]
  );

  const overallWinners = useMemo(() => {
    if (!data) return [];
    const winners: Member[] = [];
    data.winGroups.forEach((group) => {
      const matched = getWinnersForGroup(group);
      winners.push(...matched);
    });
    return winners;
  }, [data, getWinnersForGroup]);

  useEffect(() => {
    if (data && data.winGroups.length > 0) {
      const winningGroupIndex = data.winGroups.findIndex(
        (group) => getWinnersForGroup(group).length > 0
      );
      if (winningGroupIndex !== -1) {
        setSlideIndex(winningGroupIndex);
      }
    }
  }, [data, getWinnersForGroup]);

  const winGroups = data?.winGroups || [];
  const currentGroup = winGroups[slideIndex];

  const winnersForCurrentSlide = currentGroup
    ? getWinnersForGroup(currentGroup)
    : [];
  const isWinningSlide = winnersForCurrentSlide.length > 0;
  const hasMultiple = winGroups.length > 1;

  const displayNumbers = useMemo(() => {
    if (!currentGroup) return [];
    return [...currentGroup.numbers].sort((a, b) => {
      const isAMatch = allMembers.some((m) => m.number === a);
      const isBMatch = allMembers.some((m) => m.number === b);
      if (isAMatch && !isBMatch) return -1;
      if (!isAMatch && isBMatch) return 1;
      return a.localeCompare(b);
    });
  }, [currentGroup, allMembers]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % winGroups.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + winGroups.length) % winGroups.length);
  };

  const isWinner = overallWinners.length > 0;

  return (
    <div
      className={`relative min-h-[180px] p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col group overflow-hidden
        ${
          isWinner
            ? "bg-gradient-to-br from-christmas-gold/20 to-amber-50 border-christmas-gold shadow-glow-gold transform scale-[1.02] z-10"
            : data
            ? "bg-white border-christmas-green/20 hover:border-christmas-red/30 hover:shadow-soft"
            : "bg-christmas-cream/50 border-christmas-green/10 border-dashed"
        }
      `}
    >
      {/* Day Number Header */}
      <div className="flex justify-between items-start mb-3 z-20 relative">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-display font-bold ${
              isWinner
                ? "text-christmas-gold"
                : data
                ? "text-christmas-green"
                : "text-slate-300"
            }`}
          >
            {day}
          </span>
          {specialDecoration && (
            <span
              className="text-lg select-none"
              title={specialDecoration.label}
            >
              {specialDecoration.emoji}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isWinningSlide && winnersForCurrentSlide.length > 0 && (
            <div className="flex items-center gap-1 mr-1">
              {winnersForCurrentSlide.slice(0, 2).map((w) => (
                <div key={w.id} className="flex items-center gap-1">
                  <MemberAvatar
                    avatar={w.avatar}
                    className="w-6 h-6 text-sm border-2 border-christmas-gold bg-white shadow-sm"
                  />
                  <span className="text-xs font-semibold text-amber-700 max-w-[50px] truncate">
                    {w.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          {isWinningSlide && (
            <div className="p-1.5 bg-christmas-gold rounded-lg shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          )}
          {data && !isWinningSlide && isWinner && (
            <div className="w-2.5 h-2.5 rounded-full bg-christmas-gold animate-pulse-soft"></div>
          )}
        </div>
      </div>

      {data ? (
        <div className="flex-1 flex flex-col relative z-20">
          <div className="flex-1 flex flex-col min-h-[100px]">
            <p className="text-[10px] uppercase tracking-widest text-christmas-green/60 font-bold mb-1.5 truncate">
              {currentGroup.sponsor}
            </p>
            <p
              className={`text-sm font-medium leading-snug line-clamp-3 mb-3 ${
                isWinningSlide ? "text-amber-800" : "text-slate-700"
              }`}
            >
              {currentGroup.prize}
            </p>

            {/* Winning Numbers - Single row, horizontally scrollable */}
            <div
              className="mt-auto overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div
                className="flex gap-1.5 pb-1"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {displayNumbers.map((num) => {
                  const isMatch = allMembers.some((m) => m.number === num);
                  return (
                    <div
                      key={num}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0
                        ${
                          isMatch
                            ? "bg-gradient-to-r from-christmas-gold to-amber-500 text-white shadow-sm"
                            : "bg-christmas-green/10 text-christmas-green/70"
                        }
                      `}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          {hasMultiple && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-christmas-green/10">
              <button
                onClick={prevSlide}
                className="p-1.5 hover:bg-christmas-green/10 rounded-lg text-christmas-green/50 hover:text-christmas-green transition btn-press"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {winGroups.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === slideIndex
                        ? "bg-christmas-red w-4"
                        : "bg-christmas-green/30"
                    }`}
                  ></div>
                ))}
              </div>
              <button
                onClick={nextSlide}
                className="p-1.5 hover:bg-christmas-green/10 rounded-lg text-christmas-green/50 hover:text-christmas-green transition btn-press"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="p-3 bg-christmas-red/10 rounded-xl">
            <Gift className="w-6 h-6 text-christmas-red/40" />
          </div>
          {/* <p className="text-xs text-slate-400 mt-2 font-medium">🎁</p> */}
        </div>
      )}
    </div>
  );
};

// --- Modern App V2 ---

const AppV2 = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "groups">(
    "dashboard"
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<"real" | "simulated" | "none">(
    "none"
  );
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load Data
  useEffect(() => {
    const loadedGroups = StorageService.loadGroups();
    if (loadedGroups.length === 0) {
      setGroups([{ id: generateId(), name: "Meine Gruppe", members: [] }]);
    } else {
      setGroups(loadedGroups);
    }
    setDayData(StorageService.loadWins());

    const lastTime = localStorage.getItem("lions_last_check");
    if (lastTime && lastTime !== "Invalid Date") {
      try {
        setLastChecked(new Date(lastTime));
      } catch (e) {}
    }

    const savedSource = localStorage.getItem("lions_data_source");
    if (savedSource) setDataSource(savedSource as any);
  }, []);

  // Save Data
  useEffect(() => {
    StorageService.saveGroups(groups);
  }, [groups]);
  useEffect(() => {
    StorageService.saveWins(dayData);
  }, [dayData]);
  useEffect(() => {
    if (dataSource) localStorage.setItem("lions_data_source", dataSource);
  }, [dataSource]);

  // Auto-check on page load (only once)
  useEffect(() => {
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      checkWebsiteV2(false);
    }
  }, [initialCheckDone]);

  const getShareUrl = () => {
    const serialized = UrlService.serialize(groups);
    return `${window.location.origin}${window.location.pathname}#data=${serialized}`;
  };

  const copyShareLink = () => {
    const url = getShareUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Link kopiert! Du kannst diese URL mit deiner Familie teilen.");
      })
      .catch(() => {
        prompt("Kopiere diesen Link zum Teilen:", url);
      });
  };

  const parseWinsFromHtml = (html: string): DayData[] => {
    const results: DayData[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const dayNodes = doc.querySelectorAll(".gewinntag");

    dayNodes.forEach((dayNode) => {
      const h2 = dayNode.querySelector("h2");
      if (!h2) return;
      const dateMatch = h2.innerText.match(/(\d+)\./);
      if (!dateMatch) return;
      const day = parseInt(dateMatch[1]);

      const dayWinGroups: WinGroup[] = [];
      const sponsorDivs = dayNode.querySelectorAll(".bg-primary.row");

      sponsorDivs.forEach((sponsorDiv) => {
        let sponsorName = "Unknown Sponsor";

        const h4 = sponsorDiv.querySelector("h4");
        if (h4 && h4.textContent) {
          const text = h4.textContent;
          const match = text.match(/Sponsor:\s*(.*)/i);
          if (match) {
            sponsorName = match[1].trim();
          } else {
            sponsorName = text.trim();
          }
        } else {
          const sponsorText = sponsorDiv.textContent || "";
          const sponsorMatch = sponsorText.match(
            /Sponsor:\s*(.*?)(Sponsor anzeigen|$)/i
          );
          if (sponsorMatch) {
            sponsorName = sponsorMatch[1].trim();
          }
        }

        if (sponsorName.toLowerCase().endsWith("sponsor anzeigen")) {
          sponsorName = sponsorName
            .substring(0, sponsorName.length - "sponsor anzeigen".length)
            .trim();
        }

        let nextEl = sponsorDiv.nextElementSibling;
        while (nextEl) {
          if (nextEl.tagName === "TABLE") break;
          if (nextEl.classList.contains("bg-primary")) {
            nextEl = null;
            break;
          }
          nextEl = nextEl.nextElementSibling;
        }

        if (nextEl && nextEl.tagName === "TABLE") {
          const rows = nextEl.querySelectorAll("tbody tr");
          rows.forEach((tr) => {
            const nrTd = tr.querySelector(".nr");
            const allTds = tr.querySelectorAll("td");

            let prizeTd: Element | null = null;
            allTds.forEach((td) => {
              if (!td.classList.contains("nr")) prizeTd = td;
            });

            if (nrTd && prizeTd) {
              const numberRaw = nrTd.textContent?.trim() || "";
              const prizeRaw = prizeTd.textContent?.trim() || "";
              const number = numberRaw.replace(/\s+/g, "");
              const prize = prizeRaw.replace(/\s+/g, " ");

              if (number && prize) {
                const existingGroup = dayWinGroups.find(
                  (g) => g.sponsor === sponsorName && g.prize === prize
                );

                if (existingGroup) {
                  existingGroup.numbers.push(number);
                } else {
                  dayWinGroups.push({
                    sponsor: sponsorName,
                    prize: prize,
                    numbers: [number],
                  });
                }
              }
            }
          });
        }
      });

      if (dayWinGroups.length > 0) {
        results.push({ day, winGroups: dayWinGroups });
      }
    });

    return results.sort((a, b) => a.day - b.day);
  };

  const generateSimulationData = () => {
    const newWins: DayData[] = [];
    const today = new Date().getDate();
    const isDec = new Date().getMonth() === 11;
    const limit = isDec ? Math.min(today, 24) : 24;

    const flatMembers = groups.flatMap((g) => g.members);
    const randomMember =
      flatMembers[Math.floor(Math.random() * flatMembers.length)];

    for (let i = 1; i <= limit; i++) {
      const winsForDay: WinGroup[] = [];
      const numPrizes = Math.floor(Math.random() * 2) + 1;

      for (let p = 0; p < numPrizes; p++) {
        const numbers = [];
        for (let k = 0; k < 5; k++) {
          numbers.push(Math.floor(1000 + Math.random() * 9000).toString());
        }

        const isUserWin = randomMember && i === limit && p === 0;
        if (isUserWin) {
          numbers.push(randomMember.number);
        }

        winsForDay.push({
          numbers: numbers,
          prize: `(Demo) ${
            [
              "Wellness-Gutschein",
              "Wein-Paket",
              "Einkaufsgutschein",
              "Dinner für Zwei",
            ][p % 4]
          } €${i * 5 + 20}`,
          sponsor: [
            "Bäckerei am Markt",
            "Weingut Müller",
            "Grand Hotel",
            "Buchhandlung",
          ][p % 4],
        });
      }

      newWins.push({ day: i, winGroups: winsForDay });
    }
    return newWins;
  };

  const checkWebsiteV2 = async (forceSimulate = false) => {
    setLoading(true);
    setScrapeError(null);
    let isSimulating = forceSimulate;
    let newDayData: DayData[] = [];

    try {
      if (!isSimulating) {
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(
            LIONS_URL
          )}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Failed to fetch via proxy");

          const htmlText = await response.text();
          if (!htmlText) throw new Error("Empty response");

          newDayData = parseWinsFromHtml(htmlText);

          if (newDayData.length === 0) {
            throw new Error(
              "No numbers found. HTML structure might have changed."
            );
          }
          setDataSource("real");
        } catch (err: any) {
          console.warn("Real scrape failed:", err);
          setScrapeError(err.message || "Connection failed");
          isSimulating = true;
        }
      }

      if (isSimulating) {
        setDataSource("simulated");
        if (!forceSimulate) await new Promise((r) => setTimeout(r, 800));
        else await new Promise((r) => setTimeout(r, 1000));
        newDayData = generateSimulationData();
      }

      setDayData(newDayData);
      setLastChecked(new Date());
      localStorage.setItem("lions_last_check", new Date().toISOString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- V2 Dashboard ---
  const DashboardV2 = () => (
    <div className="space-y-8">
      {/* Hero Status Card */}
      <CardV2 className="p-6 border-christmas-green/20" hover={false}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-christmas-red/10 rounded-xl">
                <Calendar className="w-5 h-5 text-christmas-red" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                  ❄️ Adventskalender Status
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-500">
                    Letzte Prüfung:{" "}
                    {lastChecked
                      ? lastChecked.toLocaleTimeString()
                      : "Noch nie"}
                  </span>
                  {dataSource === "real" && (
                    <span className="text-xs bg-christmas-green/20 text-christmas-green px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-christmas-green rounded-full animate-pulse"></span>
                      Live
                    </span>
                  )}
                  {dataSource === "simulated" && (
                    <span className="text-xs bg-christmas-gold/20 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                      🎭 Demo
                    </span>
                  )}
                </div>
              </div>
            </div>
            {scrapeError && dataSource === "simulated" && (
              <p className="text-sm text-amber-700 flex items-center gap-2 bg-christmas-gold/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {scrapeError}. Demo-Daten
                werden angezeigt.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => checkWebsiteV2(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-christmas-green to-green-700 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 shadow-md btn-press font-medium"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Jetzt prüfen
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 bg-christmas-red/10 text-christmas-red px-4 py-2.5 rounded-xl hover:bg-christmas-red/20 transition btn-press font-medium"
            >
              <QrCode className="w-4 h-4" />
              Teilen
            </button>
          </div>
        </div>
      </CardV2>

      {/* Members Quick View */}
      <CardV2 className="p-6 border-christmas-green/20" hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-christmas-green" />
            🎄 Meine Gruppe
          </h3>
          <button
            onClick={() => setActiveTab("groups")}
            className="text-sm text-christmas-red hover:text-red-700 font-medium"
          >
            Bearbeiten →
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {groups
            .flatMap((g) => g.members)
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 bg-christmas-cream rounded-full pl-1.5 pr-4 py-1.5 border border-christmas-green/20 hover:border-christmas-green/40 hover:shadow-sm transition"
              >
                <MemberAvatar
                  avatar={member.avatar}
                  className="w-8 h-8 text-lg border-2 border-white shadow-sm bg-white"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {member.name}
                </span>
                <span className="text-xs font-mono bg-christmas-green/20 px-2 py-0.5 rounded-md text-christmas-green">
                  #{member.number}
                </span>
              </div>
            ))}
          {groups.flatMap((g) => g.members).length === 0 && (
            <button
              onClick={() => setActiveTab("groups")}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-christmas-red transition"
            >
              <Plus className="w-4 h-4" /> Mitglieder hinzufügen
            </button>
          )}
        </div>
      </CardV2>

      {/* Wins Section */}
      {(() => {
        const allMembers = groups.flatMap((g) => g.members);
        const allWins: {
          day: number;
          member: Member;
          prize: string;
          sponsor: string;
        }[] = [];

        dayData.forEach((dd) => {
          dd.winGroups.forEach((wg) => {
            wg.numbers.forEach((num) => {
              const winner = allMembers.find((m) => m.number === num);
              if (winner) {
                allWins.push({
                  day: dd.day,
                  member: winner,
                  prize: wg.prize,
                  sponsor: wg.sponsor,
                });
              }
            });
          });
        });

        if (allWins.length === 0) return null;

        return (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-50 via-gold-100/50 to-gold-50 p-6 border-2 border-gold-200 shadow-glow-gold">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h3 className="font-display font-bold text-gold-800 flex items-center gap-3 mb-4">
                <div className="p-2 bg-gold-200 rounded-xl">
                  <Trophy className="w-5 h-5 text-gold-600" />
                </div>
                Gewinne
                <span className="text-sm bg-gold-200 text-gold-700 px-3 py-1 rounded-full font-bold">
                  {allWins.length}
                </span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {allWins.map((win, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gold-200 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-500 rounded-xl text-white font-display font-bold text-lg shadow-sm">
                      {win.day}
                    </div>
                    <MemberAvatar
                      avatar={win.member.avatar}
                      className="w-10 h-10 text-xl border-2 border-gold-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold-800">
                          {win.member.name}
                        </span>
                        <span className="text-xs font-mono bg-gold-500 text-white px-2 py-0.5 rounded-md">
                          #{win.member.number}
                        </span>
                      </div>
                      <p className="text-sm text-gold-700 truncate">
                        {win.prize}
                      </p>
                      <p className="text-xs text-gold-500 uppercase tracking-wider truncate font-medium">
                        {win.sponsor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Calendar Grid */}
      <div>
        <h3 className="text-xl font-display font-bold text-surface-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-xl">
            <Calendar className="w-5 h-5 text-brand-600" />
          </div>
          Dezember 2025
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
            const data = dayData.find((d) => d.day === day);
            return (
              <DayCardV2 key={day} day={day} data={data} groups={groups} />
            );
          })}
        </div>
      </div>
    </div>
  );

  // --- V2 Groups View ---
  const GroupsViewV2 = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState<string | null>(
      null
    );
    const [groupNameInput, setGroupNameInput] = useState("");
    const [newName, setNewName] = useState("");
    const [newNumber, setNewNumber] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("🎅");

    const handleAddMember = (groupId: string) => {
      if (!newName || !newNumber) return;
      const member: Member = {
        id: generateId(),
        name: newName,
        number: newNumber,
        avatar: selectedAvatar,
      };
      setGroups(
        groups.map((g) =>
          g.id === groupId ? { ...g, members: [...g.members, member] } : g
        )
      );
      resetForm();
    };

    const handleEditMember = (groupId: string, memberId: string) => {
      if (!newName || !newNumber) return;
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId
                    ? {
                        ...m,
                        name: newName,
                        number: newNumber,
                        avatar: selectedAvatar,
                      }
                    : m
                ),
              }
            : g
        )
      );
      resetForm();
    };

    const startEditMember = (member: Member) => {
      setEditingMemberId(member.id);
      setNewName(member.name);
      setNewNumber(member.number);
      setSelectedAvatar(member.avatar);
    };

    const resetForm = () => {
      setNewName("");
      setNewNumber("");
      setEditingId(null);
      setEditingMemberId(null);
      setEditingGroupName(null);
      setGroupNameInput("");
      setSelectedAvatar("🎅");
    };

    const startEditGroupName = (group: Group) => {
      setEditingGroupName(group.id);
      setGroupNameInput(group.name);
    };

    const handleSaveGroupName = (groupId: string) => {
      if (!groupNameInput.trim()) return;
      setGroups(
        groups.map((g) =>
          g.id === groupId ? { ...g, name: groupNameInput.trim() } : g
        )
      );
      setEditingGroupName(null);
      setGroupNameInput("");
    };

    const removeMember = (groupId: string, memberId: string) => {
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
            : g
        )
      );
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold text-surface-800">
          Meine Gruppe
        </h2>

        {groups.map((group) => (
          <CardV2 key={group.id} className="p-6" hover={false}>
            <div className="flex items-center gap-4 mb-6 border-b border-surface-100 pb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                {editingGroupName === group.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      value={groupNameInput}
                      onChange={(e) => setGroupNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveGroupName(group.id);
                        if (e.key === "Escape") resetForm();
                      }}
                      className="font-display font-bold text-lg text-surface-800 bg-white border-2 border-brand-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-200 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGroupName(group.id)}
                      className="text-accent-600 hover:text-accent-700 text-sm font-semibold"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={resetForm}
                      className="text-surface-400 hover:text-surface-600 text-sm"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <div
                    className="group/name cursor-pointer"
                    onClick={() => startEditGroupName(group)}
                  >
                    <h3 className="font-display font-bold text-lg text-surface-800 flex items-center gap-2">
                      {group.name}
                      <Pencil className="w-4 h-4 text-surface-300 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                    </h3>
                  </div>
                )}
                <p className="text-sm text-surface-500">
                  {group.members.length} Mitglieder
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map((member) =>
                editingMemberId === member.id ? (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl border-2 border-brand-300 bg-brand-50/30 col-span-1 md:col-span-2 lg:col-span-3"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="font-display font-bold text-surface-700">
                        Mitglied bearbeiten
                      </h4>
                      <button
                        onClick={resetForm}
                        className="text-surface-400 hover:text-surface-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Name
                          </label>
                          <input
                            placeholder="z.B. Oma"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Losnummer
                          </label>
                          <input
                            placeholder="z.B. 1234"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400 font-mono"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                          Avatar wählen
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {CHRISTMAS_AVATARS.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => setSelectedAvatar(avatar)}
                              className={`w-11 h-11 flex items-center justify-center text-xl rounded-xl border-2 transition-all btn-press
                                ${
                                  selectedAvatar === avatar
                                    ? "ring-2 ring-brand-300 scale-110 border-brand-500 bg-white shadow-md"
                                    : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                                }
                              `}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pt-5 flex gap-3">
                      <button
                        onClick={() => handleEditMember(group.id, member.id)}
                        className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 rounded-xl hover:from-accent-600 hover:to-accent-700 font-semibold shadow-md btn-press"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-surface-100 text-surface-600 py-3 rounded-xl hover:bg-surface-200 font-medium btn-press"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-surface-100 bg-surface-50/50 hover:bg-white hover:border-surface-200 hover:shadow-soft transition cursor-pointer group/member"
                    onClick={() => startEditMember(member)}
                  >
                    <MemberAvatar
                      avatar={member.avatar}
                      className="w-14 h-14 text-2xl border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-surface-800 truncate">
                          {member.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditMember(member);
                            }}
                            className="text-surface-300 hover:text-accent-500 opacity-0 group-hover/member:opacity-100 transition-all p-1"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMember(group.id, member.id);
                            }}
                            className="text-surface-300 hover:text-brand-500 transition-all p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <span className="font-mono bg-surface-200/70 px-2 py-1 rounded-lg text-surface-600 text-sm mt-1 inline-block">
                        #{member.number}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div
                className={`rounded-xl border-2 border-dashed overflow-hidden transition-all ${
                  editingId === group.id
                    ? "bg-accent-50/30 border-accent-300 col-span-1 md:col-span-2 lg:col-span-3"
                    : "border-surface-200 hover:border-surface-300 hover:bg-surface-50 min-h-[100px]"
                }`}
              >
                {editingId === group.id ? (
                  <div className="p-5 space-y-5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-display font-bold text-surface-700">
                        Neues Mitglied hinzufügen
                      </h4>
                      <button
                        onClick={resetForm}
                        className="text-surface-400 hover:text-surface-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Name
                          </label>
                          <input
                            placeholder="z.B. Oma"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-accent-200 focus:border-accent-300 outline-none bg-white text-surface-900 placeholder:text-surface-400"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Losnummer
                          </label>
                          <input
                            placeholder="z.B. 1234"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-accent-200 focus:border-accent-300 outline-none bg-white text-surface-900 placeholder:text-surface-400 font-mono"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                          Avatar wählen
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {CHRISTMAS_AVATARS.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => setSelectedAvatar(avatar)}
                              className={`w-11 h-11 flex items-center justify-center text-xl rounded-xl border-2 transition-all btn-press
                                ${
                                  selectedAvatar === avatar
                                    ? "ring-2 ring-accent-300 scale-110 border-accent-500 bg-white shadow-md"
                                    : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                                }
                              `}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100 mt-4">
                          <MemberAvatar
                            avatar={selectedAvatar}
                            className="w-12 h-12 text-2xl"
                          />
                          <span className="text-sm text-surface-400 font-medium">
                            Vorschau
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => handleAddMember(group.id)}
                        className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 rounded-xl hover:from-accent-600 hover:to-accent-700 font-semibold shadow-md btn-press"
                      >
                        Mitglied speichern
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-surface-100 text-surface-600 py-3 rounded-xl hover:bg-surface-200 font-medium btn-press"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingId(group.id)}
                    className="w-full h-full flex flex-col items-center justify-center text-surface-400 gap-2 py-6 hover:text-accent-500 transition-colors"
                  >
                    <div className="p-3 bg-surface-100 rounded-xl group-hover:bg-accent-100 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold">
                      Mitglied hinzufügen
                    </span>
                  </button>
                )}
              </div>
            </div>
          </CardV2>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen modern-bg font-modern flex flex-col">
      <HeaderV2 scrollY={scrollY} />

      {/* Spacer for fixed header + logo (header starts at 2x height = 280px + logo overhang) */}
      <div style={{ height: "440px" }}></div>

      {/* Main content - scrolls faster than header (at normal speed) */}
      <main className="max-w-6xl mx-auto px-6 pt-4 pb-10 w-full flex-1 relative z-20">
        <div className="flex justify-center mb-8">
          <div className="flex p-1.5 bg-white/50 rounded-2xl shadow-sm border border-christmas-green/20 w-full max-w-md">
            {[
              { id: "dashboard", label: "Kalender", icon: Calendar },
              { id: "groups", label: "Mitglieder", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-sm font-semibold rounded-xl transition-all btn-press
                  ${
                    activeTab === tab.id
                      ? "bg-white text-christmas-green shadow-md"
                      : "text-slate-500 hover:text-christmas-red"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "dashboard" ? <DashboardV2 /> : <GroupsViewV2 />}
        </div>
      </main>

      <footer className="text-center text-surface-400 text-sm py-10 border-t border-surface-200 mt-10 max-w-6xl mx-auto px-6">
        <p>
          Lions Club Checker Tool • Nicht verbunden mit Lions Club Bad Dürkheim
        </p>
        <a
          href={LIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          Offiziellen Kalender besuchen <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="mt-4 text-surface-300">
          Tobias Maihoff •{" "}
          <a
            href="mailto:tobiasmaihoff@gmail.com"
            className="hover:text-surface-500 transition-colors"
          >
            Kontakt
          </a>
        </p>
      </footer>

      {/* QR Code Modal V2 - Light mode */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-elevated max-w-sm w-full p-8 relative animate-in fade-in zoom-in-95 duration-200 border border-christmas-green/20">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-christmas-green to-green-700 rounded-2xl mb-5 shadow-lg">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
                🎄 QR-Code teilen
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Scanne diesen Code, um die Gruppe auf einem anderen Gerät zu
                öffnen.
              </p>

              <div className="bg-christmas-cream p-5 rounded-2xl inline-block shadow-sm border border-christmas-green/20">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    getShareUrl()
                  )}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-xs text-slate-400 mt-5 break-all px-4">
                {getShareUrl().length > 60
                  ? getShareUrl().substring(0, 60) + "..."
                  : getShareUrl()}
              </p>

              <button
                onClick={() => {
                  copyShareLink();
                  setShowQrModal(false);
                }}
                className="mt-6 w-full bg-gradient-to-r from-christmas-red to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition font-semibold flex items-center justify-center gap-2 btn-press shadow-lg"
              >
                <Share2 className="w-4 h-4" /> Link kopieren & schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<AppV2 />);
