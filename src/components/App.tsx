import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ExternalLink, Download } from "lucide-react";
import type { Group, DayData, DataSource } from "../types";
import { LIONS_URL, FEATURE_FLAGS } from "../constants";
import { generateId } from "../services/utils";
import { UrlService } from "../services/urlService";
import { StorageService } from "../services/storageService";
import { fetchLionsData, isEventOver } from "../services/dataService";
import { useScrollPosition } from "../hooks";
import { Header } from "./Header";
import { Dashboard } from "./Dashboard";
import { QrModal } from "./QrModal";
import { FloatingWichtel } from "./FloatingWichtel";
import { HowToSection } from "./HowToSection";
import { QuickCheckInput } from "./QuickCheckInput";

export const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("none");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [cachedDataDate, setCachedDataDate] = useState<string | undefined>();

  const eventOver = useMemo(() => isEventOver(), []);
  const isDev = import.meta.env.DEV;

  // Use optimized scroll hook with requestAnimationFrame
  const scrollY = useScrollPosition();

  // Load Data
  useEffect(() => {
    const loadedGroups = StorageService.loadGroups();
    if (loadedGroups.length === 0) {
      setGroups([{ id: generateId(), name: "Meine Losnummern", members: [] }]);
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
    if (savedSource) setDataSource(savedSource as DataSource);
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
      checkWebsite(false);
    }
  }, [initialCheckDone]);

  const getShareUrl = useCallback(() => {
    const serialized = UrlService.serialize(groups);
    return `${window.location.origin}${window.location.pathname}#data=${serialized}`;
  }, [groups]);

  const copyShareLink = useCallback(() => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).catch(() => {
      prompt("Kopiere diesen Link zum Teilen:", url);
    });
  }, [getShareUrl]);

  const checkWebsite = useCallback(
    async (forceSimulate = false) => {
      setLoading(true);
      setScrapeError(null);

      const startTime = Date.now();
      const result = await fetchLionsData(groups, forceSimulate);

      // Ensure minimum 3 second loading time for better UX
      const elapsed = Date.now() - startTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }

      setDayData(result.dayData);
      setDataSource(result.dataSource);
      if (result.error) setScrapeError(result.error);
      if (result.cachedDataDate) setCachedDataDate(result.cachedDataDate);
      setLastChecked(new Date());
      localStorage.setItem("lions_last_check", new Date().toISOString());
      setLoading(false);
    },
    [groups]
  );

  const handleCheck = useCallback(() => {
    checkWebsite(false);
  }, [checkWebsite]);

  const handleShowQr = useCallback(() => {
    setShowQrModal(true);
  }, []);

  const handleCloseQr = useCallback(() => {
    setShowQrModal(false);
  }, []);

  const handleSetGroups = useCallback(
    (newGroups: Group[] | ((prev: Group[]) => Group[])) => setGroups(newGroups),
    []
  );

  const handleAddMemberQuick = useCallback(
    (number: string, name: string, avatar: string) => {
      setGroups((prev) => {
        const newGroups = [...prev];
        if (newGroups.length === 0) {
          newGroups.push({
            id: generateId(),
            name: "Meine Losnummern",
            members: [],
          });
        }
        newGroups[0] = {
          ...newGroups[0],
          members: [
            ...newGroups[0].members,
            {
              id: generateId(),
              name,
              number,
              avatar,
            },
          ],
        };
        return newGroups;
      });
    },
    []
  );

  const shareUrl = useMemo(() => getShareUrl(), [getShareUrl]);

  // Collect all wichtel from all groups
  const allWichtel = useMemo(() => {
    return groups.flatMap((g) => g.wichtel || []);
  }, [groups]);

  // Dev mode: download current data as JSON for bundling
  const handleDownloadData = useCallback(() => {
    const dataToExport = {
      lastUpdated: new Date().toISOString(),
      dayData: dayData,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "initialWins.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [dayData]);

  return (
    <div className="min-h-screen modern-bg font-modern flex flex-col">
      {/* Floating Wichtel around the page */}
      {FEATURE_FLAGS.WICHTEL_ENABLED && (
        <FloatingWichtel wichtel={allWichtel} />
      )}

      <Header scrollY={scrollY} />

      {/* Spacer for fixed header + logo */}
      <div style={{ height: "400px" }} />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 pt-4 pb-10 w-full flex-1 relative z-20">
        <HowToSection onShowQr={handleShowQr} />

        <QuickCheckInput groups={groups} onAddMember={handleAddMemberQuick} />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Dashboard
            groups={groups}
            dayData={dayData}
            lastChecked={lastChecked}
            dataSource={dataSource}
            scrapeError={scrapeError}
            loading={loading}
            isEventOver={eventOver}
            cachedDataDate={cachedDataDate}
            onCheck={handleCheck}
            onShowQr={handleShowQr}
            onSetGroups={handleSetGroups}
          />
        </div>
      </main>

      <footer className="text-center text-surface-400 text-sm py-10 border-t border-surface-200 mt-10 max-w-6xl mx-auto px-6">
        <p>
          Lions Türchen Tracker • Privates Projekt – nicht mit dem Lions Club
          Bad Dürkheim verbunden
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
        {isDev && dayData.length > 0 && (
          <button
            onClick={handleDownloadData}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 bg-surface-100 hover:bg-surface-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download initialWins.json (Dev)
          </button>
        )}
      </footer>

      {showQrModal && (
        <QrModal
          shareUrl={shareUrl}
          onCopy={copyShareLink}
          onClose={handleCloseQr}
        />
      )}
    </div>
  );
};
