import { TUM_AKADEMI_TANIMLARI } from "./akademiData";
import {
  egitmeninAkademileri,
  gectiMi,
  genelSonuclariHesapla,
  gxDersiMi,
} from "./akademiSinav";
import {
  VARSAYILAN_GENEL_SONUC_BASLIGI,
  VARSAYILAN_SINAV_BASLIKLARI,
} from "./akademiSinavExcel";
import { adayEgitmenler } from "./data";
import type { AdayEgitmen, AkademiSinavSonucu } from "./types";
import { akademiBittiMi, ornekSinavDurumu } from "./veriTutarliligi";

// VARSAYILAN_SINAV_BASLIKLARI: 0–5 Fitness Teorik / Uygulama, 6–10 GX dersleri.
const FITNESS = [0, 1, 2, 3, 4, 5];
const GX = [6, 7, 8, 9, 10];

/** Deterministik puan: kalınan derslerde 45–64, geçilenlerde 72–98. */
const puan = (tohum: number, j: number, kaldi: boolean) =>
  kaldi ? 45 + ((tohum * 3 + j * 7) % 20) : 72 + ((tohum * 7 + j * 11) % 27);

/** Tüm derslerin puanı; `kalinanlar` 70 altı. */
const tamSinav = (tohum: number, kalinanlar: number[]) =>
  VARSAYILAN_SINAV_BASLIKLARI.map((_, j) =>
    puan(tohum, j, kalinanlar.includes(j)),
  );

/** 2. / 3. sınav: yalnızca `girilenler` derslerine girilir, diğerleri boş. */
const tekrarSinav = (
  tohum: number,
  girilenler: number[],
  kalinanlar: number[],
) =>
  VARSAYILAN_SINAV_BASLIKLARI.map((_, j) =>
    girilenler.includes(j) ? puan(tohum + 5, j, kalinanlar.includes(j)) : null,
  );

function tarihEkle(tarih: string, gun: number): string {
  const [g, a, y] = tarih.split(".").map(Number);
  const d = new Date(y, a - 1, g + gun);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/**
 * Örnek akademi sınav sonuçları (PRD 9) kişilerin durumundan türetilir:
 * - Eğitmen / pasif / eğitmenliğe geçişe hazır olanlar sonunda geçmiştir: çoğu 1. sınavda, bir
 *   kısmı 1. sınavda kalıp 2. ya da 3. sınavda (yalnızca kalınan derslerden) geçmiştir.
 * - Bitmiş akademide kalanların bir kısmı 2. ve 3. sınava da girip kalmıştır.
 * - Bazıları GX dersinden kalmıştır; bir kısmı o dersten 2. sınavda geçmiştir (GX genel sonucu
 *   etkilemez, yalnızca o dersi verip veremeyeceğini belirler).
 */
const ham: AkademiSinavSonucu[] = [];

adayEgitmenler.forEach((a, i) => {
  const egitmenMi = a.surecDurumu === "egitmen" || a.surecDurumu === "pasif";
  const ortak = {
    egitmenId: a.id,
    basliklar: VARSAYILAN_SINAV_BASLIKLARI,
    genelSonuc: "Kaldı" as const,
    genelSonucBasligi: VARSAYILAN_GENEL_SONUC_BASLIGI,
    yukleyen: "Elif Su (İK)",
  };
  // Kalınan GX dersi: bazı eğitmenlerde (GX genel sonucu etkilemez).
  // Kalınan GX dersleri: bazı eğitmenlerde bir, bazılarında iki ders (GX genel sonucu etkilemez).
  const gxKalinan =
    i % 3 === 0 || i % 4 === 2
      ? [GX[i % GX.length]]
      : i % 5 === 1
        ? [GX[(i + 2) % GX.length], GX[(i + 4) % GX.length]]
        : [];

  if (!a.akademiDonemiId) return;

  const gecti = egitmenMi || a.surecDurumu === "akademiyi_tamamladi";
  const kaldi =
    (a.surecDurumu === "akademi_egitmeni" ||
      a.surecDurumu === "surec_sonlandirildi") &&
    akademiBittiMi(a.akademiDonemiId) &&
    ornekSinavDurumu(a.id) === "Kaldı";
  if (!gecti && !kaldi) return;
  const akademi = TUM_AKADEMI_TANIMLARI.find((t) => t.id === a.akademiDonemiId);
  const bitis = akademi?.bitisTarihi ?? "";
  const sinav = (no: 1 | 2 | 3, puanlar: (number | null)[]) =>
    ham.push({
      ...ortak,
      id: `ss-${a.id}-${no}`,
      akademiDonemiId: a.akademiDonemiId,
      sinavNo: no,
      puanlar,
      yuklemeTarihi: tarihEkle(bitis, (no - 1) * 21),
    });
  // 1. sınavda kalınan Fitness dersleri.
  const k1 = [FITNESS[i % 6], FITNESS[(i + 3) % 6]];

  if (gecti) {
    // 3. sınav sonunda da geçilemeyen GX dersi kalabilir (GX genel sonucu etkilemez).
    const gxKalir = i % 2 === 1;
    if (i % 7 === 3) {
      // 1. ve 2. sınavda kaldı, 3. sınavda Fitness'tan geçti; bir kısmı GX dersinden yine kaldı.
      sinav(1, tamSinav(i, [...k1, ...gxKalinan]));
      sinav(2, tekrarSinav(i, [...k1, ...gxKalinan], [k1[0], ...gxKalinan]));
      sinav(
        3,
        tekrarSinav(i + 1, [k1[0], ...gxKalinan], gxKalir ? gxKalinan : []),
      );
    } else if (i % 4 === 1) {
      // 1. sınavda kaldı, 2. sınavda Fitness'tan geçti; GX dersinden kalanların bir kısmı 3.
      // sınavda da geçemedi.
      sinav(1, tamSinav(i, [...k1, ...gxKalinan]));
      sinav(2, tekrarSinav(i, [...k1, ...gxKalinan], gxKalinan));
      if (gxKalinan.length && i % 8 === 5)
        sinav(3, tekrarSinav(i + 1, gxKalinan, gxKalinan));
    } else {
      sinav(1, tamSinav(i, gxKalinan));
      // Fitness'tan geçip GX dersinden kalanlar: bir kısmı 2. sınavda geçti, bir kısmı 2. ve 3.
      // sınavda da geçemedi, bir kısmının hakkı devam ediyor.
      // GX'ten kalanların küçük bir kısmı 2. sınavda geçmiş; çoğu o dersi veremiyor.
      if (gxKalinan.length && i % 4 === 0)
        sinav(2, tekrarSinav(i, gxKalinan, []));
      if (gxKalinan.length && i % 6 === 3) {
        sinav(2, tekrarSinav(i, gxKalinan, gxKalinan));
        sinav(3, tekrarSinav(i + 1, gxKalinan, gxKalinan));
      }
    }
  } else {
    // Kaldı: bir kısmı 2. ve 3. sınavda da kalmıştır.
    sinav(1, tamSinav(i, [...k1, ...gxKalinan]));
    if (i % 2 === 0) sinav(2, tekrarSinav(i, k1, [k1[0]]));
    if (i % 4 === 0) sinav(3, tekrarSinav(i + 1, [k1[0]], [k1[0]]));
  }
});

export const akademiSinavSonuclari: AkademiSinavSonucu[] =
  genelSonuclariHesapla(ham);

const GX_KARAR_NEDENLERI = {
  verebilir: [
    "Akademi sonrası gözlem derslerinde yeterli bulundu.",
    "Kulüpte gölge ders sonrası akademi ekibi onayladı.",
    "Tekrar uygulama değerlendirmesinde başarılı.",
  ],
  veremez: [
    "Sınav puanı yeterli ancak uygulama gözleminde teknik eksikler var.",
    "Ders akışı ve müzik kullanımında gelişim gerekiyor; tekrar değerlendirilecek.",
    "Katılımcı yönetimi yetersiz bulundu.",
  ],
};

/**
 * Örnek akademi kararları; eğitmenlerin çoğunda en az bir istisna olsun diye:
 * - GX dersinden kalanların yaklaşık yarısı akademi kararıyla "verebilir", diğerleri veremez;
 * - kalmadığı halde eğitmenlerin bir kısmında geçtiği bir ders akademi kararıyla "veremez".
 * Başlangıç aday verisine eklenir.
 */
export function gxKararOrnekleriniEkle(adaylar: AdayEgitmen[]): AdayEgitmen[] {
  return adaylar.map((a, i) => {
    if (a.surecDurumu !== "egitmen" && a.surecDurumu !== "pasif") return a;
    const gx = egitmeninAkademileri(akademiSinavSonuclari, a.id)
      .flatMap(({ nihai }) => nihai.dersler)
      .filter((d) => gxDersiMi(d.baslik) && d.nihai !== null);
    if (!gx.length) return a;
    const kalinanlar = gx.filter((d) => !gectiMi(d.nihai));
    const gecilenler = gx.filter((d) => gectiMi(d.nihai));
    const kararlar: NonNullable<AdayEgitmen["gxKararlari"]> = [];
    const ekle = (ders: (typeof gx)[number], karar: "verebilir" | "veremez") =>
      kararlar.push({
        ders: ders.baslik.ad,
        karar,
        neden: `${GX_KARAR_NEDENLERI[karar][i % 3]} (Sınav puanı ${ders.nihai})`,
        yapan: "Elif Su (İK)",
        tarih: `${String(1 + (i % 27)).padStart(2, "0")}.0${1 + (i % 9)}.2026`,
      });
    if (kalinanlar.length && i % 2 === 0) ekle(kalinanlar[0], "verebilir");
    if (gecilenler.length && i % 4 !== 3)
      ekle(gecilenler[i % gecilenler.length], "veremez");
    return kararlar.length ? { ...a, gxKararlari: kararlar } : a;
  });
}
