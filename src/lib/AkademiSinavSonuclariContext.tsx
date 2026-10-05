"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { akademiSinavSonuclari as baslangicSonuclar } from "./akademiSinavData";
import type { AkademiSinavSonucu } from "./types";

type AkademiSinavSonuclariContextValue = {
  sinavSonuclari: AkademiSinavSonucu[];
  topluYukle: (yeniler: Omit<AkademiSinavSonucu, "id">[]) => void;
};

const AkademiSinavSonuclariContext = createContext<AkademiSinavSonuclariContextValue | null>(null);

export function AkademiSinavSonuclariProvider({ children }: { children: ReactNode }) {
  const [sinavSonuclari, setSinavSonuclari] = useState<AkademiSinavSonucu[]>(baslangicSonuclar);

  // Sınav sonuçları yalnızca Excel'den gelir (PRD 9). Aynı eğitmen + aynı akademi için
  // yeniden yükleme yapılırsa mevcut kaydın üzerine yazılır (upsert).
  const upsert = (liste: AkademiSinavSonucu[], yeni: Omit<AkademiSinavSonucu, "id">) => {
    const mevcut = liste.find(
      (s) => s.egitmenId === yeni.egitmenId && s.akademiDonemiId === yeni.akademiDonemiId
    );
    if (mevcut) {
      return liste.map((s) => (s.id === mevcut.id ? { ...yeni, id: mevcut.id } : s));
    }
    return [...liste, { ...yeni, id: `ss${liste.length + 1}-${liste.length}` }];
  };

  const topluYukle = (yeniler: Omit<AkademiSinavSonucu, "id">[]) => {
    setSinavSonuclari((prev) => yeniler.reduce((liste, yeni) => upsert(liste, yeni), prev));
  };

  return (
    <AkademiSinavSonuclariContext.Provider value={{ sinavSonuclari, topluYukle }}>
      {children}
    </AkademiSinavSonuclariContext.Provider>
  );
}

export function useAkademiSinavSonuclari() {
  const ctx = useContext(AkademiSinavSonuclariContext);
  if (!ctx) {
    throw new Error("useAkademiSinavSonuclari, AkademiSinavSonuclariProvider içinde kullanılmalı");
  }
  return ctx;
}
