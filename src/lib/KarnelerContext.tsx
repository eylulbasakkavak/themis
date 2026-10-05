"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { guncelDonem, sonrakiDonem } from "./karne";
import {
  egitmenKarneleri as baslangicKarneler,
  karneHaricKayitlari as baslangicHaricKayitlari,
  karneSabitlemeKayitlari as baslangicSabitlemeKayitlari,
  kulupStudyoSayilari as baslangicKulupStudyolari,
  metrikLimitleri as baslangicLimitler,
} from "./karneData";
import type {
  EgitmenKarnesi,
  KarneHaricKaydi,
  KarneSabitlemeKaydi,
  KulupStudyoSayisi,
  MetrikLimitleri,
} from "./types";

type KarnelerContextValue = {
  aktifDonem: string;
  donemiSonlandir: () => void;
  karneler: EgitmenKarnesi[];
  karneleriYukle: (yeniler: EgitmenKarnesi[]) => void;
  metrikLimitleri: MetrikLimitleri[];
  limitKaydet: (yeni: MetrikLimitleri) => void;
  kulupStudyoSayilari: KulupStudyoSayisi[];
  kulupStudyoKaydet: (yeni: KulupStudyoSayisi) => void;
  haricKayitlari: KarneHaricKaydi[];
  haricEkle: (yeni: KarneHaricKaydi) => void;
  haricGuncelle: (yeni: KarneHaricKaydi) => void;
  haricSil: (id: string) => void;
  haricAktifligiDegistir: (id: string, aktif: boolean) => void;
  sabitlemeKayitlari: KarneSabitlemeKaydi[];
  sabitlemeEkle: (yeni: KarneSabitlemeKaydi) => void;
  sabitlemeGuncelle: (yeni: KarneSabitlemeKaydi) => void;
  sabitlemeSil: (id: string) => void;
  sabitlemeAktifligiDegistir: (id: string, aktif: boolean) => void;
};

const KarnelerContext = createContext<KarnelerContextValue | null>(null);

export function KarnelerProvider({ children }: { children: ReactNode }) {
  const [aktifDonem, setAktifDonem] = useState<string>(guncelDonem());
  const [karneler, setKarneler] = useState<EgitmenKarnesi[]>(baslangicKarneler);
  const [metrikLimitleri, setMetrikLimitleri] = useState<MetrikLimitleri[]>(baslangicLimitler);
  const [kulupStudyoSayilari, setKulupStudyoSayilari] = useState<KulupStudyoSayisi[]>(
    baslangicKulupStudyolari
  );
  const [haricKayitlari, setHaricKayitlari] = useState<KarneHaricKaydi[]>(
    baslangicHaricKayitlari
  );
  const [sabitlemeKayitlari, setSabitlemeKayitlari] = useState<KarneSabitlemeKaydi[]>(
    baslangicSabitlemeKayitlari
  );

  const karneleriYukle = (yeniler: EgitmenKarnesi[]) => {
    setKarneler((prev) => {
      const harita = new Map(prev.map((k) => [`${k.egitmenId}__${k.donem}`, k]));
      yeniler.forEach((k) => harita.set(`${k.egitmenId}__${k.donem}`, k));
      return Array.from(harita.values());
    });
  };

  const limitKaydet = (yeni: MetrikLimitleri) => {
    setMetrikLimitleri((prev) => {
      const digerleri = prev.filter((l) => l.donem !== yeni.donem);
      return [...digerleri, yeni];
    });
  };

  const kulupStudyoKaydet = (yeni: KulupStudyoSayisi) => {
    setKulupStudyoSayilari((prev) => {
      const digerleri = prev.filter((k) => !(k.kulup === yeni.kulup && k.donem === yeni.donem));
      return [...digerleri, yeni];
    });
  };

  const haricEkle = (yeni: KarneHaricKaydi) => {
    setHaricKayitlari((prev) => [...prev, yeni]);
  };

  const haricGuncelle = (yeni: KarneHaricKaydi) => {
    setHaricKayitlari((prev) => prev.map((k) => (k.id === yeni.id ? yeni : k)));
  };

  const haricSil = (id: string) => {
    setHaricKayitlari((prev) => prev.filter((k) => k.id !== id));
  };

  const haricAktifligiDegistir = (id: string, aktif: boolean) => {
    setHaricKayitlari((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, aktif, donusTarihi: aktif ? undefined : "Bugün" }
          : k
      )
    );
  };

  const sabitlemeEkle = (yeni: KarneSabitlemeKaydi) => {
    setSabitlemeKayitlari((prev) => [...prev, yeni]);
  };

  const sabitlemeGuncelle = (yeni: KarneSabitlemeKaydi) => {
    setSabitlemeKayitlari((prev) => prev.map((k) => (k.id === yeni.id ? yeni : k)));
  };

  const sabitlemeSil = (id: string) => {
    setSabitlemeKayitlari((prev) => prev.filter((k) => k.id !== id));
  };

  const sabitlemeAktifligiDegistir = (id: string, aktif: boolean) => {
    setSabitlemeKayitlari((prev) => prev.map((k) => (k.id === id ? { ...k, aktif } : k)));
  };

  const donemiSonlandir = () => {
    setAktifDonem((mevcut) => sonrakiDonem(mevcut));
  };

  return (
    <KarnelerContext.Provider
      value={{
        aktifDonem,
        donemiSonlandir,
        karneler,
        karneleriYukle,
        metrikLimitleri,
        limitKaydet,
        kulupStudyoSayilari,
        kulupStudyoKaydet,
        haricKayitlari,
        haricEkle,
        haricGuncelle,
        haricSil,
        haricAktifligiDegistir,
        sabitlemeKayitlari,
        sabitlemeEkle,
        sabitlemeGuncelle,
        sabitlemeSil,
        sabitlemeAktifligiDegistir,
      }}
    >
      {children}
    </KarnelerContext.Provider>
  );
}

export function useKarneler() {
  const ctx = useContext(KarnelerContext);
  if (!ctx) throw new Error("useKarneler, KarnelerProvider içinde kullanılmalı");
  return ctx;
}
