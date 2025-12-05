import React, { memo, useMemo } from "react";
import type { Wichtel } from "../types";

// Inline Christmas hat SVG component
const ChristmasHat: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hat base (red part) */}
    <path d="M10 55 Q15 35, 50 20 Q85 35, 90 55 Z" fill="#D42426" />
    {/* Hat curve shadow */}
    <path d="M15 52 Q20 38, 50 25 Q80 38, 85 52 Z" fill="#B91C1C" />
    {/* White fur trim */}
    <ellipse cx="50" cy="55" rx="45" ry="8" fill="#FAFAFA" />
    <ellipse cx="50" cy="55" rx="45" ry="6" fill="white" />
    {/* Pompom */}
    <circle cx="50" cy="12" r="10" fill="#FAFAFA" />
    <circle cx="50" cy="12" r="8" fill="white" />
    {/* Hat tip curve */}
    <path
      d="M50 20 Q60 10, 50 12"
      stroke="#D42426"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

interface FloatingWichtelProps {
  wichtel: Wichtel[];
}

interface WichtelPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  animationDelay: string;
  animationDuration: string;
}

// Predefined positions around the edges of the page
const POSITION_SLOTS: Array<Omit<WichtelPosition, "animationDelay" | "animationDuration">> = [
  { top: "15%", left: "2%" },
  { top: "35%", left: "1%" },
  { top: "55%", left: "3%" },
  { top: "75%", left: "2%" },
  { top: "20%", right: "2%" },
  { top: "40%", right: "1%" },
  { top: "60%", right: "3%" },
  { top: "80%", right: "2%" },
  { bottom: "15%", left: "5%" },
  { bottom: "10%", right: "5%" },
  { top: "25%", left: "4%" },
  { top: "45%", right: "4%" },
];

// Seeded random for consistent positioning based on wichtel id
const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100) / 100;
};

export const FloatingWichtel = memo<FloatingWichtelProps>(({ wichtel }) => {
  const positions = useMemo(() => {
    return wichtel.map((w, index) => {
      const slotIndex = index % POSITION_SLOTS.length;
      const slot = POSITION_SLOTS[slotIndex];
      const rand = seededRandom(w.id);

      return {
        ...slot,
        animationDelay: `${rand * 2}s`,
        animationDuration: `${3 + rand * 2}s`,
      };
    });
  }, [wichtel]);

  if (wichtel.length === 0) return null;

  return (
    <>
      {wichtel.map((w, index) => {
        const pos = positions[index];
        return (
          <div
            key={w.id}
            className="fixed z-10 pointer-events-none select-none animate-bounce-gentle"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              right: pos.right,
              animationDelay: pos.animationDelay,
              animationDuration: pos.animationDuration,
            }}
            title={w.name}
          >
            <div className="relative group pointer-events-auto cursor-default">
              {/* Christmas hat positioned on top */}
              <ChristmasHat className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 sm:w-10 drop-shadow-md" />
              <div className="text-3xl sm:text-4xl opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-300 drop-shadow-lg">
                {w.avatar}
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-surface-500 bg-white/80 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                {w.name}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
});

FloatingWichtel.displayName = "FloatingWichtel";
