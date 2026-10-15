"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAdaylar } from "./AdaylarContext";
import {
  akademiAnahtari,
  akademiDenemeleri,
  akademiNihaisi,
  genelSonuclariHesapla,
} from "./akademiSinav";
import { akademiSinavSonuclari as baslangicSonuclar } from "./akademiSinavData";
import type { AdayEgitmen, AkademiSinavSonucu } from "./types";

type YeniSonuc = Omit<AkademiSinavSonucu, "id" | "genelSonuc"> & {
  genelSonuc?: AkademiSinavSonucu["genelSonuc"];
};

type AkademiSinavSonuclariContextValue = {
  sinavSonuclari: AkademiSinavSonucu[];
  // Excel'den toplu yükleme; aynı eğitmen + akademi + sınav no varsa üzerine yazılır.
  topluYukle: (yeniler: YeniSonuc[], yapan: string, tarih: string) => void;
  // İK / Sistem Yöneticisi puan düzeltmesi (iz kaydıyla).
  puanDuzelt: (
    sonucId: string,
    baslikIndeksi: number,
    yeni: number | null,
    aciklama: string,
    yapan: string,
    tarih: string,
  ) => void;
};

const AkademiSinavSonuclariContext =
  createContext<AkademiSinavSonuclariContextValue | null>(null);

/**
 * Akademi sınav sonucu değişince akademisindeki adayın süreç durumu güncellenir: genel sonuç
 * "Geçti" olan akademi eğitmeni "Eğitmenliğe Geçişe Hazır" olur; düzeltmeyle "Kaldı"ya dönerse
 * akademi eğitmeni olarak kalır.
 */
function surecDurumunuGuncelle(
  a: AdayEgitmen,
  sonuclar: AkademiSinavSonucu[],
  yapan: string,
  tarih: string,
  aksiyon: string,
): AdayEgitmen {
  if (!a.akademiDonemiId) return a;
  const denemeler = akademiDenemeleri(sonuclar, a.id, a.akademiDonemiId);
  if (!denemeler.length) return a;
  const genel = akademiNihaisi(denemeler).genelSonuc;
  const yeniDurum =
    genel === "Geçti" && a.surecDurumu === "akademi_egitmeni"
      ? "akademiyi_tamamladi"
      : genel === "Kaldı" && a.surecDurumu === "akademiyi_tamamladi"
        ? "akademi_egitmeni"
        : a.surecDurumu;
  return {
    ...a,
    surecDurumu: yeniDurum,
    aksiyonGecmisi: [
      ...a.aksiyonGecmisi,
      { tarih, aksiyon: `${aksiyon}: genel sonuç ${genel}`, yapan },
    ],
  };
}

export function AkademiSinavSonuclariProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { setAdaylar } = useAdaylar();
  const [sinavSonuclari, setSinavSonuclari] =
    useState<AkademiSinavSonucu[]>(baslangicSonuclar);
  const uygula = (
    yeniListe: AkademiSinavSonucu[],
    etkilenenler: string[],
    yapan: string,
    tarih: string,
    aksiyon: string,
  ) => {
    const hesaplanmis = genelSonuclariHesapla(yeniListe);
    setSinavSonuclari(hesaplanmis);
    setAdaylar((prev) =>
      prev.map((a) =>
        etkilenenler.includes(a.id)
          ? surecDurumunuGuncelle(a, hesaplanmis, yapan, tarih, aksiyon)
          : a,
      ),
    );
  };

  const topluYukle: AkademiSinavSonuclariContextValue["topluYukle"] = (
    yeniler,
    yapan,
    tarih,
  ) => {
    let liste = sinavSonuclari;
    for (const yeni of yeniler) {
      const mevcut = liste.find(
        (s) =>
          s.egitmenId === yeni.egitmenId &&
          akademiAnahtari(s) === akademiAnahtari(yeni) &&
          s.sinavNo === yeni.sinavNo,
      );
      const kayit = {
        ...yeni,
        genelSonuc: yeni.genelSonuc ?? "Kaldı",
      } as AkademiSinavSonucu;
      liste = mevcut
        ? liste.map((s) =>
            s.id === mevcut.id ? { ...kayit, id: mevcut.id } : s,
          )
        : [...liste, { ...kayit, id: `ss-${Date.now()}-${liste.length}` }];
    }
    const sinavNo = yeniler[0]?.sinavNo ?? 1;
    uygula(
      liste,
      yeniler.map((y) => y.egitmenId),
      yapan,
      tarih,
      `Akademi ${sinavNo}. sınav sonucu yüklendi`,
    );
  };

  const puanDuzelt: AkademiSinavSonuclariContextValue["puanDuzelt"] = (
    sonucId,
    baslikIndeksi,
    yeni,
    aciklama,
    yapan,
    tarih,
  ) => {
    const sonuc = sinavSonuclari.find((s) => s.id === sonucId);
    if (!sonuc) return;
    const liste = sinavSonuclari.map((s) =>
      s.id !== sonucId
        ? s
        : {
            ...s,
            puanlar: s.puanlar.map((p, i) => (i === baslikIndeksi ? yeni : p)),
            duzeltmeler: [
              ...(s.duzeltmeler ?? []),
              {
                baslikIndeksi,
                eski: s.puanlar[baslikIndeksi],
                yeni,
                aciklama,
                yapan,
                tarih,
              },
            ],
          },
    );
    uygula(
      liste,
      [sonuc.egitmenId],
      yapan,
      tarih,
      `Akademi sınav puanı düzeltildi (${sonuc.basliklar[baslikIndeksi]?.ad})`,
    );
  };

  return (
    <AkademiSinavSonuclariContext.Provider
      value={{ sinavSonuclari, topluYukle, puanDuzelt }}
    >
      {children}
    </AkademiSinavSonuclariContext.Provider>
  );
}

export function useAkademiSinavSonuclari() {
  const ctx = useContext(AkademiSinavSonuclariContext);
  if (!ctx) {
    throw new Error(
      "useAkademiSinavSonuclari, AkademiSinavSonuclariProvider içinde kullanılmalı",
    );
  }
  return ctx;
}
