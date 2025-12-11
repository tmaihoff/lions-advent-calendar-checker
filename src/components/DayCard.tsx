import React, { memo, useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trophy, Gift } from "lucide-react";
import type { DayData, Group, Member, WinGroup } from "../types";
import { getSpecialDayDecoration } from "../services";
import { MemberAvatar } from "./MemberAvatar";
import { DayDetailDialog } from "./DayDetailDialog";

interface DayCardProps {
  day: number;
  data?: DayData;
  groups: Group[];
}

export const DayCard = memo<DayCardProps>(({ day, data, groups }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setSlideIndex((prev) => (prev - 1 + winGroups.length) % winGroups.length);
    },
    [winGroups.length]
  );

  const isWinner = overallWinners.length > 0;

  return (
    <>
      <div
        onClick={() => setIsDialogOpen(true)}
        className={`relative min-h-[180px] p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col group overflow-hidden cursor-pointer
        ${
          isWinner
            ? "bg-gradient-to-br from-christmas-gold/20 to-amber-50 border-christmas-gold shadow-glow-gold transform scale-[1.02] z-10"
            : data
            ? "bg-white border-christmas-green/20 hover:border-christmas-red/30 hover:shadow-soft"
            : "bg-christmas-cream/50 border-christmas-green/10 border-dashed hover:border-christmas-green/20"
        }
      `}
      >
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
              <div className="w-2.5 h-2.5 rounded-full bg-christmas-gold animate-pulse-soft" />
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
                className={`text-sm font-medium leading-snug line-clamp-3 mb-3 h-[3.9em] ${
                  isWinningSlide ? "text-amber-800" : "text-slate-700"
                }`}
              >
                {currentGroup.prize}
              </p>

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

            {hasMultiple && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-christmas-green/10">
                <button
                  onClick={prevSlide}
                  className="p-1.5 hover:bg-christmas-green/10 rounded-lg text-christmas-green/50 hover:text-christmas-green transition btn-press shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-1 min-w-0 px-1">
                  <span className="text-xs font-medium text-slate-400">
                    {slideIndex + 1}/{winGroups.length}
                  </span>
                </div>
                <button
                  onClick={nextSlide}
                  className="p-1.5 hover:bg-christmas-green/10 rounded-lg text-christmas-green/50 hover:text-christmas-green transition btn-press shrink-0"
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
          </div>
        )}
      </div>

      {isDialogOpen && (
        <DayDetailDialog
          day={day}
          data={data}
          groups={groups}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
});

DayCard.displayName = "DayCard";
