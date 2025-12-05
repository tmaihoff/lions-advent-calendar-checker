import type { DayData, WinGroup, Group } from "../types";
import { LIONS_URL } from "../constants";

export const parseWinsFromHtml = (html: string): DayData[] => {
  const results: DayData[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const dayNodes = doc.querySelectorAll(".gewinntag");

  dayNodes.forEach((dayNode) => {
    const h2 = dayNode.querySelector("h2");
    if (!h2) return;
    const dateMatch = (h2 as HTMLElement).innerText.match(/(\d+)\./);
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

export const generateSimulationData = (groups: Group[]): DayData[] => {
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

interface FetchResult {
  dayData: DayData[];
  dataSource: "real" | "simulated";
  error: string | null;
}

export const fetchLionsData = async (
  groups: Group[],
  forceSimulate = false
): Promise<FetchResult> => {
  let isSimulating = forceSimulate;
  let dayData: DayData[] = [];
  let error: string | null = null;

  try {
    if (!isSimulating) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(LIONS_URL)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Failed to fetch via proxy");

        const htmlText = await response.text();
        if (!htmlText) throw new Error("Empty response");

        dayData = parseWinsFromHtml(htmlText);

        if (dayData.length === 0) {
          throw new Error("No numbers found. HTML structure might have changed.");
        }

        return { dayData, dataSource: "real", error: null };
      } catch (err: unknown) {
        console.warn("Real scrape failed:", err);
        error = err instanceof Error ? err.message : "Connection failed";
        isSimulating = true;
      }
    }

    if (isSimulating) {
      if (!forceSimulate) await new Promise((r) => setTimeout(r, 800));
      else await new Promise((r) => setTimeout(r, 1000));
      dayData = generateSimulationData(groups);
    }

    return { dayData, dataSource: "simulated", error };
  } catch (err) {
    console.error(err);
    return { dayData: [], dataSource: "simulated", error: "Unknown error" };
  }
};
