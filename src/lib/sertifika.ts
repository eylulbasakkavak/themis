import { bugun, tarihCoz, tarihYaz } from "./akademi";
import type { Tone } from "./status";
import {
  kademeHakki,
  temelSeviyeDurumu,
  type TemelSeviyeDurumu,
} from "./temelEgitim";
import type {
  AdayEgitmen,
  EgitmenSertifikasi,
  TemelEgitimSonucu,
} from "./types";

/** Kademe unvanları: 5 kademeli antrenör ve 3 kademeli eğitmen yapısı. */
const ANTRENOR_KADEMELERI = [
  "Yardımcı Antrenör",
  "Temel Antrenör",
  "Kıdemli Antrenör",
  "Başantrenör",
  "Teknik Direktör",
];
const EGITMEN_KADEMELERI = [
  "Yardımcı Eğitmen",
  "Temel Eğitmen",
  "Kıdemli Eğitmen",
];

/** Bir üst kademeye geçiş şartı: mevcut kademe belgesinden sonra bekleme ve gelişim semineri. */
export type GecisSarti = { yil: number; seminer: number };

// gecisler[i]: (i+1). kademeden (i+2). kademeye geçiş.
const ANTRENOR_GECISLERI: GecisSarti[] = [
  { yil: 1, seminer: 0 },
  { yil: 2, seminer: 2 },
  { yil: 2, seminer: 2 },
  { yil: 2, seminer: 2 },
];
const EGITMEN_GECISLERI: GecisSarti[] = [
  { yil: 1, seminer: 1 },
  { yil: 2, seminer: 2 },
];

export type BransTanimi = {
  ad: string;
  federasyon: string;
  federasyonKisa: string;
  kademeSayisi: number;
  // Kademe unvanları; kademeler[k - 1] = k. kademenin unvanı.
  kademeler: string[];
  gecisler: GecisSarti[];
};

function brans(
  ad: string,
  federasyon: string,
  federasyonKisa: string,
  yapi: "antrenor" | "egitmen",
): BransTanimi {
  const kademeler =
    yapi === "antrenor" ? ANTRENOR_KADEMELERI : EGITMEN_KADEMELERI;
  return {
    ad,
    federasyon,
    federasyonKisa,
    kademeSayisi: kademeler.length,
    kademeler,
    gecisler: yapi === "antrenor" ? ANTRENOR_GECISLERI : EGITMEN_GECISLERI,
  };
}

/**
 * Federasyon, branş ve kademe tanımları (PRD 12.1). Fitness varsayılan ve tüm eğitmenler için
 * takip edilen temel branştır; diğer branşlar Sistem Yöneticisi tarafından tanımlanır (tanım
 * ekranı gelene kadar burada tutulur). Pilates, Step-Aerobik ve Yoga'da 3 kademe vardır.
 */
export const BRANS_TANIMLARI: BransTanimi[] = [
  brans(
    "Fitness",
    "Türkiye Vücut Geliştirme, Fitness ve Bilek Güreşi Federasyonu",
    "TVGFBF",
    "antrenor",
  ),
  brans(
    "Kick Boks",
    "Türkiye Kick Boks Federasyonu",
    "Kick Boks Fed.",
    "antrenor",
  ),
  brans("Boks", "Türkiye Boks Federasyonu", "Boks Fed.", "antrenor"),
  brans(
    "Pilates",
    "Türkiye Cimnastik Federasyonu",
    "Cimnastik Fed.",
    "egitmen",
  ),
  brans(
    "Step-Aerobik",
    "Türkiye Cimnastik Federasyonu",
    "Cimnastik Fed.",
    "egitmen",
  ),
  brans(
    "Dans Sporları",
    "Türkiye Dans Sporları Federasyonu",
    "Dans Sporları Fed.",
    "antrenor",
  ),
  brans("Yoga", "Türkiye Herkes İçin Spor Federasyonu", "HİS", "egitmen"),
];

/** Dropdown için federasyonlar (tanım sırasıyla, tekrarsız). */
export const FEDERASYONLAR = [
  ...new Set(BRANS_TANIMLARI.map((b) => b.federasyon)),
];

export const TEMEL_BRANS = "Fitness";

export const bransTanimi = (brans: string) =>
  BRANS_TANIMLARI.find((b) => b.ad === brans);

/** "3. Kademe · Kıdemli Antrenör" */
export function kademeAdi(brans: string, kademe: number): string {
  const unvan = bransTanimi(brans)?.kademeler[kademe - 1];
  return unvan ? `${kademe}. Kademe · ${unvan}` : `${kademe}. Kademe`;
}

/** (hedef - 1). kademeden hedef kademeye geçiş şartı; ilk kademe için yok. */
export const gecisSarti = (
  brans: string,
  hedef: number,
): GecisSarti | undefined => bransTanimi(brans)?.gecisler[hedef - 2];

/** Temel eğitim sınavının dersleri (PRD 12.3). */
export const TEMEL_EGITIM_DERSLERI = [
  "Sporda Öğrenme ve Öğretim",
  "Spor Yönetimi",
  "Spor ve Sağlık Bilgisi",
  "Sporda Psikososyal Alanlar",
  "Hareket ve Antrenman Bilimi",
];

/**
 * Vize gelişim seminerinden gelir: son 1 yıl içinde o branşta İK onaylı gelişim semineri (ya da
 * yeni kademe belgesi) varsa sertifika vizelidir. Ayrı vize kaydı tutulmaz; tek tip seminer hem
 * kademe geçişinde sayılır hem vizeyi yeniler.
 */
export const VIZE_GECERLILIK_YILI = 1;

/**
 * Sertifikaların vize bitişini gelişim seminerlerinden yeniden hesaplar: branştaki en son onaylı
 * seminer ile belge tarihinden geç olanı + 1 yıl. vizeDonemi, vizeyi sağlayan seminerin tarihidir
 * (seminer yoksa boş). Seminer ya da belge eklendiğinde / onaylandığında çağrılır.
 */
export function seminerVizeleriniGuncelle(a: AdayEgitmen): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) => {
      const belge = tarihCoz(s.belgeTarihi);
      const son = (a.gelisimSeminerleri ?? [])
        .filter((g) => g.brans === s.brans && g.onaylandi)
        .map((g) => ({ g, t: tarihCoz(g.seminerTarihi) }))
        .filter((x) => !!x.t && (!belge || x.t >= belge))
        .sort((x, y) => y.t!.getTime() - x.t!.getTime())[0];
      const baz = son?.t ?? belge;
      if (!baz) return s;
      return {
        ...s,
        vizeDonemi: son?.g.seminerTarihi,
        vizeBitisTarihi: tarihYaz(
          new Date(
            baz.getFullYear() + VIZE_GECERLILIK_YILI,
            baz.getMonth(),
            baz.getDate(),
          ),
        ),
      };
    }),
  };
}

/** Vize bitimine bu kadar gün kala uyarı başlar (PRD 12.5). */
export const VIZE_UYARI_GUNU = 30;

export type VizeDurumu = "gecerli" | "yaklasiyor" | "gecmis" | "yok";

const GUN = 24 * 60 * 60 * 1000;

/** Vize bitimine kalan gün (geçmişse negatif); vize bilgisi yoksa null. */
export function vizeKalanGun(s: EgitmenSertifikasi): number | null {
  const bitis = s.vizeBitisTarihi ? tarihCoz(s.vizeBitisTarihi) : null;
  return bitis ? Math.round((bitis.getTime() - bugun().getTime()) / GUN) : null;
}

export function vizeDurumu(s: EgitmenSertifikasi): VizeDurumu {
  const kalan = vizeKalanGun(s);
  if (kalan === null) return "yok";
  if (kalan < 0) return "gecmis";
  if (kalan < VIZE_UYARI_GUNU) return "yaklasiyor";
  return "gecerli";
}

/** Durum işaretleri (PRD 12.5): 🟢 Geçerli · 🟡 30 günden az · 🔴 Vizesi geçmiş. */
export const VIZE_DURUMU_BILGI: Record<
  VizeDurumu,
  { label: string; tone: Tone; nokta: string }
> = {
  gecerli: { label: "Geçerli", tone: "green", nokta: "bg-emerald-500" },
  yaklasiyor: {
    label: "Vize yaklaşıyor",
    tone: "amber",
    nokta: "bg-amber-500",
  },
  gecmis: { label: "Vizesi geçmiş", tone: "red", nokta: "bg-rose-600" },
  yok: { label: "Vize bilgisi yok", tone: "gray", nokta: "bg-zinc-300" },
};

/** Rozet metni: "Vizesi geçmiş", "6 gün kaldı" ya da "Geçerli". */
export function vizeRozetMetni(s: EgitmenSertifikasi): string {
  const kalan = vizeKalanGun(s);
  if (vizeDurumu(s) === "yaklasiyor" && kalan !== null) {
    return kalan === 0 ? "Bugün bitiyor" : `${kalan} gün kaldı`;
  }
  return VIZE_DURUMU_BILGI[vizeDurumu(s)].label;
}

/** Rozetin altındaki açıklama: "Pilates · 5 gün önce doldu" / "Fitness · bitiş 10.10.2026". */
export function vizeAciklamasi(s: EgitmenSertifikasi): string {
  const kalan = vizeKalanGun(s);
  if (kalan === null) return `${s.brans} · vize girilmedi`;
  if (kalan < 0) return `${s.brans} · ${-kalan} gün önce doldu`;
  if (kalan === 0) return `${s.brans} · bitiş bugün`;
  return `${s.brans} · bitiş ${s.vizeBitisTarihi}`;
}

const ONCELIK: Record<VizeDurumu, number> = {
  gecmis: 0,
  yaklasiyor: 1,
  yok: 2,
  gecerli: 3,
};

/**
 * Bir branştaki aktif sertifika: İK onaylı belgeler arasından en yüksek kademe. Daha düşük
 * kademeli eski belgeler kademe geçmişinde kalır, uyarılarda dikkate alınmaz.
 */
export function aktifSertifika(
  a: AdayEgitmen,
  brans: string,
): EgitmenSertifikasi | undefined {
  return (a.sertifikalar ?? [])
    .filter((s) => s.brans === brans && s.onaylandi)
    .sort((x, y) => y.kademe - x.kademe)[0];
}

/** Her branşın aktif sertifikası; Fitness her zaman ilk sırada. */
export function aktifSertifikalar(a: AdayEgitmen): EgitmenSertifikasi[] {
  const branslar = [
    ...new Set((a.sertifikalar ?? []).map((s) => s.brans)),
  ].sort((x, y) =>
    x === TEMEL_BRANS ? -1 : y === TEMEL_BRANS ? 1 : x.localeCompare(y, "tr"),
  );
  return branslar
    .map((b) => aktifSertifika(a, b))
    .filter((s): s is EgitmenSertifikasi => !!s);
}

/** Branşın tüm kademe belgeleri, yeniden eskiye (onay bekleyen ve reddedilenler dahil). */
export function kademeGecmisi(
  a: AdayEgitmen,
  brans: string,
): EgitmenSertifikasi[] {
  return (a.sertifikalar ?? [])
    .filter((s) => s.brans === brans)
    .sort(
      (x, y) =>
        y.kademe - x.kademe ||
        (tarihCoz(y.belgeTarihi)?.getTime() ?? 0) -
          (tarihCoz(x.belgeTarihi)?.getTime() ?? 0),
    );
}

export type AdimDurumu =
  "tamam" | "onayda" | "basarisiz" | "bekleniyor" | "yok";

/** Bir üst kademe için ön koşul: bekleme süresi, gelişim semineri ve temel eğitim seviyesi. */
export type OnKosul = {
  anahtar: "bekleme" | "seminer" | "temel";
  ad: string;
  durum: AdimDurumu;
  detay: string;
};

/** Branşın aktif belgesinden sonra girilen gelişim seminerleri (reddedilenler hariç). */
export function kademeSeminerleri(a: AdayEgitmen, brans: string) {
  const baslangic =
    tarihCoz(aktifSertifika(a, brans)?.belgeTarihi ?? "")?.getTime() ?? 0;
  return (a.gelisimSeminerleri ?? []).filter(
    (s) =>
      s.brans === brans &&
      !s.redSebebi &&
      (tarihCoz(s.seminerTarihi)?.getTime() ?? 0) >= baslangic,
  );
}

function temelOnKosulu(d: TemelSeviyeDurumu, hedef: number): OnKosul {
  const ad = `${hedef}. Kademe temel eğitim`;
  switch (d.durum) {
    case "sinav":
      return {
        anahtar: "temel",
        ad,
        durum: "tamam",
        detay: `Sınav ${d.sonuc.sinavTarihi}${
          d.gecerlilikBitisi
            ? ` · başvuru için ${tarihYaz(d.gecerlilikBitisi)} tarihine kadar geçerli`
            : ""
        }`,
      };
    case "suresi_doldu":
      return {
        anahtar: "temel",
        ad,
        durum: "basarisiz",
        detay: `Sınav ${d.sonuc.sinavTarihi} · 4 yıllık süresi ${
          d.gecerlilikBitisi ? tarihYaz(d.gecerlilikBitisi) : ""
        } tarihinde doldu, yeniden alınmalı`,
      };
    case "muaf":
      return {
        anahtar: "temel",
        ad,
        durum: "tamam",
        detay: `Muaf · ${d.muafiyet.kural}`,
      };
    case "onayda":
      return {
        anahtar: "temel",
        ad,
        durum: "onayda",
        detay: "Sınav sonucu İK onayında",
      };
    case "basarisiz":
      return {
        anahtar: "temel",
        ad,
        durum: "basarisiz",
        detay:
          d.sonuc.sonuc === "Katılmadı" ? "Sınava katılmadı" : "Sınavdan kaldı",
      };
    default:
      return { anahtar: "temel", ad, durum: "yok", detay: "Tamamlanmadı" };
  }
}

/**
 * Bir branşta hedef kademenin ön koşulları. Bekleme süresi ve gelişim semineri yalnızca bir alt
 * kademeden yükselirken aranır; mezuniyetle doğrudan başvurulan ya da denklikle gelinen kademede
 * aranmaz ve alt kademe belgesinin olmaması uyarı sayılmaz (belgeyi Bakanlık verir). Temel eğitim
 * her kademede (1–5) sınav ya da muafiyetle gerekir.
 */
export function kademeOnKosullari(
  a: AdayEgitmen,
  brans: string,
  hedef: number,
): OnKosul[] {
  const aktif = aktifSertifika(a, brans);
  const mevcut = aktif?.kademe ?? 0;
  const hak = kademeHakki(a, brans);
  const hakla = !!hak && hak.kademe >= hedef && mevcut < hedef;
  const sart = gecisSarti(brans, hedef);
  const kosullar: OnKosul[] = [];

  if (aktif && sart && !hakla && hedef === mevcut + 1) {
    const bas = tarihCoz(aktif.belgeTarihi);
    const dolar = bas
      ? new Date(bas.getFullYear() + sart.yil, bas.getMonth(), bas.getDate())
      : null;
    const doldu = !!dolar && dolar.getTime() <= bugun().getTime();
    kosullar.push({
      anahtar: "bekleme",
      ad: `${sart.yil} yıl bekleme`,
      durum: doldu ? "tamam" : "bekleniyor",
      detay: dolar
        ? `${mevcut}. kademe ${aktif.belgeTarihi} · ${doldu ? "doldu" : `${tarihYaz(dolar)} tarihinde doluyor`}`
        : "Belge tarihi yok",
    });
    if (sart.seminer > 0) {
      const seminerler = kademeSeminerleri(a, brans);
      const onayli = seminerler.filter((s) => s.onaylandi).length;
      kosullar.push({
        anahtar: "seminer",
        ad: `${sart.seminer} gelişim semineri`,
        durum:
          onayli >= sart.seminer
            ? "tamam"
            : seminerler.length >= sart.seminer
              ? "onayda"
              : "bekleniyor",
        detay: `${onayli} / ${sart.seminer} tamamlandı${
          seminerler.length > onayli
            ? ` · ${seminerler.length - onayli} İK onayında`
            : ""
        }`,
      });
    }
  }

  kosullar.push(temelOnKosulu(temelSeviyeDurumu(a, hedef, brans), hedef));
  return kosullar;
}

export type KademeYolculugu = {
  mevcut: number;
  hedef: number | null;
  // Hedef, eğitimden gelen kademe hakkıyla belirlendiyse kuralı.
  hakKurali?: string;
  durum: "en_ust" | "belge_onayda" | "hazir" | "eksik";
  metin: string;
  onKosullar: OnKosul[];
};

/**
 * Bir branşta bir üst kademeye giden yolun durumu. Profildeki ön koşullar ve yolculuk metni bu
 * fonksiyondan beslenir; böylece birbirleriyle çelişmez. Ön koşullar tamamsa federasyonun
 * uygulamalı eğitimi ve sınavı beklenir; sonuç kademe belgesiyle girilir.
 */
export function kademeYolculugu(
  a: AdayEgitmen,
  brans: string,
): KademeYolculugu {
  const mevcut = aktifSertifika(a, brans)?.kademe ?? 0;
  const enUst = bransTanimi(brans)?.kademeSayisi ?? 5;
  if (mevcut >= enUst) {
    return {
      mevcut,
      hedef: null,
      durum: "en_ust",
      metin: `${mevcut}. Kademe belgesi var (en üst kademe)`,
      onKosullar: [],
    };
  }
  const hak = kademeHakki(a, brans);
  const hedef = hak && hak.kademe > mevcut + 1 ? hak.kademe : mevcut + 1;
  const hakKurali = hak && hak.kademe >= hedef ? hak.kural : undefined;
  const onKosullar = kademeOnKosullari(a, brans, hedef);
  const belgeOnayda = (a.sertifikalar ?? []).some(
    (s) =>
      s.brans === brans && s.kademe === hedef && !s.onaylandi && !s.redSebebi,
  );
  if (belgeOnayda) {
    return {
      mevcut,
      hedef,
      hakKurali,
      durum: "belge_onayda",
      metin: `${hedef}. Kademe belgesi İK onayında`,
      onKosullar,
    };
  }
  const eksikler = onKosullar.filter((k) => k.durum !== "tamam");
  if (eksikler.length === 0) {
    return {
      mevcut,
      hedef,
      hakKurali,
      durum: "hazir",
      metin: `${hedef}. Kademe ön koşulları tamam · ${hedef}. kademe kursu bekleniyor`,
      onKosullar,
    };
  }
  return {
    mevcut,
    hedef,
    hakKurali,
    durum: "eksik",
    metin: `${hedef}. Kademe için eksik: ${eksikler.map((k) => k.ad.toLocaleLowerCase("tr-TR")).join(", ")}`,
    onKosullar,
  };
}

/** Sistemin otomatik hesapladığı kaldığı ders sayısı (PRD 12.3). */
export const kaldigiDersSayisi = (t: TemelEgitimSonucu) =>
  Object.values(t.dersler).filter((d) => d === "Kaldı").length;

/**
 * Eğitmenin en acil vize durumundaki sertifikası: önce vizesi geçmiş, sonra bitimi yaklaşan;
 * aynı durumdakiler arasında bitişi en erken olan.
 */
export function enAcilSertifika(
  a: AdayEgitmen,
): EgitmenSertifikasi | undefined {
  return aktifSertifikalar(a).sort(
    (x, y) =>
      ONCELIK[vizeDurumu(x)] - ONCELIK[vizeDurumu(y)] ||
      (vizeKalanGun(x) ?? Infinity) - (vizeKalanGun(y) ?? Infinity),
  )[0];
}

/** Listede sıralama için: vizesi geçmiş en üstte, sonra bitimi en yakın olan. */
export function vizeAciliyetSirasi(a: AdayEgitmen): number {
  const s = enAcilSertifika(a);
  if (!s) return Number.MAX_SAFE_INTEGER;
  return ONCELIK[vizeDurumu(s)] * 100_000 + (vizeKalanGun(s) ?? 99_999);
}

export const vizesiGecmisMi = (a: AdayEgitmen) =>
  aktifSertifikalar(a).some((s) => vizeDurumu(s) === "gecmis");
export const vizesiYaklasiyorMu = (a: AdayEgitmen) =>
  aktifSertifikalar(a).some((s) => vizeDurumu(s) === "yaklasiyor");
/** İK onayı bekleyen kademe belgesi, vize ya da temel eğitim sonucu var mı. */
export const onayBekleyenSertifikaVarMi = (a: AdayEgitmen) =>
  !!a.sertifikalar?.some(
    (s) =>
      (!s.onaylandi && !s.redSebebi) ||
      s.vizeler?.some((v) => !v.onaylandi && !v.redSebebi),
  ) ||
  !!a.temelEgitimSonuclari?.some((t) => !t.onaylandi && !t.redSebebi) ||
  !!a.gelisimSeminerleri?.some((s) => !s.onaylandi && !s.redSebebi);

export const fitnessSertifikasi = (a: AdayEgitmen) =>
  aktifSertifika(a, TEMEL_BRANS);
export const digerBransSertifikalari = (a: AdayEgitmen) =>
  aktifSertifikalar(a).filter((s) => s.brans !== TEMEL_BRANS);

/** Tablolarda kullanılan kısa ders başlıkları. */
export const TEMEL_EGITIM_DERS_KISA: Record<string, string> = {
  "Sporda Öğrenme ve Öğretim": "Öğrenme ve Öğretim",
  "Spor Yönetimi": "Spor Yönetimi",
  "Spor ve Sağlık Bilgisi": "Sağlık Bilgisi",
  "Sporda Psikososyal Alanlar": "Psikososyal Alanlar",
  "Hareket ve Antrenman Bilimi": "Antrenman Bilimi",
};

/**
 * Temel eğitim sınav sonucu ders sonuçlarından hesaplanır (Excel'deki gibi): katılmadıysa
 * "Katılmadı"; tüm dersler girildiyse bir ders bile kaldıysa "Kaldı", hepsi geçtiyse "Geçti".
 */
export function temelEgitimSonucuHesapla(
  katilmadi: boolean,
  dersler: Record<string, "Geçti" | "Kaldı">,
): "Geçti" | "Kaldı" | "Katılmadı" | null {
  if (katilmadi) return "Katılmadı";
  if (!TEMEL_EGITIM_DERSLERI.every((d) => dersler[d])) return null;
  return TEMEL_EGITIM_DERSLERI.some((d) => dersler[d] === "Kaldı")
    ? "Kaldı"
    : "Geçti";
}

export type GeriSayimDurumu = "doldu" | "uyari" | "devam" | "enust" | "yok";

export const GERI_SAYIM_ETIKETI: Record<GeriSayimDurumu, string> = {
  doldu: "Süre doldu",
  uyari: "1 ay kaldı",
  devam: "Süre devam ediyor",
  enust: "En üst kademe",
  yok: "Belge yok",
};

/**
 * Raporlamadaki kademe geri sayımı (Eğitmen Detay Sertifika sheet'indeki mantık): aktif kademe
 * belgesinden bir üst kademeye geçiş için federasyon tablosundaki bekleme süresi (ör. Fitness 1→2:
 * 12 ay, 2→3: 24 ay) sayılır.
 * - "X ay kaldı"; 1 ay kaldığında "⚠ N. Kademe alabilir – 1 ay kaldı";
 * - süre dolduysa "⛔ Süre doldu – X ay geçti" (X = süre dolduktan sonra geçen ay).
 */
export function kademeGeriSayimi(
  a: AdayEgitmen,
  brans: string,
): {
  durum: GeriSayimDurumu;
  metin: string;
  kademe: number;
  belgeTarihi?: string;
  gecenYil?: number;
} {
  const aktif = aktifSertifika(a, brans);
  if (!aktif) return { durum: "yok", metin: "", kademe: 0 };
  const bas = tarihCoz(aktif.belgeTarihi);
  const b = bugun();
  const gecenGun = bas ? (b.getTime() - bas.getTime()) / 86400000 : 0;
  const gecenAy = bas
    ? (b.getFullYear() - bas.getFullYear()) * 12 +
      (b.getMonth() - bas.getMonth()) -
      (b.getDate() < bas.getDate() ? 1 : 0)
    : 0;
  const ortak = {
    kademe: aktif.kademe,
    belgeTarihi: aktif.belgeTarihi,
    gecenYil: Math.round((gecenGun / 365) * 10) / 10,
  };
  const sart = gecisSarti(brans, aktif.kademe + 1);
  if (!sart) return { ...ortak, durum: "enust", metin: "En üst kademe" };
  const gereken = sart.yil * 12;
  const kalan = gereken - gecenAy;
  if (kalan <= 0) {
    return {
      ...ortak,
      durum: "doldu",
      metin: `⛔ Süre doldu – ${-kalan} ay geçti`,
    };
  }
  if (kalan === 1) {
    return {
      ...ortak,
      durum: "uyari",
      metin: `⚠ ${aktif.kademe + 1}. Kademe alabilir – 1 ay kaldı`,
    };
  }
  return { ...ortak, durum: "devam", metin: `${kalan} ay kaldı` };
}

/** Bir branşın 1. kademe belgesinin tarihi (onaylı). */
export const ilkKademeBelgeTarihi = (a: AdayEgitmen, brans: string) =>
  (a.sertifikalar ?? []).find(
    (s) => s.brans === brans && s.kademe === 1 && s.onaylandi,
  )?.belgeTarihi ?? "";
