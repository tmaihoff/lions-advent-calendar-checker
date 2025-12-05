import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Users, ExternalLink } from "lucide-react";
import type { Group, DayData, DataSource, ActiveTab } from "../types";
import { LIONS_URL, INITIAL_GROUPS, FEATURE_FLAGS } from "../constants";
import { generateId } from "../services/utils";
import { UrlService } from "../services/urlService";
import { StorageService } from "../services/storageService";
import { fetchLionsData } from "../services/dataService";
import { useScrollPosition } from "../hooks";
import { Header } from "./Header";
import { Dashboard } from "./Dashboard";
import { GroupsView } from "./GroupsView";
import { QrModal } from "./QrModal";
import { FloatingWichtel } from "./FloatingWichtel";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [groups, setGroups] = useState<Group[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("none");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Use optimized scroll hook with requestAnimationFrame
  const scrollY = useScrollPosition();

  // Groups editing state (lifted up to prevent reset on scroll)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberNumber, setNewMemberNumber] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎅");

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

      const result = await fetchLionsData(groups, forceSimulate);

      setDayData(result.dayData);
      setDataSource(result.dataSource);
      if (result.error) setScrapeError(result.error);
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

  const handleNavigateToGroups = useCallback(() => {
    setActiveTab("groups");
  }, []);

  const handleNavigateToDashboard = useCallback(() => {
    setActiveTab("dashboard");
  }, []);

  // Form state handlers (memoized)
  const handleSetEditingId = useCallback(
    (id: string | null) => setEditingId(id),
    []
  );
  const handleSetEditingMemberId = useCallback(
    (id: string | null) => setEditingMemberId(id),
    []
  );
  const handleSetEditingGroupName = useCallback(
    (id: string | null) => setEditingGroupName(id),
    []
  );
  const handleSetGroupNameInput = useCallback(
    (val: string) => setGroupNameInput(val),
    []
  );
  const handleSetNewMemberName = useCallback(
    (val: string) => setNewMemberName(val),
    []
  );
  const handleSetNewMemberNumber = useCallback(
    (val: string) => setNewMemberNumber(val),
    []
  );
  const handleSetSelectedAvatar = useCallback(
    (val: string) => setSelectedAvatar(val),
    []
  );
  const handleSetGroups = useCallback(
    (newGroups: Group[] | ((prev: Group[]) => Group[])) => setGroups(newGroups),
    []
  );

  const shareUrl = useMemo(() => getShareUrl(), [getShareUrl]);

  // Collect all wichtel from all groups
  const allWichtel = useMemo(() => {
    return groups.flatMap((g) => g.wichtel || []);
  }, [groups]);

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
        <div className="flex justify-center mb-8">
          <div className="flex p-1.5 bg-white/50 rounded-2xl shadow-sm border border-christmas-green/20 w-full max-w-md">
            {[
              { id: "dashboard" as const, label: "Kalender", icon: Calendar },
              { id: "groups" as const, label: "Mitglieder", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          {activeTab === "dashboard" ? (
            <Dashboard
              groups={groups}
              dayData={dayData}
              lastChecked={lastChecked}
              dataSource={dataSource}
              scrapeError={scrapeError}
              loading={loading}
              onCheck={handleCheck}
              onNavigateToGroups={handleNavigateToGroups}
              onShowQr={handleShowQr}
            />
          ) : (
            <GroupsView
              groups={groups}
              editingId={editingId}
              editingMemberId={editingMemberId}
              editingGroupName={editingGroupName}
              groupNameInput={groupNameInput}
              newMemberName={newMemberName}
              newMemberNumber={newMemberNumber}
              selectedAvatar={selectedAvatar}
              onSetGroups={handleSetGroups}
              onSetEditingId={handleSetEditingId}
              onSetEditingMemberId={handleSetEditingMemberId}
              onSetEditingGroupName={handleSetEditingGroupName}
              onSetGroupNameInput={handleSetGroupNameInput}
              onSetNewMemberName={handleSetNewMemberName}
              onSetNewMemberNumber={handleSetNewMemberNumber}
              onSetSelectedAvatar={handleSetSelectedAvatar}
              onShowQr={handleShowQr}
            />
          )}
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
