"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { donemEtiketi, KARNE_AGIRLIKLARI, KARNE_ALAN_ETIKETLERI, LIG_TONU, puanTonu } from "@/lib/karne";
import type { AdayEgitmen, EgitmenKarnesi, EgitmenLig } from "@/lib/types";

export function KarneDetayModal({
  egitmen,
  karne,
  lig,
  sabit,
  onClose,
}: {
  egitmen: AdayEgitmen;
  karne: EgitmenKarnesi;
  lig: EgitmenLig;
  sabit: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {egitmen.ad} {egitmen.soyad}
            </h3>
            <p className="text-xs text-zinc-400">
              {egitmen.kulup} · {donemEtiketi(karne.donem)}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge
            label={`Dönem Sonu Final Puanı: ${karne.finalPuan}`}
            tone={puanTonu(karne.finalPuan)}
          />
          <Badge label={sabit ? `${lig} (sabitlenmiş)` : lig} tone={LIG_TONU[lig]} />
        </div>

        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {KARNE_AGIRLIKLARI.map((k) => (
            <div
              key={k.alan}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="text-zinc-600">
                {KARNE_ALAN_ETIKETLERI[k.alan]}{" "}
                <span className="text-xs text-zinc-400">(%{Math.round(k.agirlik * 100)})</span>
              </span>
              <span className="font-semibold text-zinc-800">{karne.alanlar[k.alan]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
