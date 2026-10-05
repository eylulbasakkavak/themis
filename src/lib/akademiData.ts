import type { AkademiDonemi } from "./types";

/**
 * Örnek akademi tanımları. Kayıtlı aday listeleri ve yoklamalar, örnek aday verisinden
 * türetilerek AkademiDonemleriContext'te oluşturulur (bkz. akademileriHazirla).
 */
export type AkademiTanimi = Omit<AkademiDonemi, "kayitlilar" | "yoklama"> & {
  // Örnek veride yoklaması alınmış (tamamlanmış) akademiler.
  yoklamaAlindi?: boolean;
};

export const AKADEMI_TANIMLARI = {
  d18: {
    id: "d18",
    ad: "Standart / Dönem 18",
    tip: "Standart Akademi Mülakatı (4 Hafta)",
    baslangicTarihi: "07.09.2026",
    bitisTarihi: "02.10.2026",
    kontenjan: 30,
    yoklamaAlindi: true,
    yoklamaAlan: "Elif Su (İK)",
    yoklamaTarihi: "07.09.2026",
  },
  d11k: {
    id: "d11k",
    ad: "Kısa Dönem / Dönem 11",
    tip: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    baslangicTarihi: "14.09.2026",
    bitisTarihi: "18.09.2026",
    kontenjan: 16,
    yoklamaAlindi: true,
    yoklamaAlan: "Elif Su (İK)",
    yoklamaTarihi: "14.09.2026",
  },
  d19: {
    id: "d19",
    ad: "Standart / Dönem 19",
    tip: "Standart Akademi Mülakatı (4 Hafta)",
    baslangicTarihi: "28.09.2026",
    bitisTarihi: "23.10.2026",
    kontenjan: 30,
  },
  d12k: {
    id: "d12k",
    ad: "Kısa Dönem / Dönem 12",
    tip: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    baslangicTarihi: "12.10.2026",
    bitisTarihi: "16.10.2026",
    kontenjan: 18,
  },
  d20: {
    id: "d20",
    ad: "Standart / Dönem 20",
    tip: "Standart Akademi Mülakatı (4 Hafta)",
    baslangicTarihi: "16.11.2026",
    bitisTarihi: "11.12.2026",
    kontenjan: 30,
  },
  d13k: {
    id: "d13k",
    ad: "Kısa Dönem / Dönem 13",
    tip: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    baslangicTarihi: "07.12.2026",
    bitisTarihi: "11.12.2026",
    kontenjan: 4,
  },
  d21: {
    id: "d21",
    ad: "Standart / Dönem 21",
    tip: "Standart Akademi Mülakatı (4 Hafta)",
    baslangicTarihi: "11.01.2027",
    bitisTarihi: "05.02.2027",
    kontenjan: 30,
  },
} satisfies Record<string, AkademiTanimi>;

const gunEkle = (d: Date, gun: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + gun);
const yaz = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

/**
 * Bugünkü eğitmenlerin mezun olduğu geçmiş akademiler: Standart Dönem 1–17 (Ekim 2020'den
 * itibaren) ve Kısa Dönem 1–10 (Mart 2023'ten itibaren), yaklaşık 4 ayda bir. Hepsinin
 * yoklaması alınmıştır.
 */
function gecmisAkademilerUret(
  tip: AkademiTanimi["tip"],
  adet: number,
  ilkPazartesi: Date,
  onEk: string
): AkademiTanimi[] {
  const kisa = tip.startsWith("Kısa");
  return Array.from({ length: adet }, (_, i) => {
    const baslangic = gunEkle(ilkPazartesi, i * 126);
    const bitis = gunEkle(baslangic, kisa ? 4 : 25);
    return {
      id: `${onEk}${i + 1}`,
      ad: `${kisa ? "Kısa Dönem" : "Standart"} / Dönem ${i + 1}`,
      tip,
      baslangicTarihi: yaz(baslangic),
      bitisTarihi: yaz(bitis),
      kontenjan: kisa ? 16 : 30,
      yoklamaAlindi: true,
      yoklamaAlan: "Elif Su (İK)",
      yoklamaTarihi: yaz(baslangic),
    };
  });
}

export const GECMIS_AKADEMILER: AkademiTanimi[] = [
  ...gecmisAkademilerUret("Standart Akademi Mülakatı (4 Hafta)", 17, new Date(2020, 9, 5), "gs"),
  ...gecmisAkademilerUret("Kısa Dönem Akademi Mülakatı (1 Hafta)", 10, new Date(2023, 2, 6), "gk"),
];

/** Uygulamadaki tüm akademiler: geçmiş dönemler + güncel / yaklaşan dönemler. */
export const TUM_AKADEMI_TANIMLARI: AkademiTanimi[] = [
  ...GECMIS_AKADEMILER,
  ...(Object.values(AKADEMI_TANIMLARI) as AkademiTanimi[]),
];
