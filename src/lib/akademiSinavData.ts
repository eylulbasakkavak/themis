import { TUM_AKADEMI_TANIMLARI } from "./akademiData";
import { VARSAYILAN_GENEL_SONUC_BASLIGI, VARSAYILAN_SINAV_BASLIKLARI } from "./akademiSinavExcel";
import { adayEgitmenler } from "./data";
import type { AkademiSinavSonucu } from "./types";
import { akademiBittiMi, ornekSinavDurumu } from "./veriTutarliligi";

/** Deterministik örnek puanlar: geçenlerde hepsi 70+, kalanlarda birkaç ders 70'in altında. */
function puanlar(tohum: number, gecti: boolean): number[] {
  return VARSAYILAN_SINAV_BASLIKLARI.map((_, j) => {
    const p = 72 + ((tohum * 7 + j * 11) % 27);
    return gecti ? p : j % 3 === 0 ? 45 + ((tohum + j) % 20) : p - 8;
  });
}

/**
 * Örnek akademi sınav sonuçları (PRD 9) kişilerin durumundan türetilir: eğitmen, pasif eğitmen
 * ve eğitmenliğe geçişe hazır olanlar sınavı geçmiştir; bitmiş akademideki diğer akademi
 * eğitmenlerinin bir kısmı kalmış, bir kısmının sonucu henüz yüklenmemiştir.
 */
export const akademiSinavSonuclari: AkademiSinavSonucu[] = adayEgitmenler.flatMap((a, i) => {
  if (!a.akademiDonemiId) return [];
  const gecti =
    a.surecDurumu === "egitmen" ||
    a.surecDurumu === "pasif" ||
    a.surecDurumu === "akademiyi_tamamladi";
  const kaldi =
    (a.surecDurumu === "akademi_egitmeni" || a.surecDurumu === "surec_sonlandirildi") &&
    akademiBittiMi(a.akademiDonemiId) &&
    ornekSinavDurumu(a.id) === "Kaldı";
  if (!gecti && !kaldi) return [];
  const akademi = TUM_AKADEMI_TANIMLARI.find((t) => t.id === a.akademiDonemiId);
  return [
    {
      id: `ss-${a.id}`,
      egitmenId: a.id,
      akademiDonemiId: a.akademiDonemiId,
      basliklar: VARSAYILAN_SINAV_BASLIKLARI,
      puanlar: puanlar(i, gecti),
      genelSonuc: gecti ? "Geçti" : "Kaldı",
      genelSonucBasligi: VARSAYILAN_GENEL_SONUC_BASLIGI,
      yuklemeTarihi: akademi?.bitisTarihi ?? "",
      yukleyen: "Elif Su (İK)",
    },
  ];
});
