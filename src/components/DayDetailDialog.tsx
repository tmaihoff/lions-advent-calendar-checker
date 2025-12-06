import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import { X, Trophy, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import type { DayData, Group, Member, WinGroup } from "../types";
import { getSpecialDayDecoration } from "../services";
import { MemberAvatar } from "./MemberAvatar";

interface DayDetailDialogProps {
  day: number;
  data?: DayData;
  groups: Group[];
  onClose: () => void;
}

export const DayDetailDialog = memo<DayDetailDialogProps>(
  ({ day, data, groups, onClose }) => {
    const [slideIndex, setSlideIndex] = useState(0);
    const specialDecoration = getSpecialDayDecoration(day);

    const allMembers = useMemo(
      () => groups.flatMap((g) => g.members),
      [groups]
    );

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

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const winGroups = data?.winGroups || [];
    const currentGroup = winGroups[slideIndex];
    const winnersForCurrentSlide = currentGroup
      ? getWinnersForGroup(currentGroup)
      : [];
    const isWinningSlide = winnersForCurrentSlide.length > 0;
    const hasMultiple = winGroups.length > 1;
    const isWinner = overallWinners.length > 0;

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

    const nextSlide = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setSlideIndex((prev) => (prev + 1) % winGroups.length);
      },
      [winGroups.length]
    );

    const prevSlide = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setSlideIndex(
          (prev) => (prev - 1 + winGroups.length) % winGroups.length
        );
      },
      [winGroups.length]
    );

    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className={`bg-white rounded-3xl shadow-elevated max-w-lg w-full relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden
            ${isWinner ? "border-2 border-christmas-gold" : "border border-christmas-green/20"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`px-6 py-5 border-b ${
              isWinner
                ? "bg-gradient-to-br from-christmas-gold/20 to-amber-50 border-christmas-gold/30"
                : "bg-christmas-cream/50 border-christmas-green/10"
            }`}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white/50 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-display font-bold shadow-sm ${
                  isWinner
                    ? "bg-gradient-to-br from-christmas-gold to-amber-500 text-white"
                    : data
                    ? "bg-gradient-to-br from-christmas-green to-green-700 text-white"
                    : "bg-christmas-cream text-slate-300"
                }`}
              >
                {day}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-display font-bold text-slate-800">
                    Türchen {day}
                  </h2>
                  {specialDecoration && (
                    <span className="text-xl" title={specialDecoration.label}>
                      {specialDecoration.emoji}
                    </span>
                  )}
                  {isWinningSlide && (
                    <div className="p-1.5 bg-christmas-gold rounded-lg shadow-sm ml-auto mr-8">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                {data && (
                  <p className="text-sm text-christmas-green/70 mt-1">
                    {winGroups.length} Gewinn{winGroups.length !== 1 ? "e" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[320px] flex flex-col">
            {data ? (
              <div className="flex flex-col flex-1">
                {/* Winners Section */}
                {isWinningSlide && winnersForCurrentSlide.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-christmas-gold/10 to-amber-50 rounded-2xl border border-christmas-gold/20">
                    <p className="text-xs uppercase tracking-widest text-christmas-gold font-bold mb-3">
                      Gewinner
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {winnersForCurrentSlide.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-christmas-gold/20"
                        >
                          <MemberAvatar
                            avatar={w.avatar}
                            className="w-8 h-8 text-base border-2 border-christmas-gold"
                          />
                          <div>
                            <p className="font-semibold text-amber-800">
                              {w.name}
                            </p>
                            <p className="text-xs text-amber-600 font-mono">
                              #{w.number}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prize Info */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-christmas-green/60 font-bold mb-2">
                    {currentGroup?.sponsor}
                  </p>
                  <p
                    className={`text-lg font-medium leading-relaxed ${
                      isWinningSlide ? "text-amber-800" : "text-slate-700"
                    }`}
                  >
                    {currentGroup?.prize}
                  </p>
                </div>

                {/* Winning Numbers */}
                <div className="mt-auto">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
                    Gewinnnummern
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {displayNumbers.map((num) => {
                      const matchedMember = allMembers.find(
                        (m) => m.number === num
                      );
                      return (
                        <div
                          key={num}
                          className={`px-3 py-2 rounded-xl text-sm font-mono font-bold transition-all flex items-center gap-2
                            ${
                              matchedMember
                                ? "bg-gradient-to-r from-christmas-gold to-amber-500 text-white shadow-md"
                                : "bg-christmas-green/10 text-christmas-green/70"
                            }
                          `}
                        >
                          {matchedMember && (
                            <MemberAvatar
                              avatar={matchedMember.avatar}
                              className="w-5 h-5 text-xs border border-white/50"
                            />
                          )}
                          {num}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination */}
                {hasMultiple && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-christmas-green/10">
                    <button
                      onClick={prevSlide}
                      className="p-2 hover:bg-christmas-green/10 rounded-xl text-christmas-green/50 hover:text-christmas-green transition btn-press shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center justify-center gap-1.5 min-w-0 px-2">
                      {winGroups.length <= 7 ? (
                        winGroups.map((group, idx) => {
                          const hasWinner = getWinnersForGroup(group).length > 0;
                          return (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlideIndex(idx);
                              }}
                              className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                                idx === slideIndex
                                  ? hasWinner
                                    ? "bg-christmas-gold w-5"
                                    : "bg-christmas-red w-5"
                                  : hasWinner
                                  ? "bg-christmas-gold/40 hover:bg-christmas-gold/60"
                                  : "bg-christmas-green/30 hover:bg-christmas-green/50"
                              }`}
                            />
                          );
                        })
                      ) : (
                        <span className="text-sm font-medium text-slate-500">
                          {slideIndex + 1} / {winGroups.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={nextSlide}
                      className="p-2 hover:bg-christmas-green/10 rounded-xl text-christmas-green/50 hover:text-christmas-green transition btn-press shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-christmas-red/10 rounded-2xl mb-4">
                  <Gift className="w-10 h-10 text-christmas-red/40" />
                </div>
                <p className="text-slate-400 font-medium">
                  Noch nicht gezogen
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Die Gewinnnummern werden bald veröffentlicht
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DayDetailDialog.displayName = "DayDetailDialog";
