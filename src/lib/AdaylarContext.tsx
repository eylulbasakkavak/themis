"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { adayEgitmenler as baslangicAdaylar } from "./data";
import type { AdayEgitmen } from "./types";

type AdaylarContextValue = {
  adaylar: AdayEgitmen[];
  setAdaylar: React.Dispatch<React.SetStateAction<AdayEgitmen[]>>;
  guncelleAday: (yeni: AdayEgitmen) => void;
};

const AdaylarContext = createContext<AdaylarContextValue | null>(null);

export function AdaylarProvider({ children }: { children: ReactNode }) {
  const [adaylar, setAdaylarHam] = useState<AdayEgitmen[]>(baslangicAdaylar);

  // Değişen ya da yeni eklenen her kayda işlem zamanı damgalanır; tekli ve toplu işlemlerin
  // hepsi bu yoldan geçtiği için listeler "en son işlem yapılan en üstte" sıralanabilir.
  const setAdaylar: React.Dispatch<React.SetStateAction<AdayEgitmen[]>> = (deger) => {
    setAdaylarHam((prev) => {
      const sonraki = typeof deger === "function" ? deger(prev) : deger;
      const oncekiler = new Map(prev.map((a) => [a.id, a]));
      const simdi = Date.now();
      return sonraki.map((a) => (oncekiler.get(a.id) === a ? a : { ...a, sonIslemZamani: simdi }));
    });
  };

  const guncelleAday = (yeni: AdayEgitmen) => {
    setAdaylar((prev) => prev.map((a) => (a.id === yeni.id ? yeni : a)));
  };

  return (
    <AdaylarContext.Provider value={{ adaylar, setAdaylar, guncelleAday }}>
      {children}
    </AdaylarContext.Provider>
  );
}

export function useAdaylar() {
  const ctx = useContext(AdaylarContext);
  if (!ctx) throw new Error("useAdaylar, AdaylarProvider içinde kullanılmalı");
  return ctx;
}
