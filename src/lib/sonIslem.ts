import type { AdayEgitmen } from "./types";

/** "DD.MM.YYYY" (ya da "Bugün") tarihini zaman damgasına çevirir. */
function zaman(tarih: string): number {
  if (tarih === "Bugün") {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  const [g, a, y] = tarih.split(".").map(Number);
  return g && a && y ? new Date(y, a - 1, g).getTime() : 0;
}

/**
 * Listelerde varsayılan sıralama anahtarı: kişi üzerinde yapılan en son işlemin zamanı. Bu
 * oturumda işlem yapılan kayıt (sonIslemZamani, şu anki saat) geçmiş tarihli kayıtların
 * hepsinden yeni olduğu için en üste çıkar.
 */
export function sonIslemSirasi(a: AdayEgitmen): number {
  if (a.sonIslemZamani) return a.sonIslemZamani;
  return Math.max(zaman(a.basvuruTarihi), ...a.aksiyonGecmisi.map((k) => zaman(k.tarih)));
}
