import { aktifSertifikalar, vizeKalanGun } from "./sertifika";
import type { AdayEgitmen, Bildirim, MulakatRolu } from "./types";

const GUN = 24 * 60 * 60 * 1000;

/** PRD 12.5: vize bitimine 30 gün kala, 7 gün kala ve bitiş günü bildirim gönderilir. */
export const VIZE_BILDIRIM_ESIKLERI = [30, 7, 0] as const;

function tarihYaz(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/**
 * Aktif eğitmenlerin sertifikaları için, bugüne kadar geçilmiş en son vize eşiğinin bildirimi
 * (sertifika başına tek bildirim). Eğitmeni görme yetkisi olan KM/KMY ve İK'ya gider.
 */
export function vizeBildirimleriUret(
  adaylar: AdayEgitmen[],
  alicilar: { rol: MulakatRolu; ad: string }[]
): Omit<Bildirim, "okundu">[] {
  const liste: { bildirim: Omit<Bildirim, "okundu">; sira: number }[] = [];
  for (const a of adaylar) {
    if (a.surecDurumu !== "egitmen") continue;
    for (const s of aktifSertifikalar(a)) {
      const kalan = vizeKalanGun(s);
      if (kalan === null || kalan > 30) continue;
      // Geçilmiş en son eşik: bitti (0) → 7 gün → 30 gün.
      const gercekEsik = kalan <= 0 ? 0 : kalan <= 7 ? 7 : 30;
      const bitis = s.vizeBitisTarihi!;
      const [g, ay, y] = bitis.split(".").map(Number);
      const tetik = new Date(new Date(y, ay - 1, g).getTime() - gercekEsik * GUN);
      const adSoyad = `${a.ad} ${a.soyad}`;
      const baslik =
        gercekEsik === 0
          ? `Vizesi sona erdi: ${adSoyad} (${s.brans})`
          : `Vize bitimine ${gercekEsik} gün kaldı: ${adSoyad} (${s.brans})`;
      const mesaj =
        gercekEsik === 0
          ? `${a.kulup} · ${s.brans} ${s.kademe}. Kademe vizesi ${bitis} tarihinde sona erdi; sertifika "Vizesi Geçmiş" durumuna düştü.`
          : `${a.kulup} · ${s.brans} ${s.kademe}. Kademe vizesi ${bitis} tarihinde bitiyor. Yeni vize bilgisi girilip İK tarafından onaylandığında uyarı kalkar.`;
      for (const alici of alicilar) {
        liste.push({
          sira: tetik.getTime(),
          bildirim: {
            id: `vize-${s.id}-${gercekEsik}-${alici.rol}`,
            aliciRol: alici.rol,
            aliciAd: alici.ad,
            baslik,
            mesaj,
            planlayan: "Themis (otomatik)",
            tarih: tarihYaz(tetik),
            adayId: a.id,
            link: `/adaylar/${a.id}?tab=kademe-federasyon`,
          },
        });
      }
    }
  }
  return liste.sort((x, y) => y.sira - x.sira).map((x) => x.bildirim);
}
