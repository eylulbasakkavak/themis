import type {
  AdayEgitmen,
  AkademiSinavSonucu,
  GxKarari,
  SinavBasligi,
} from "./types";

/**
 * Akademi sınav kuralları (PRD 9):
 * - Bir akademide 3 sınav hakkı vardır; 2. ve 3. sınava yalnızca kalınan derslerden (Fitness ya da
 *   GX) girilir.
 * - Bir dersin sonucu, o derse girilen son sınavdır.
 * - Genel sonuç: Fitness Teorik ve Fitness Uygulama'daki her ders 70+ ise "Geçti". GX dersleri
 *   genel sonucu etkilemez.
 * - GX dersi 3 sınavdan birinde geçildiyse eğitmen o dersi verebilir, geçilmediyse veremez.
 */

/** Puanı bu değerin altında olan ders "kaldı" olarak işaretlenir (PRD 9.1). */
export const GECME_PUANI = 70;

export const FITNESS_GRUPLARI = ["FITNESS TEORİK", "FITNESS UYGULAMA"];
export const GX_GRUBU = "GX DERSLERİ";
export const SINAV_HAKKI = 3;

export const fitnessDersiMi = (b: SinavBasligi) =>
  FITNESS_GRUPLARI.includes(b.grup);
export const gxDersiMi = (b: SinavBasligi) => b.grup === GX_GRUBU;
const dersAnahtari = (b: SinavBasligi) => `${b.grup}|${b.ad}`;
export const gectiMi = (p: number | null | undefined) =>
  p != null && p >= GECME_PUANI;

/** Bir sınav kaydının hangi akademiye ait olduğu. */
export const akademiAnahtari = (
  s: Pick<AkademiSinavSonucu, "akademiDonemiId">,
) => s.akademiDonemiId ?? "";

export type DersNihaisi = {
  baslik: SinavBasligi;
  // Sınav no → puan (o sınava girilmediyse yok).
  puanlar: Partial<Record<1 | 2 | 3, number | null>>;
  nihai: number | null;
  // Nihai puanın geldiği sınav.
  nihaiSinavNo: 1 | 2 | 3 | null;
};

export type AkademiNihaisi = {
  denemeler: AkademiSinavSonucu[];
  dersler: DersNihaisi[];
  genelSonuc: "Geçti" | "Kaldı" | null;
  sonSinavNo: number;
  // Kalınan (Fitness ya da GX) ders ve hak varsa bir sonraki sınav ve girilecek dersler.
  sonrakiSinavNo: 2 | 3 | null;
  kalinanDersler: SinavBasligi[];
};

/** Bir eğitmenin bir akademideki tüm sınavlarından ders bazında son durum ve genel sonuç. */
export function akademiNihaisi(
  denemeler: AkademiSinavSonucu[],
): AkademiNihaisi {
  const sirali = [...denemeler].sort((x, y) => x.sinavNo - y.sinavNo);
  const dersler = new Map<string, DersNihaisi>();
  for (const d of sirali) {
    d.basliklar.forEach((b, i) => {
      const k = dersAnahtari(b);
      const ders = dersler.get(k) ?? {
        baslik: b,
        puanlar: {},
        nihai: null,
        nihaiSinavNo: null,
      };
      const p = d.puanlar[i];
      if (p !== null && p !== undefined) {
        ders.puanlar[d.sinavNo] = p;
        ders.nihai = p;
        ders.nihaiSinavNo = d.sinavNo;
      }
      dersler.set(k, ders);
    });
  }
  const liste = [...dersler.values()];
  const fitness = liste.filter((d) => fitnessDersiMi(d.baslik));
  const genelSonuc = sirali.length
    ? fitness.length && fitness.every((d) => gectiMi(d.nihai))
      ? "Geçti"
      : "Kaldı"
    : null;
  const sonSinavNo = sirali.at(-1)?.sinavNo ?? 0;
  const kalinanDersler = liste
    .filter((d) => !gectiMi(d.nihai))
    .map((d) => d.baslik);
  return {
    denemeler: sirali,
    dersler: liste,
    genelSonuc,
    sonSinavNo,
    // GX dersinden kalan da (genel sonuç "Geçti" olsa bile) hakkı varsa sonraki sınava girer.
    sonrakiSinavNo:
      kalinanDersler.length && sonSinavNo < SINAV_HAKKI
        ? ((sonSinavNo + 1) as 2 | 3)
        : null,
    kalinanDersler,
  };
}

/** Eğitmenin bir akademideki sınav kayıtları. */
export const akademiDenemeleri = (
  sonuclar: AkademiSinavSonucu[],
  egitmenId: string,
  akademiDonemiId?: string,
) =>
  sonuclar.filter(
    (s) =>
      s.egitmenId === egitmenId &&
      (akademiDonemiId
        ? s.akademiDonemiId === akademiDonemiId
        : !s.akademiDonemiId),
  );

/** Eğitmenin bir akademideki genel sonucu (denemelerden hesaplanır); sonuç yoksa undefined. */
export function akademiGenelSonucu(
  sonuclar: AkademiSinavSonucu[],
  egitmenId: string,
  akademiDonemiId?: string,
): "Geçti" | "Kaldı" | undefined {
  const d = akademiDenemeleri(sonuclar, egitmenId, akademiDonemiId);
  return d.length ? (akademiNihaisi(d).genelSonuc ?? undefined) : undefined;
}

/** Eğitmenin akademilerine göre gruplanmış sınav sonuçları (en yeni akademi üstte). */
export function egitmeninAkademileri(
  sonuclar: AkademiSinavSonucu[],
  egitmenId: string,
) {
  const gruplar = new Map<string, AkademiSinavSonucu[]>();
  for (const s of sonuclar.filter((x) => x.egitmenId === egitmenId)) {
    const k = akademiAnahtari(s);
    gruplar.set(k, [...(gruplar.get(k) ?? []), s]);
  }
  return [...gruplar.entries()].map(([anahtar, liste]) => ({
    anahtar,
    nihai: akademiNihaisi(liste),
  }));
}

/** Her sınav kaydının genel sonucunu, o sınava kadarki denemelerden yeniden hesaplar. */
export function genelSonuclariHesapla(
  liste: AkademiSinavSonucu[],
): AkademiSinavSonucu[] {
  return liste.map((s) => {
    const oncekiler = liste.filter(
      (x) =>
        x.egitmenId === s.egitmenId &&
        akademiAnahtari(x) === akademiAnahtari(s) &&
        x.sinavNo <= s.sinavNo,
    );
    return {
      ...s,
      genelSonuc: akademiNihaisi(oncekiler).genelSonuc ?? "Kaldı",
    };
  });
}

export type GxYetkinlik = {
  ders: string;
  // Akademi sınavındaki son puan ve geldiği sınav (yoksa null).
  puan: number | null;
  sinavNo: number | null;
  // Sistem önerisi: puan 70+ ise verebilir.
  oneri: "verebilir" | "veremez" | null;
  // Geçerli karar: akademi kararı varsa o, yoksa öneri.
  karar: "verebilir" | "veremez" | null;
  // Öneriden farklı akademi kararı ve geçmişi.
  degistirildi: boolean;
  sonKarar?: GxKarari;
  gecmis: GxKarari[];
};

/** Akademi sınavındaki GX dersleri (Excel başlıkları). */
export const gxDersleri = (basliklar: SinavBasligi[]) =>
  basliklar.filter(gxDersiMi).map((b) => b.ad);

/**
 * GX ders yetkinliği: akademi sınavındaki son puandan sistem önerisi (70+ verebilir) ve İK /
 * Sistem Yöneticisi'nin akademi kararı. Karar kademeden bağımsızdır.
 */
export function gxYetkinlikleri(
  aday: AdayEgitmen,
  sonuclar: AkademiSinavSonucu[],
  dersler: string[],
): GxYetkinlik[] {
  const akademiler = egitmeninAkademileri(sonuclar, aday.id);
  return dersler.map((ders) => {
    let puan: number | null = null;
    let sinavNo: number | null = null;
    for (const { nihai } of akademiler) {
      const d = nihai.dersler.find(
        (x) => gxDersiMi(x.baslik) && x.baslik.ad === ders,
      );
      if (d && d.nihai !== null) {
        puan = d.nihai;
        sinavNo = d.nihaiSinavNo;
      }
    }
    const oneri =
      puan === null ? null : gectiMi(puan) ? "verebilir" : "veremez";
    const gecmis = (aday.gxKararlari ?? []).filter((k) => k.ders === ders);
    const sonKarar = gecmis.at(-1);
    const karar = sonKarar?.karar ?? oneri;
    return {
      ders,
      puan,
      sinavNo,
      oneri,
      karar,
      degistirildi: !!sonKarar && sonKarar.karar !== oneri,
      sonKarar,
      gecmis,
    };
  });
}
