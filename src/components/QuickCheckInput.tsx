import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Group } from "../types";
import { CHRISTMAS_AVATARS } from "../constants";

interface QuickCheckInputProps {
  groups: Group[];
  onAddMember: (number: string, name: string, avatar: string) => void;
}

export const QuickCheckInput = memo<QuickCheckInputProps>(
  ({ groups, onAddMember }) => {
    const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState(() =>
      CHRISTMAS_AVATARS[Math.floor(Math.random() * CHRISTMAS_AVATARS.length)]
    );
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const avatarPickerRef = useRef<HTMLDivElement>(null);

    const allMembers = groups.flatMap((g) => g.members);
    const number = digits.join("");
    const isAlreadyAdded = allMembers.some((m) => m.number === number) && number.length >= 3;

    // Close avatar picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (avatarPickerRef.current && !avatarPickerRef.current.contains(event.target as Node)) {
          setShowAvatarPicker(false);
        }
      };
      if (showAvatarPicker) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAvatarPicker]);

    const handleDigitChange = (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);

      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      const newDigits = [...digits];
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);
      const lastIndex = Math.min(pasted.length, 3);
      inputRefs.current[lastIndex]?.focus();
    };

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (number.length < 3) return;
        if (isAlreadyAdded) return;

        const memberName = name.trim() || `Los ${number}`;
        onAddMember(number, memberName, avatar);
        setDigits(["", "", "", ""]);
        setName("");
        setAvatar(CHRISTMAS_AVATARS[Math.floor(Math.random() * CHRISTMAS_AVATARS.length)]);
        inputRefs.current[0]?.focus();
      },
      [number, name, avatar, onAddMember, isAlreadyAdded]
    );

    const handleSelectAvatar = (selectedAvatar: string) => {
      setAvatar(selectedAvatar);
      setShowAvatarPicker(false);
    };

    return (
      <div className="mb-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="text-center mb-4">
            <h2 className="font-display font-bold text-slate-800 text-lg">
              Losnummer prüfen
            </h2>
            <p className="text-sm text-slate-500">
              Gib deine Losnummer ein (3-4 Ziffern)
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-4">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all bg-white
                  ${isAlreadyAdded
                    ? "border-amber-400 text-amber-600"
                    : "border-slate-200 focus:border-christmas-green focus:ring-2 focus:ring-christmas-green/20 text-slate-800"
                  }`}
              />
            ))}
          </div>

          {isAlreadyAdded && (
            <p className="text-center text-sm text-amber-600 font-medium mb-3">
              Diese Nummer ist bereits hinzugefügt
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {/* Avatar picker button */}
            <div className="relative" ref={avatarPickerRef}>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 border-slate-200 bg-white hover:border-christmas-green hover:bg-christmas-cream transition-all"
                title="Avatar wählen"
              >
                {avatar}
              </button>

              {showAvatarPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-xl shadow-lg border-2 border-slate-200 z-50 w-64">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Avatar wählen</p>
                  <div className="grid grid-cols-5 gap-2">
                    {CHRISTMAS_AVATARS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleSelectAvatar(a)}
                        className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all hover:scale-110
                          ${avatar === a
                            ? "border-christmas-green bg-christmas-cream"
                            : "border-transparent hover:border-slate-200"
                          }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-christmas-green focus:ring-2 focus:ring-christmas-green/20 outline-none transition-all bg-white placeholder:text-slate-400 text-sm"
            />
            <button
              type="submit"
              disabled={number.length < 3 || isAlreadyAdded}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-christmas-green to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md btn-press"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>

          {allMembers.length > 0 && (
            <p className="w-full text-center text-sm text-slate-500">
              {allMembers.length} Losnummer{allMembers.length !== 1 ? "n" : ""} gespeichert
            </p>
          )}
        </form>
      </div>
    );
  }
);

QuickCheckInput.displayName = "QuickCheckInput";
