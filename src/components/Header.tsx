import React, { memo, useMemo } from "react";

interface HeaderProps {
  scrollY: number;
}

export const Header = memo<HeaderProps>(({ scrollY }) => {
  const logoSize = 202;
  const logoRadius = logoSize / 2;

  const headerHeightMin = 0;
  const headerHeightMax = 224;
  const headerShrinkRange = headerHeightMax - headerHeightMin;

  const { shrinkProgress, headerOffset, headerOpacity, extraPadding } =
    useMemo(() => {
      const shrinkProgress = Math.min(1, scrollY / headerShrinkRange);
      const scrollAfterShrink = Math.max(0, scrollY - headerShrinkRange);
      const maxScrollAfterShrink = headerHeightMin - logoRadius - 20;
      const parallaxSpeed = 0.5;
      const headerOffset = Math.min(
        scrollAfterShrink * parallaxSpeed,
        maxScrollAfterShrink
      );
      const headerOpacity = Math.max(0, 1 - scrollY / 400);
      const extraPadding = (1 - shrinkProgress) * 126;

      return { shrinkProgress, headerOffset, headerOpacity, extraPadding };
    }, [scrollY, headerShrinkRange, logoRadius]);

  const textTransform = useMemo(
    () => `translateY(-${scrollY * 0.8}px)`,
    [scrollY]
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-gradient-to-b from-christmas-red via-red-700 to-christmas-red text-white overflow-visible z-50"
      style={{
        transform: `translateY(-${headerOffset}px)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div
        className="max-w-6xl mx-auto px-6 pt-6 relative overflow-hidden"
        style={{
          paddingBottom: `${40 + extraPadding}px`,
        }}
      >
        <div
          className="flex flex-col items-center text-center transition-all duration-100"
          style={{
            opacity: headerOpacity,
            transform: textTransform,
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

      <div
        className="absolute left-1/2 -bottom-16 z-20"
        style={{
          transform: "translateX(-50%)",
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-christmas-gold rounded-full blur-2xl opacity-50 scale-125 animate-pulse-soft" />
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
  );
});

Header.displayName = "Header";
