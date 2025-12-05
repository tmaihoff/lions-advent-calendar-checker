import React, { memo, useEffect, useMemo } from "react";
import { X, Share2, QrCode } from "lucide-react";

interface QrModalProps {
  shareUrl: string;
  onCopy: () => void;
  onClose: () => void;
}

export const QrModal = memo<QrModalProps>(
  ({ shareUrl, onCopy, onClose }) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const qrCodeUrl = useMemo(
      () =>
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`,
      [shareUrl]
    );

    const displayUrl = useMemo(
      () => (shareUrl.length > 60 ? shareUrl.substring(0, 60) + "..." : shareUrl),
      [shareUrl]
    );

    const handleCopyAndClose = () => {
      onCopy();
      onClose();
    };

    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-elevated max-w-sm w-full p-8 relative animate-in fade-in zoom-in-95 duration-200 border border-christmas-green/20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-christmas-green to-green-700 rounded-2xl mb-5 shadow-lg">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
              🎄 QR-Code teilen
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Scanne diesen Code, um die Gruppe auf einem anderen Gerät zu
              öffnen.
            </p>

            <div className="bg-christmas-cream p-5 rounded-2xl inline-block shadow-sm border border-christmas-green/20">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>

            <p className="text-xs text-slate-400 mt-5 break-all px-4">
              {displayUrl}
            </p>

            <button
              onClick={handleCopyAndClose}
              className="mt-6 w-full bg-gradient-to-r from-christmas-red to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition font-semibold flex items-center justify-center gap-2 btn-press shadow-lg"
            >
              <Share2 className="w-4 h-4" /> Link kopieren & schließen
            </button>
          </div>
        </div>
      </div>
    );
  }
);

QrModal.displayName = "QrModal";
