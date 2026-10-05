"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AdayDetayIcerik } from "@/components/aday/AdayDetayIcerik";
import type { AdayEgitmen } from "@/lib/types";

export function AdayDetayModal({
  aday,
  onAdayGuncelle,
  onClose,
}: {
  aday: AdayEgitmen | undefined;
  onAdayGuncelle: (yeni: AdayEgitmen) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <span className="text-sm font-medium text-zinc-400">Eğitmen Detayı</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {aday ? (
            <AdayDetayIcerik aday={aday} onAdayGuncelle={onAdayGuncelle} />
          ) : (
            <p className="text-sm text-zinc-400">Aday bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
