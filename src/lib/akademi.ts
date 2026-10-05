import type { Tone } from "./status";
import type { AdayEgitmen, AkademiDonemi, AkademiTipi } from "./types";

/** "DD.MM.YYYY" metnini Date'e çevirir. */
export function tarihCoz(tarih: string): Date | null {
  const [g, a, y] = tarih.split(".").map(Number);
  if (!g || !a || !y) return null;
  return new Date(y, a - 1, g);
}

export function tarihYaz(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** Tarih girişinin "YYYY-MM-DD" değerini "DD.MM.YYYY"ye çevirir. */
export function inputTarihindenCevir(deger: string): string {
  const [y, a, g] = deger.split("-");
  return y && a && g ? `${g}.${a}.${y}` : deger;
}

export function inputTarihine(tarih: string): string {
  const [g, a, y] = tarih.split(".");
  return g && a && y ? `${y}-${a}-${g}` : "";
}

export function bugun(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function kisaAkademiMi(tip: AkademiTipi): boolean {
  return tip.startsWith("Kısa");
}

/**
 * Bitiş tarihi başlangıç ve tipe göre otomatik hesaplanır (PRD 7.1): Standart 4 hafta,
 * Kısa Dönem 1 hafta. Akademi hafta içi yürüdüğü için son haftanın cuması bitiş günüdür.
 */
export function bitisTarihiHesapla(baslangicTarihi: string, tip: AkademiTipi): string {
  const d = tarihCoz(baslangicTarihi);
  if (!d) return "";
  const hafta = kisaAkademiMi(tip) ? 1 : 4;
  d.setDate(d.getDate() + hafta * 7 - 3);
  return tarihYaz(d);
}

export const kayitliSayisi = (d: AkademiDonemi) => d.kayitlilar.length;
export const yoklamaAlindiMi = (d: AkademiDonemi) => !!d.yoklama;
export const katilanSayisi = (d: AkademiDonemi) =>
  Object.values(d.yoklama ?? {}).filter((y) => y === "Geldi").length;
export const gelmeyenSayisi = (d: AkademiDonemi) =>
  Object.values(d.yoklama ?? {}).filter((y) => y === "Gelmedi").length;
export const kontenjanDoluMu = (d: AkademiDonemi) => kayitliSayisi(d) >= d.kontenjan;

/** Akademinin ilk günü geldiyse yoklama alınabilir (PRD 8). */
export function yoklamaAlinabilirMi(d: AkademiDonemi): boolean {
  const baslangic = tarihCoz(d.baslangicTarihi);
  return (
    !d.iptal &&
    !yoklamaAlindiMi(d) &&
    d.kayitlilar.length > 0 &&
    !!baslangic &&
    bugun() >= baslangic
  );
}

/** Doluluk: yoklamadan önce "Kayıtlı / Kontenjan", yoklamadan sonra "Katılan / Kayıtlı" (PRD 8.1). */
export function doluluk(d: AkademiDonemi): { etiket: string; pay: number; payda: number } {
  return yoklamaAlindiMi(d)
    ? { etiket: "Katılan / Kayıtlı", pay: katilanSayisi(d), payda: kayitliSayisi(d) }
    : { etiket: "Kayıtlı / Kontenjan", pay: kayitliSayisi(d), payda: d.kontenjan };
}

/** Akademiye henüz aday kaydedilmemişse düzenlenebilir veya iptal edilebilir (PRD 7.1). */
export const duzenlenebilirMi = (d: AkademiDonemi) => !d.iptal && d.kayitlilar.length === 0;

export function akademiDurumu(d: AkademiDonemi): { label: string; tone: Tone } {
  if (d.iptal) return { label: "İptal Edildi", tone: "gray" };
  const baslangic = tarihCoz(d.baslangicTarihi);
  const bitis = tarihCoz(d.bitisTarihi);
  const b = bugun();
  if (bitis && b > bitis) return { label: "Tamamlandı", tone: "purple" };
  if (baslangic && b >= baslangic) return { label: "Devam Ediyor", tone: "blue" };
  if (kontenjanDoluMu(d)) return { label: "Kontenjan Dolu", tone: "orange" };
  return { label: "Kayıt Açık", tone: "green" };
}

/** Akademi adı tip ve dönem numarasından oluşur, örn. "Standart / Dönem 18". */
export function akademiAdiOlustur(tip: AkademiTipi, donemNo: number): string {
  return `${tip.startsWith("Standart") ? "Standart" : "Kısa Dönem"} / Dönem ${donemNo}`;
}

/** Dönem numaraları akademi tipine göre ayrı ilerler; bu tipteki en büyük numaranın bir fazlası. */
export function sonrakiDonemNo(donemler: AkademiDonemi[], tip: AkademiTipi): number {
  const numaralar = donemler
    .filter((d) => d.tip === tip)
    .map((d) => Number(d.ad.match(/Dönem (\d+)$/)?.[1] ?? 0));
  return Math.max(0, ...numaralar) + 1;
}

/**
 * İK onayıyla (veya İK'nın doğrudan kaydıyla) davet tamamlandığında aksiyon geçmişine
 * yazılan kayıt — PRD 6'daki sistemsel sonuçları özetler.
 */
export function akademiDavetiOnayKaydi(akademiAdi: string | undefined) {
  return `Akademi daveti onaylandı; aday ${akademiAdi ?? "seçilen akademi"} listesine yazıldı ve kontenjan 1 azaldı. Mevcut üyelik sonlandırıldı, Flyby'da "Akademi Eğitmeni" sözleşmesi tanımlandı.`;
}

/**
 * Akademi Eğitmeni'nin akademi içindeki aşaması (Tüm Eğitmenler → Akademi sekmesi):
 * Akademide → Sınav Sonucu Bekleniyor → Eğitmenliğe Geçişe Hazır. Akademisi henüz
 * başlamamış ya da sınavdan kalmış olanlar ayrıca belirtilir.
 */
export function akademiAsamasi(
  a: AdayEgitmen,
  donem: AkademiDonemi | undefined,
  sinavSonucu: "Geçti" | "Kaldı" | undefined
): { label: string; tone: Tone } {
  if (a.surecDurumu === "akademiyi_tamamladi") {
    return { label: "Eğitmenliğe Geçişe Hazır", tone: "green" };
  }
  if (sinavSonucu === "Kaldı") return { label: "Sınavdan Kaldı", tone: "red" };
  const baslangic = donem && tarihCoz(donem.baslangicTarihi);
  const bitis = donem && tarihCoz(donem.bitisTarihi);
  if (bitis && bugun() > bitis) return { label: "Sınav Sonucu Bekleniyor", tone: "amber" };
  if (baslangic && bugun() < baslangic) {
    return { label: "Akademi Başlangıcı Bekleniyor", tone: "gray" };
  }
  return { label: "Akademide", tone: "blue" };
}
