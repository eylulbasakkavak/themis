"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TUM_AKADEMI_TANIMLARI } from "./akademiData";
import { adayEgitmenler } from "./data";
import type { AdayEgitmen, AkademiDonemi, SurecDurumu, YoklamaDurumu } from "./types";

// Davet onayı henüz verilmemiş adaylar akademinin listesine yazılmamıştır.
const KAYIT_ONCESI: SurecDurumu[] = ["akademi_egitimine_hazir", "akademi_daveti_onayi_bekliyor"];

/** Örnek akademilerin kayıtlı listelerini ve (alınmışsa) yoklamalarını aday verisinden kurar. */
function akademileriHazirla(adaylar: AdayEgitmen[]): AkademiDonemi[] {
  return TUM_AKADEMI_TANIMLARI.map(({ yoklamaAlindi, ...tanim }) => {
    const kayitli = adaylar.filter(
      (a) =>
        (a.akademiDonemiId === tanim.id && !KAYIT_ONCESI.includes(a.surecDurumu)) ||
        a.katilmadigiAkademiler?.some((k) => k.akademiId === tanim.id)
    );
    const gelmediMi = (a: AdayEgitmen) =>
      !!a.katilmadigiAkademiler?.some((k) => k.akademiId === tanim.id);
    return {
      ...tanim,
      // Geçmiş dönemlerde kayıtlı mezun sayısı tanımdaki kontenjanı aşmasın.
      kontenjan: Math.max(tanim.kontenjan, kayitli.length),
      kayitlilar: kayitli.map((a) => a.id),
      yoklama: yoklamaAlindi
        ? Object.fromEntries(
            kayitli.map((a): [string, YoklamaDurumu] => [a.id, gelmediMi(a) ? "Gelmedi" : "Geldi"])
          )
        : undefined,
    };
  });
}

type AkademiDonemleriContextValue = {
  donemler: AkademiDonemi[];
  donemEkle: (yeni: Omit<AkademiDonemi, "id" | "kayitlilar">) => void;
  donemGuncelle: (yeni: AkademiDonemi) => void;
  donemIptal: (id: string) => void;
  // Davet onaylandığında aday akademinin listesine yazılır; kontenjan 1 azalır (PRD 6).
  adayKaydet: (donemId: string, adayId: string) => void;
  yoklamaKaydet: (
    donemId: string,
    yoklama: Record<string, YoklamaDurumu>,
    alan: string,
    tarih: string
  ) => void;
};

const AkademiDonemleriContext = createContext<AkademiDonemleriContextValue | null>(null);

export function AkademiDonemleriProvider({ children }: { children: ReactNode }) {
  const [donemler, setDonemler] = useState<AkademiDonemi[]>(() =>
    akademileriHazirla(adayEgitmenler)
  );

  const guncelle = (id: string, f: (d: AkademiDonemi) => AkademiDonemi) =>
    setDonemler((prev) => prev.map((d) => (d.id === id ? f(d) : d)));

  const donemEkle = (yeni: Omit<AkademiDonemi, "id" | "kayitlilar">) => {
    setDonemler((prev) => [...prev, { ...yeni, id: `a${Date.now()}`, kayitlilar: [] }]);
  };

  const donemGuncelle = (yeni: AkademiDonemi) => guncelle(yeni.id, () => yeni);

  const donemIptal = (id: string) => guncelle(id, (d) => ({ ...d, iptal: true }));

  const adayKaydet = (donemId: string, adayId: string) =>
    guncelle(donemId, (d) =>
      d.kayitlilar.includes(adayId) ? d : { ...d, kayitlilar: [...d.kayitlilar, adayId] }
    );

  const yoklamaKaydet = (
    donemId: string,
    yoklama: Record<string, YoklamaDurumu>,
    alan: string,
    tarih: string
  ) => guncelle(donemId, (d) => ({ ...d, yoklama, yoklamaAlan: alan, yoklamaTarihi: tarih }));

  return (
    <AkademiDonemleriContext.Provider
      value={{ donemler, donemEkle, donemGuncelle, donemIptal, adayKaydet, yoklamaKaydet }}
    >
      {children}
    </AkademiDonemleriContext.Provider>
  );
}

export function useAkademiDonemleri() {
  const ctx = useContext(AkademiDonemleriContext);
  if (!ctx) throw new Error("useAkademiDonemleri, AkademiDonemleriProvider içinde kullanılmalı");
  return ctx;
}
