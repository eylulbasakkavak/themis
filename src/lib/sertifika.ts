import type { Tone } from "./status";
import type { AdayEgitmen, EgitmenSertifikasi, TemelEgitimSonucu } from "./types";

/**
 * Branş ve kademe tanımları (PRD 12.1). Fitness varsayılan ve tüm eğitmenler için takip
 * edilen temel branştır; diğer branşlar Sistem Yöneticisi tarafından tanımlanır (tanım
 * ekranı gelene kadar burada tutulur).
 */
export const BRANS_TANIMLARI = [
  {
    ad: "Fitness",
    federasyon: "Türkiye Vücut Geliştirme, Fitness ve Bilek Güreşi Federasyonu",
    kademeSayisi: 5,
  },
  { ad: "Pilates", federasyon: "Türkiye Cimnastik Federasyonu", kademeSayisi: 5 },
  { ad: "Yoga", federasyon: "Türkiye Cimnastik Federasyonu", kademeSayisi: 5 },
  { ad: "Boks", federasyon: "Türkiye Boks Federasyonu", kademeSayisi: 5 },
];

export const TEMEL_BRANS = "Fitness";

export const bransTanimi = (brans: string) => BRANS_TANIMLARI.find((b) => b.ad === brans);

/** Temel eğitim sınavının dersleri (PRD 12.3). */
export const TEMEL_EGITIM_DERSLERI = [
  "Sporda Öğrenme ve Öğretim",
  "Spor Yönetimi",
  "Spor ve Sağlık Bilgisi",
  "Sporda Psikososyal Alanlar",
  "Hareket ve Antrenman Bilimi",
];

/** Vize bitimine bu kadar gün kala uyarı başlar (PRD 12.5). */
export const VIZE_UYARI_GUNU = 30;

export type VizeDurumu = "gecerli" | "yaklasiyor" | "gecmis" | "yok";

const GUN = 24 * 60 * 60 * 1000;

function tarihCoz(tarih: string): Date | null {
  const [g, a, y] = tarih.split(".").map(Number);
  return g && a && y ? new Date(y, a - 1, g) : null;
}

function bugun(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

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
export const VIZE_DURUMU_BILGI: Record<VizeDurumu, { label: string; tone: Tone; nokta: string }> = {
  gecerli: { label: "Geçerli", tone: "green", nokta: "bg-emerald-500" },
  yaklasiyor: { label: "Vize yaklaşıyor", tone: "amber", nokta: "bg-amber-500" },
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

const ONCELIK: Record<VizeDurumu, number> = { gecmis: 0, yaklasiyor: 1, yok: 2, gecerli: 3 };

/**
 * Bir branştaki aktif sertifika: İK onaylı belgeler arasından en yüksek kademe. Daha düşük
 * kademeli eski belgeler kademe geçmişinde kalır, uyarılarda dikkate alınmaz.
 */
export function aktifSertifika(a: AdayEgitmen, brans: string): EgitmenSertifikasi | undefined {
  return (a.sertifikalar ?? [])
    .filter((s) => s.brans === brans && s.onaylandi)
    .sort((x, y) => y.kademe - x.kademe)[0];
}

/** Her branşın aktif sertifikası; Fitness her zaman ilk sırada. */
export function aktifSertifikalar(a: AdayEgitmen): EgitmenSertifikasi[] {
  const branslar = [...new Set((a.sertifikalar ?? []).map((s) => s.brans))].sort((x, y) =>
    x === TEMEL_BRANS ? -1 : y === TEMEL_BRANS ? 1 : x.localeCompare(y, "tr")
  );
  return branslar.map((b) => aktifSertifika(a, b)).filter((s): s is EgitmenSertifikasi => !!s);
}

/** Branşın tüm kademe belgeleri, yeniden eskiye (onay bekleyen ve reddedilenler dahil). */
export function kademeGecmisi(a: AdayEgitmen, brans: string): EgitmenSertifikasi[] {
  return (a.sertifikalar ?? [])
    .filter((s) => s.brans === brans)
    .sort(
      (x, y) =>
        y.kademe - x.kademe ||
        (tarihCoz(y.belgeTarihi)?.getTime() ?? 0) - (tarihCoz(x.belgeTarihi)?.getTime() ?? 0)
    );
}

export type AdimDurumu = "tamam" | "onayda" | "basarisiz" | "bekleniyor" | "yok";

export type KademeYolculugu = {
  mevcut: number;
  hedef: number | null;
  // PRD 12.3: "N. Kademe temel eğitimi yok" / "… temel eğitimi var, kurs bekleniyor" /
  // "N. Kademe belgesi var". Onayda bekleyen ve başarısız sonuçlar da ayrıca belirtilir.
  durum:
    | "temel_yok"
    | "temel_onayda"
    | "temel_basarisiz"
    | "kurs_bekleniyor"
    | "belge_onayda"
    | "en_ust";
  metin: string;
  // Bir üst kademe için adımlar: temel eğitim → federasyon kursu → kademe belgesi.
  adimlar: { temel: AdimDurumu; kurs: AdimDurumu; belge: AdimDurumu };
};

/**
 * Bir branşta bir üst kademeye giden yolun durumu. Profildeki adımlar, yolculuk metni ve
 * temel eğitim listesi hep bu fonksiyondan beslenir; böylece birbirleriyle çelişmez.
 */
export function kademeYolculugu(a: AdayEgitmen, brans: string): KademeYolculugu {
  const mevcut = aktifSertifika(a, brans)?.kademe ?? 0;
  const enUst = bransTanimi(brans)?.kademeSayisi ?? 5;
  if (mevcut >= enUst) {
    return {
      mevcut,
      hedef: null,
      durum: "en_ust",
      metin: `${mevcut}. Kademe belgesi var (en üst kademe)`,
      adimlar: { temel: "tamam", kurs: "tamam", belge: "tamam" },
    };
  }
  const hedef = mevcut + 1;
  const sonTemel = (a.temelEgitimSonuclari ?? [])
    .filter((t) => t.brans === brans && t.hedefKademe === hedef && !t.redSebebi)
    .at(-1);
  const belgeOnayda = (a.sertifikalar ?? []).some(
    (s) => s.brans === brans && s.kademe === hedef && !s.onaylandi && !s.redSebebi
  );
  const temelGecti = !!sonTemel && sonTemel.onaylandi && sonTemel.sonuc === "Geçti";

  if (belgeOnayda) {
    return {
      mevcut,
      hedef,
      durum: "belge_onayda",
      metin: `${hedef}. Kademe belgesi İK onayında`,
      adimlar: { temel: "tamam", kurs: "tamam", belge: "onayda" },
    };
  }
  if (temelGecti) {
    return {
      mevcut,
      hedef,
      durum: "kurs_bekleniyor",
      metin: `${hedef}. Kademe temel eğitimi var, kurs bekleniyor`,
      adimlar: { temel: "tamam", kurs: "bekleniyor", belge: "yok" },
    };
  }
  if (sonTemel && !sonTemel.onaylandi) {
    return {
      mevcut,
      hedef,
      durum: "temel_onayda",
      metin: `${hedef}. Kademe temel eğitimi sonucu (${sonTemel.sonuc}) İK onayında`,
      adimlar: { temel: "onayda", kurs: "yok", belge: "yok" },
    };
  }
  if (sonTemel) {
    return {
      mevcut,
      hedef,
      durum: "temel_basarisiz",
      metin:
        sonTemel.sonuc === "Katılmadı"
          ? `${hedef}. Kademe temel eğitimi sınavına katılmadı`
          : `${hedef}. Kademe temel eğitiminden kaldı`,
      adimlar: { temel: "basarisiz", kurs: "yok", belge: "yok" },
    };
  }
  return {
    mevcut,
    hedef,
    durum: "temel_yok",
    metin: `${hedef}. Kademe temel eğitimi yok`,
    adimlar: { temel: "yok", kurs: "yok", belge: "yok" },
  };
}

/** Sistemin otomatik hesapladığı kaldığı ders sayısı (PRD 12.3). */
export const kaldigiDersSayisi = (t: TemelEgitimSonucu) =>
  Object.values(t.dersler).filter((d) => d === "Kaldı").length;

/**
 * Eğitmenin en acil vize durumundaki sertifikası: önce vizesi geçmiş, sonra bitimi yaklaşan;
 * aynı durumdakiler arasında bitişi en erken olan.
 */
export function enAcilSertifika(a: AdayEgitmen): EgitmenSertifikasi | undefined {
  return aktifSertifikalar(a).sort(
    (x, y) =>
      ONCELIK[vizeDurumu(x)] - ONCELIK[vizeDurumu(y)] ||
      (vizeKalanGun(x) ?? Infinity) - (vizeKalanGun(y) ?? Infinity)
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
    (s) => (!s.onaylandi && !s.redSebebi) || s.vizeler?.some((v) => !v.onaylandi && !v.redSebebi)
  ) || !!a.temelEgitimSonuclari?.some((t) => !t.onaylandi && !t.redSebebi);

export const fitnessSertifikasi = (a: AdayEgitmen) => aktifSertifika(a, TEMEL_BRANS);
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
  dersler: Record<string, "Geçti" | "Kaldı">
): "Geçti" | "Kaldı" | "Katılmadı" | null {
  if (katilmadi) return "Katılmadı";
  if (!TEMEL_EGITIM_DERSLERI.every((d) => dersler[d])) return null;
  return TEMEL_EGITIM_DERSLERI.some((d) => dersler[d] === "Kaldı") ? "Kaldı" : "Geçti";
}
