import type { Tone } from "./status";
import type {
  AdayEgitmen,
  EgitmenKarneAlanlari,
  EgitmenLig,
  KarneHaricKaydi,
  KarneSabitlemeKaydi,
  MetrikLimitleri,
} from "./types";

export type MetrikLimitAlani = keyof Omit<MetrikLimitleri, "id" | "donem" | "girisTarihi" | "giren">;

/**
 * GX, Pilates ve Havuz eğitmenleri karneye dahil edilmez — Flyby'daki tanımlı
 * sözleşmesinden (sozlesmeTipi) otomatik algılanır.
 */
const KARNE_DISI_SOZLESME_TIPLERI = ["GX", "Pilates", "Havuz"];

export function karneOtomatikHaricMi(aday: Pick<AdayEgitmen, "sozlesmeTipi">): boolean {
  return !!aday.sozlesmeTipi && KARNE_DISI_SOZLESME_TIPLERI.includes(aday.sozlesmeTipi);
}

/** Bir eğitmenin, varsa şu an aktif olan (hâlâ hariç tutan) İzinli hariç kaydı. */
export function aktifHaricKaydi(
  egitmenId: string,
  kayitlar: KarneHaricKaydi[]
): KarneHaricKaydi | undefined {
  return kayitlar.find((k) => k.egitmenId === egitmenId && k.aktif);
}

export function karneyeDahilMi(
  aday: Pick<AdayEgitmen, "id" | "sozlesmeTipi">,
  haricKayitlari: KarneHaricKaydi[]
): boolean {
  return !karneOtomatikHaricMi(aday) && !aktifHaricKaydi(aday.id, haricKayitlari);
}

export function karneHaricSebebi(
  aday: Pick<AdayEgitmen, "id" | "sozlesmeTipi">,
  haricKayitlari: KarneHaricKaydi[]
): string | null {
  if (karneOtomatikHaricMi(aday)) return `${aday.sozlesmeTipi} Sözleşmesi (otomatik)`;
  return aktifHaricKaydi(aday.id, haricKayitlari)?.sebep ?? null;
}

/** Sağlık durumu, doğum izni, askerlik, tadilattaki kulüp vb. — "Geri Dahil Et" akışında kullanılır. */
export const IZIN_SEBEPLERI = [
  "Sağlık Durumu",
  "Doğum İzni",
  "Askerlik",
  "Tadilattaki Kulüp",
  "Diğer",
];

/**
 * Ligi Sabitle akışındaki sebep seçenekleri. Fraud artık ayrı, kalıcı bir liste
 * değil — burada sadece bir sebep seçeneğidir; seçildiğinde önerilen lig Silver'dır.
 * "X Dönüşü" seçenekleri, İzinli hariç listesinden (bkz. IZIN_SEBEPLERI) dönen ama
 * ligi otomatik değil elle sabitlenmek istenen eğitmenler içindir. Hepsinde önerilen
 * lig sadece bir varsayımdır, değiştirilebilir.
 */
export const SABITLEME_SEBEPLERI = [
  "Fraud",
  "Sağlık Durumu Dönüşü",
  "Doğum İzni Dönüşü",
  "Askerlik Dönüşü",
  "Tadilattaki Kulüp Dönüşü",
  "Diğer",
] as const;
export type SabitlemeSebebi = (typeof SABITLEME_SEBEPLERI)[number];

/** Slide 5'teki 9 histogramla birebir eşleşen ham metrik listesi — threshold girişinde kullanılır. */
export const METRIK_LIMIT_ALANLARI: { alan: MetrikLimitAlani; label: string }[] = [
  { alan: "fitStartTekil", label: "Fit Start Tekil" },
  { alan: "grupDersiTekil", label: "Grup Dersi Tekil" },
  { alan: "ptTekil", label: "PT Tekil" },
  { alan: "fitStartTotal", label: "Fit Start Total" },
  { alan: "grupDersiTotal", label: "Grup Dersi Total" },
  { alan: "ptTotal", label: "PT Total" },
  { alan: "alanHizmeti", label: "Alan Hizmeti" },
  { alan: "npsPozitifCevap", label: "NPS Pozitif Cevap" },
  { alan: "calismaSuresi", label: "Çalışma Süresi" },
];

/**
 * Final puanın 8 alana göre ağırlıkları. Bu ağırlıklar sadece bilgilendirme/gösterim
 * amaçlıdır — final puanı Themis hesaplamaz, data ekibinin script'i hesaplayıp
 * Excel üzerinden yükler.
 */
export const KARNE_AGIRLIKLARI: { alan: keyof EgitmenKarneAlanlari; label: string; agirlik: number }[] = [
  { alan: "olcumProgram", label: "Ölçüm ve Program üye sayısı", agirlik: 0.2 },
  { alan: "grupDersi", label: "Grup dersi katılımcı sayısı", agirlik: 0.2 },
  { alan: "ptDersi", label: "PT dersi katılımcı sayısı", agirlik: 0.1 },
  { alan: "alanHizmeti", label: "Alan hizmeti puanı", agirlik: 0.2 },
  { alan: "npsPozitifCevap", label: "NPS pozitif cevap sayısı", agirlik: 0.1 },
  { alan: "calismaSuresi", label: "Çalışma süresi", agirlik: 0.1 },
  { alan: "kulupMemnuniyeti", label: "Kulüp memnuniyeti", agirlik: 0.05 },
  { alan: "kulupSadakati", label: "Kulüp sadakati", agirlik: 0.05 },
];

export const KARNE_ALAN_ETIKETLERI: Record<keyof EgitmenKarneAlanlari, string> = {
  olcumProgram: "Ölçüm/Program",
  grupDersi: "Grup Dersi",
  ptDersi: "PT Dersi",
  alanHizmeti: "Alan Hizmeti",
  npsPozitifCevap: "NPS Poz. Cevap",
  calismaSuresi: "Çalışma Süresi",
  kulupMemnuniyeti: "Kulüp Memnuniyeti",
  kulupSadakati: "Kulüp Sadakati",
};

/**
 * "Excel'den Yükle" mock'u için örnek karne alanları üretir. Bu prototipte gerçek bir
 * Excel/xlsx ayrıştırması yapılmaz — data ekibinin göndereceği dosyanın içeriğini
 * simüle eder. Alanlar birbirinden bağımsız rastgele üretilirse ağırlıklı ortalama
 * (final puan) her zaman ortalamaya doğru sıkışıyor (herkes Gold/Platinum'a
 * yığılıyor) — bunun yerine önce geniş bir "seviye" seçilip alanlar o seviyenin
 * etrafında küçük bir sapmayla üretilir, böylece final puan Silver'dan Diamond'a
 * gerçekçi şekilde yayılır.
 */
export function ornekKarneAlanlariUret(): EgitmenKarneAlanlari {
  const seviye = 10 + Math.random() * 90;
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const puan = () => clamp(seviye + (Math.random() * 20 - 10));
  return {
    olcumProgram: puan(),
    grupDersi: puan(),
    ptDersi: puan(),
    alanHizmeti: puan(),
    npsPozitifCevap: puan(),
    calismaSuresi: puan(),
    kulupMemnuniyeti: puan(),
    kulupSadakati: puan(),
  };
}

export function ornekFinalPuanHesapla(alanlar: EgitmenKarneAlanlari): number {
  const toplam = KARNE_AGIRLIKLARI.reduce((acc, k) => acc + alanlar[k.alan] * k.agirlik, 0);
  return Math.round(toplam);
}

export const LIG_SIRASI: EgitmenLig[] = ["Silver", "Gold", "Platinum", "Diamond"];

export const LIG_TONU: Record<EgitmenLig, Tone> = {
  Silver: "gray",
  Gold: "amber",
  Platinum: "green",
  Diamond: "blue",
};

/**
 * Dönem sonu lig sınırları. Lig, data ekibinden Excel ile gelmez — final puan
 * yüklendiği anda Themis tarafından bu sınırlara göre otomatik belirlenir/güncellenir;
 * manuel bir "lig güncelle" butonuna ihtiyaç yoktur.
 */
export function ligBelirle(finalPuan: number): EgitmenLig {
  if (finalPuan >= 85) return "Diamond";
  if (finalPuan >= 70) return "Platinum";
  if (finalPuan >= 55) return "Gold";
  return "Silver";
}

export function puanTonu(puan: number): Tone {
  if (puan >= 80) return "green";
  if (puan >= 60) return "amber";
  return "red";
}

/** Bir eğitmenin en son girdiği, dönüşte ligini sabitleyen İzinli hariç kaydı (varsa). */
function sonSabitleyenHaricKaydi(
  egitmenId: string,
  kayitlar: KarneHaricKaydi[]
): KarneHaricKaydi | undefined {
  const kendisi = kayitlar.filter((k) => k.egitmenId === egitmenId && k.oncekiLig);
  return kendisi[kendisi.length - 1];
}

/** Bir eğitmenin, varsa şu an aktif olan manuel "Karnede Sabitlenenler" kaydı. Karneden
 * çıkarmadan bağımsızdır — eğitmen karnede görünmeye devam eder, sadece ligi sabitlenir. */
export function aktifSabitlemeKaydi(
  egitmenId: string,
  kayitlar: KarneSabitlemeKaydi[]
): KarneSabitlemeKaydi | undefined {
  return kayitlar.find((k) => k.egitmenId === egitmenId && k.aktif);
}

/**
 * Bir eğitmenin gösterilecek ligi:
 * - "Karnede Sabitlenenler" listesinde aktif bir kaydı varsa (sebebi Fraud ya da
 *   Diğer olabilir) oradaki ligine,
 * - İzinli/geçici hariç listesinden geri dahil edildiyse ayrıldığı andaki ligine
 *   (kayıttaki oncekiLig) sabitlenir,
 * - aksi halde final puana göre otomatik belirlenir (ligBelirle).
 */
export function efektifLig(
  egitmenId: string,
  finalPuan: number,
  haricKayitlari: KarneHaricKaydi[],
  sabitlemeKayitlari: KarneSabitlemeKaydi[] = []
): EgitmenLig {
  const sabitleme = aktifSabitlemeKaydi(egitmenId, sabitlemeKayitlari);
  if (sabitleme) return sabitleme.lig;
  const sabitleyen = sonSabitleyenHaricKaydi(egitmenId, haricKayitlari);
  if (sabitleyen?.oncekiLig) return sabitleyen.oncekiLig;
  return ligBelirle(finalPuan);
}

/** Ligi gerçek final puanından bağımsız olarak sabitlenmiş mi (manuel sabitleme ya da izin dönüşü). */
export function ligSabitliMi(
  egitmenId: string,
  haricKayitlari: KarneHaricKaydi[],
  sabitlemeKayitlari: KarneSabitlemeKaydi[] = []
): boolean {
  if (aktifSabitlemeKaydi(egitmenId, sabitlemeKayitlari)) return true;
  return !!sonSabitleyenHaricKaydi(egitmenId, haricKayitlari);
}

/**
 * Yılda sadece 2 dönem: 1. Dönem (Ocak-Haziran) ve 2. Dönem (Temmuz-Aralık).
 * Format: "YYYY-1" / "YYYY-2".
 */

/**
 * Takvimden hesaplanan dönem — sadece KarnelerContext'in aktifDonem state'ini
 * başlangıçta set etmek için kullanılır. Uygulama genelinde "hangi dönem
 * düzenlenebilir" artık takvimden değil, İK'nın "Dönemi Sonlandır" aksiyonuyla
 * ilerlettiği KarnelerContext#aktifDonem'den gelir (bkz. sonrakiDonem, guncelDonemMi).
 */
export function guncelDonem(): string {
  const simdi = new Date();
  const yariYil = simdi.getMonth() < 6 ? 1 : 2;
  return `${simdi.getFullYear()}-${yariYil}`;
}

export function donemEtiketi(donem: string): string {
  const [yil, yari] = donem.split("-");
  return `${yil} — ${yari}. Dönem`;
}

/** Bir dönemden bir sonraki dönem — "Dönemi Sonlandır" aksiyonunda kullanılır. */
export function sonrakiDonem(donem: string): string {
  const [yilStr, yariStr] = donem.split("-");
  const yil = Number(yilStr);
  const yari = Number(yariStr);
  return yari === 1 ? `${yil}-2` : `${yil + 1}-1`;
}

/**
 * Bir dönemden bir önceki dönem — metrik limitleri gibi alanlarda, henüz o dönem
 * için veri girilmediyse bir önceki dönemin değerlerini varsayılan göstermek için
 * kullanılır.
 */
export function oncekiDonem(donem: string): string {
  const [yilStr, yariStr] = donem.split("-");
  const yil = Number(yilStr);
  const yari = Number(yariStr);
  return yari === 1 ? `${yil - 1}-2` : `${yil}-1`;
}

/** Verilen dönem, uygulamanın şu an aktif kabul ettiği dönem mi (yani düzenlenebilir mi)? */
export function guncelDonemMi(donem: string, aktifDonem: string): boolean {
  return donem === aktifDonem;
}

/** Bir dönemin başlangıç ayı: "-1" dönemi Ocak'ta (1), "-2" dönemi Temmuz'da (7) başlar. */
export function donemBaslangicAyi(donem: string): number {
  return donem.endsWith("-1") ? 1 : 7;
}

/**
 * Şu an takvimde, verilen dönemin başlangıç ayında mıyız? GX stüdyo sayıları gibi
 * "sadece dönemin ilk ayında güncellenebilir" kısıtları için kullanılır.
 */
export function donemIlkAyindaMiyiz(donem: string): boolean {
  return new Date().getMonth() + 1 === donemBaslangicAyi(donem);
}

/** Bir dönem seçici için, verilen aktif dönemden geriye doğru `adet` dönemi üretir. */
export function donemSecenekleriUret(aktifDonem: string, adet = 6): string[] {
  const secenekler: string[] = [];
  let yil = Number(aktifDonem.split("-")[0]);
  let yari = Number(aktifDonem.split("-")[1]);
  for (let i = 0; i < adet; i++) {
    secenekler.push(`${yil}-${yari}`);
    if (yari === 1) {
      yari = 2;
      yil -= 1;
    } else {
      yari = 1;
    }
  }
  return secenekler;
}
