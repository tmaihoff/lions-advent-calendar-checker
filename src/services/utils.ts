export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getSpecialDayDecoration = (
  day: number
): { emoji: string; label: string } | null => {
  if (day === 6) return { emoji: "🎅", label: "Nikolaus" };
  if (day === 24) return { emoji: "🎄", label: "Heiligabend" };
  if (day === 7) return { emoji: "🕯️🕯️", label: "2. Advent" };
  if (day === 14) return { emoji: "🕯️🕯️🕯️", label: "3. Advent" };
  if (day === 21) return { emoji: "🕯️🕯️🕯️🕯️", label: "4. Advent" };
  return null;
};
