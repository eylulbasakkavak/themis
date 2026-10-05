"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { KULLANICILAR } from "./CurrentUserContext";
import { adayEgitmenler } from "./data";
import type { Bildirim } from "./types";
import { vizeBildirimleriUret } from "./vizeBildirimleri";

type BildirimlerContextValue = {
  bildirimler: Bildirim[];
  bildirimEkle: (yeni: Omit<Bildirim, "id" | "okundu">) => void;
  bildirimOkunduIsaretle: (id: string) => void;
};

const BildirimlerContext = createContext<BildirimlerContextValue | null>(null);

export function BildirimlerProvider({ children }: { children: ReactNode }) {
  // Açılışta vize uyarı bildirimleri (PRD 12.5) hazır gelir; diğerleri işlemlerle eklenir.
  const [bildirimler, setBildirimler] = useState<Bildirim[]>(() =>
    vizeBildirimleriUret(adayEgitmenler, [
      { rol: "Kulüp Müdürü", ad: KULLANICILAR["Kulüp Müdürü"].ad },
      { rol: "İK", ad: KULLANICILAR["İK"].ad },
    ]).map((b) => ({ ...b, okundu: false }))
  );

  const bildirimEkle = (yeni: Omit<Bildirim, "id" | "okundu">) => {
    setBildirimler((prev) => [
      { ...yeni, id: `bd${Date.now()}-${prev.length}`, okundu: false },
      ...prev,
    ]);
  };

  const bildirimOkunduIsaretle = (id: string) => {
    setBildirimler((prev) => prev.map((b) => (b.id === id ? { ...b, okundu: true } : b)));
  };

  return (
    <BildirimlerContext.Provider value={{ bildirimler, bildirimEkle, bildirimOkunduIsaretle }}>
      {children}
    </BildirimlerContext.Provider>
  );
}

export function useBildirimler() {
  const ctx = useContext(BildirimlerContext);
  if (!ctx) throw new Error("useBildirimler, BildirimlerProvider içinde kullanılmalı");
  return ctx;
}
