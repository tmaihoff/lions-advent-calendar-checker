import React, { memo, useMemo, useCallback } from "react";
import {
  Calendar,
  Users,
  Plus,
  AlertCircle,
  RefreshCw,
  Trophy,
  Share2,
} from "lucide-react";
import type { Group, DayData, DataSource, WinEntry } from "../types";
import { LIVE_INDICATOR_DURATION } from "../constants";
import { Card } from "./Card";
import { MemberAvatar } from "./MemberAvatar";
import { DayCard } from "./DayCard";

interface DashboardProps {
  groups: Group[];
  dayData: DayData[];
  lastChecked: Date | null;
  dataSource: DataSource;
  scrapeError: string | null;
  loading: boolean;
  onCheck: () => void;
  onNavigateToGroups: () => void;
  onShowQr: () => void;
}

export const Dashboard = memo<DashboardProps>(
  ({
    groups,
    dayData,
    lastChecked,
    dataSource,
    scrapeError,
    loading,
    onCheck,
    onNavigateToGroups,
    onShowQr,
  }) => {
    const allMembers = useMemo(
      () => groups.flatMap((g) => g.members),
      [groups]
    );

    const allWins = useMemo<WinEntry[]>(() => {
      const wins: WinEntry[] = [];
      dayData.forEach((dd) => {
        dd.winGroups.forEach((wg) => {
          wg.numbers.forEach((num) => {
            const winner = allMembers.find((m) => m.number === num);
            if (winner) {
              wins.push({
                day: dd.day,
                member: winner,
                prize: wg.prize,
                sponsor: wg.sponsor,
              });
            }
          });
        });
      });
      return wins;
    }, [dayData, allMembers]);

    const isLive = useMemo(() => {
      return (
        dataSource === "real" &&
        lastChecked &&
        Date.now() - lastChecked.getTime() < LIVE_INDICATOR_DURATION
      );
    }, [dataSource, lastChecked]);

    const groupName = groups[0]?.name || "Meine Gruppe";

    return (
      <div className="space-y-8">
        {/* Hero Status Card */}
        <Card className="p-6 border-christmas-green/20" hover={false}>
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
                    {isLive && (
                      <span className="text-xs bg-christmas-green/20 text-christmas-green px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-christmas-green rounded-full animate-pulse" />
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
                onClick={onCheck}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-christmas-green to-green-700 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 shadow-md btn-press font-medium"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Jetzt prüfen
              </button>
            </div>
          </div>
        </Card>

        {/* Members Quick View */}
        <Card className="p-6 border-christmas-green/20" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-christmas-green" />
              🎄 {groupName}
            </h3>
            <button
              onClick={onNavigateToGroups}
              className="text-sm text-christmas-red hover:text-red-700 font-medium"
            >
              Bearbeiten →
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {allMembers.map((member) => (
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
            {allMembers.length === 0 && (
              <button
                onClick={onNavigateToGroups}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-christmas-red transition"
              >
                <Plus className="w-4 h-4" /> Mitglieder hinzufügen
              </button>
            )}
          </div>
          {allMembers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-christmas-green/10">
              <button
                onClick={onShowQr}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-christmas-green transition"
              >
                <Share2 className="w-4 h-4" />
                Gruppe teilen
              </button>
            </div>
          )}
        </Card>

        {/* Wins Section */}
        {allWins.length === 0 ? (
          <Card className="p-6 border-christmas-green/20" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-christmas-gold" />
                🏆 Gewinne
              </h3>
            </div>
            <p className="text-slate-500 text-sm">
              Noch keine Gewinne – viel Glück beim nächsten Türchen!
            </p>
          </Card>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-50 via-gold-100/50 to-gold-50 p-6 border-2 border-gold-200 shadow-glow-gold">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
        )}

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
                <DayCard key={day} day={day} data={data} groups={groups} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

Dashboard.displayName = "Dashboard";
