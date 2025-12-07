import React, { memo, useState, useEffect } from "react";
import { X, Info, Search, Users, Share2, QrCode } from "lucide-react";
import { STORAGE_KEYS } from "../constants";
import { Card } from "./Card";

interface HowToSectionProps {
  onShowQr: () => void;
}

export const HowToSection = memo<HowToSectionProps>(
  ({ onShowQr }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const dismissed = localStorage.getItem(STORAGE_KEYS.HOWTO_DISMISSED);
      setIsVisible(dismissed !== "true");
      setIsLoaded(true);
    }, []);

    const handleDismiss = () => {
      setIsVisible(false);
      localStorage.setItem(STORAGE_KEYS.HOWTO_DISMISSED, "true");
    };

    if (!isLoaded || !isVisible) return null;

    return (
      <Card className="p-6 mb-8 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50" hover={false}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-display font-bold text-slate-800 text-lg">
              So funktioniert's
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Search className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Losnummer prüfen</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Gib deine Losnummer unten ein, um sofort zu sehen ob du gewonnen hast. Die Gewinnzahlen werden live von der offiziellen Lions Club Seite abgerufen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Mehrere Nummern</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Du kannst beliebig viele Losnummern hinzufügen – z.B. für die ganze Familie. Gewinne werden automatisch für alle angezeigt.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Share2 className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Lokale Speicherung</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Deine Losnummern werden nur auf diesem Gerät gespeichert – sicher und privat.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <QrCode className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Einfach teilen</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Teile deine Nummern per{" "}
                <button
                  onClick={onShowQr}
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Link oder QR-Code
                </button>
                {" "}mit Familie und Freunden.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

HowToSection.displayName = "HowToSection";
