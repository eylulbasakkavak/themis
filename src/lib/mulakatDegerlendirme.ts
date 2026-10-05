import { mulakatSonucuSonrasiDurum } from "./belgeKurallari";
import type { AdayEgitmen, AkademiTipi } from "./types";

/** Akademi mülakatının 6 değerlendirme kriteri (PRD 5.3). */
export const MULAKAT_KRITERLERI = [
  {
    anahtar: "kisiselOzellikler",
    ad: "Kişisel Özellikler",
    kapsam: "Vücut dili ve güler yüz, ses tonu ve anlaşılır olması, göz teması ve tavır",
  },
  {
    anahtar: "fizikselGorunum",
    ad: "Fiziksel Görünüm",
    kapsam: "Atletik yapı, postür, prezantabl olma",
  },
  {
    anahtar: "tecrube",
    ad: "Tecrübe",
    kapsam: "Fitness eğitmenliği, personal coach, grup ders eğitmenliği",
  },
  {
    anahtar: "egitimSertifika",
    ad: "Eğitim / Sertifika",
    kapsam: "Spor bilimleri fakültesi, üniversite, sertifikalar",
  },
  { anahtar: "egzersizBilgisi", ad: "Egzersiz Bilgisi", kapsam: "Teorik bilgi" },
  {
    anahtar: "tecrubeyiAktarabilme",
    ad: "Tecrübeyi Aktarabilme",
    kapsam: "Egzersiz uygulaması, koçluk becerisi",
  },
] as const;

export type MulakatKriterAnahtari = (typeof MULAKAT_KRITERLERI)[number]["anahtar"];

/** 6 kriterden en az bu kadarını karşılayan aday Olumlu sonuçlanır (PRD 5.4). */
export const OLUMLU_ESIGI = 4;

export type MulakatSonucu = "Olumlu" | "Olumsuz" | "Katılmadı";

export type MulakatDegerlendirmesi = {
  katilmadi: boolean;
  // Karşılıyor (✓) = 1, Karşılamıyor (✗) = 0; henüz işaretlenmemiş kriter yer almaz.
  kriterler: Partial<Record<MulakatKriterAnahtari, 0 | 1>>;
  // Her adayda girilebilir; Kısa Dönem akademiye yönlendirilen adaylarda zorunludur (PRD 5.5).
  kisaAkademiUygun?: boolean;
  // Olumsuz sonuçta zorunlu.
  aciklama?: string;
  // Her sonuçta girilebilir; Olumsuz sonuçta aday "Yeniden Değerlendirilebilir" durumuna geçer.
  altiAySonraBasvurabilir?: boolean;
  // Yalnızca İK ve akademi rolleri görür.
  kisiselNot?: string;
  // Sonucu giren kişi ve tarih otomatik kaydedilir (PRD 5.7).
  giren?: string;
  tarih?: string;
};

export function bosDegerlendirme(): MulakatDegerlendirmesi {
  return { katilmadi: false, kriterler: {} };
}

export function kisaAkademiyeYonlendirildiMi(tip?: AkademiTipi): boolean {
  return !!tip?.startsWith("Kısa");
}

export function toplamPuan(d: MulakatDegerlendirmesi): number {
  return Object.values(d.kriterler).reduce<number>((t, p) => t + (p ?? 0), 0);
}

export function tumKriterlerIsaretliMi(d: MulakatDegerlendirmesi): boolean {
  return MULAKAT_KRITERLERI.every((k) => d.kriterler[k.anahtar] !== undefined);
}

/** Sonuç sistem tarafından hesaplanır; tüm kriterler işaretlenmeden sonuç oluşmaz. */
export function sonucHesapla(d: MulakatDegerlendirmesi): MulakatSonucu | null {
  if (d.katilmadi) return "Katılmadı";
  if (!tumKriterlerIsaretliMi(d)) return null;
  return toplamPuan(d) >= OLUMLU_ESIGI ? "Olumlu" : "Olumsuz";
}

/** Akademi mülakatını yapan kişi: mülakatı planlayan İK (rol eki olmadan). */
export function akademiMulakatiniYapan(a: AdayEgitmen): string {
  return a.mulakatPlanlayanKisi?.replace(/\s*\(.*\)$/, "") ?? "—";
}

/** Kaydetmeyi engelleyen eksikler; boş liste değerlendirmenin kaydedilebilir olduğunu gösterir. */
export function eksikler(d: MulakatDegerlendirmesi, aday: AdayEgitmen): string[] {
  const sonuc = sonucHesapla(d);
  if (!sonuc) return ["Tüm kriterler işaretlenmeli"];
  const liste: string[] = [];
  if (
    sonuc !== "Katılmadı" &&
    kisaAkademiyeYonlendirildiMi(aday.akademiMulakatTipi) &&
    d.kisaAkademiUygun === undefined
  ) {
    liste.push("Kısa akademi uygunluğu seçilmeli");
  }
  if (sonuc === "Olumsuz" && !d.aciklama?.trim()) liste.push("Olumsuz sonuçta açıklama zorunlu");
  return liste;
}

function bugununTarihi() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/**
 * Değerlendirmeyi adaya işler: sonucu, tarihi ve sonucu gireni kaydeder, süreç durumunu
 * ilerletir. Kısa akademiye uygun bulunmayan ama Olumlu sonuçlanan aday standart
 * akademiye yönlendirilir (PRD 5.7).
 */
export function degerlendirmeyiUygula(
  aday: AdayEgitmen,
  d: MulakatDegerlendirmesi,
  giren: string
): AdayEgitmen {
  const sonuc = sonucHesapla(d);
  if (!sonuc) return aday;
  const tarih = bugununTarihi();
  const katilmadi = sonuc === "Katılmadı";
  const kayit: MulakatDegerlendirmesi = {
    katilmadi,
    kriterler: katilmadi ? {} : d.kriterler,
    kisaAkademiUygun: d.kisaAkademiUygun,
    aciklama: d.aciklama?.trim() || undefined,
    altiAySonraBasvurabilir: !!d.altiAySonraBasvurabilir,
    kisiselNot: d.kisiselNot?.trim() || undefined,
    giren,
    tarih,
  };
  const standartaYonlendir =
    sonuc === "Olumlu" &&
    kisaAkademiyeYonlendirildiMi(aday.akademiMulakatTipi) &&
    d.kisaAkademiUygun === false;

  const aksiyonlar = [
    {
      tarih,
      aksiyon: katilmadi
        ? "Akademi mülakatına katılmadı olarak işaretlendi"
        : `Akademi mülakatı sonucu ${sonuc} (${toplamPuan(d)}/6) olarak girildi`,
      yapan: giren,
      detay: kayit.aciklama,
    },
  ];
  if (standartaYonlendir) {
    aksiyonlar.push({
      tarih,
      aksiyon: "Kısa akademiye uygun bulunmadı; standart akademiye yönlendirildi",
      yapan: giren,
      detay: undefined,
    });
  }

  return {
    ...aday,
    gorusmeSonucu: sonuc,
    gorusmeSonucuTarihi: tarih,
    olumsuzOlmaNedeni: sonuc === "Olumsuz" ? kayit.aciklama : undefined,
    mulakatDegerlendirmesi: kayit,
    akademiMulakatTipi: standartaYonlendir
      ? "Standart Akademi Mülakatı (4 Hafta)"
      : aday.akademiMulakatTipi,
    // Olumsuz ama "6 ay sonra tekrar başvurabilir" işaretli aday süreçten tamamen çıkmaz;
    // "Yeniden Değerlendirilebilir" durumunda bekler.
    surecDurumu:
      sonuc === "Olumsuz" && d.altiAySonraBasvurabilir
        ? "ileride_degerlendirilebilir"
        : mulakatSonucuSonrasiDurum(sonuc),
    aksiyonGecmisi: [...aday.aksiyonGecmisi, ...aksiyonlar],
  };
}

/** Telefon numaralarını karşılaştırmak için son 10 hane (başındaki 0 / +90 farkı önemsiz). */
export function telefonAnahtari(telefon: string): string {
  return telefon.replace(/\D/g, "").slice(-10);
}

/**
 * Olumsuz sonuçlanmış bir aday yeniden eklenmek istendiğinde gösterilecek uyarı (PRD 5.7).
 * Ekleme engellenmez; uyarı gerekmiyorsa null döner.
 */
export function tekrarBasvuruUyarisi(onceki: AdayEgitmen): string | null {
  if (onceki.gorusmeSonucu !== "Olumsuz") return null;
  if (!onceki.mulakatDegerlendirmesi?.altiAySonraBasvurabilir) {
    return "Bu aday için tekrar başvuru önerilmemiştir.";
  }
  const [g, a, y] = (onceki.gorusmeSonucuTarihi ?? "").split(".").map(Number);
  if (!g || !a || !y) return null;
  const altiAySonra = new Date(y, a - 1 + 6, g);
  return new Date() < altiAySonra
    ? "Bu adayın son 6 ay içinde olumsuz sonuçlanmış akademi mülakatı bulunmaktadır."
    : null;
}
