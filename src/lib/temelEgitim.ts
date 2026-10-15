import { bugun, tarihCoz, tarihYaz } from "./akademi";
import type { AdayEgitmen, SporEgitimi, TemelEgitimSonucu } from "./types";

/**
 * Temel eğitim seviyesi ve eğitimden gelen muafiyetler. Temel eğitim (Anadolu Üniversitesi) her
 * branş için ayrı takip edilir; kademe gibi ayrı bir seviyedir. Bir seviye sınavla
 * tamamlanır ya da spor eğitimi kurallarıyla muaf sayılır.
 *
 * Mezuniyet yalnızca temel eğitimden muaf tutar; federasyonun uygulamalı eğitimi ve sınavı her
 * durumda zorunludur.
 */

/** En yüksek kademe sayısı (5 kademeli branşlar); temel eğitim seviyeleri 1…5. */
export const TEMEL_EGITIM_SEVIYE_SAYISI = 5;

/** Mezuniyetten sonraki muafiyet süresi (yıl). */
const MEZUNIYET_MUAFIYET_YILI = 4;
/**
 * Geçilen temel eğitim, sınavdan sonra bu süre içinde federasyonun uygulamalı eğitimine
 * başvurulmazsa sayılmaz. O seviyenin kademe belgesi bu süre içinde alındıysa kullanılmıştır.
 */
export const TEMEL_EGITIM_GECERLILIK_YILI = 4;
/** Öğretim elemanı muafiyeti için en az uygulamalı ders yılı. */
const OGRETIM_ELEMANI_MIN_YIL = 3;

export const SPOR_BILIMLERI_BOLUMLERI = [
  "Beden Eğitimi ve Spor Öğretmenliği",
  "Spor Yöneticiliği",
  "Rekreasyon",
  "Egzersiz ve Spor Bilimleri",
];

/** Temel eğitim muafiyeti: bir seviye, tüm branşlarda ya da tek bir branşta. */
export type Muafiyet = {
  seviye: number;
  // null: tüm branşlarda geçerli.
  brans: string | null;
  // null: süresiz.
  bitis: Date | null;
  kural: string;
};

/**
 * Mezuniyetle doğrudan başvurulabilecek kademe. Kademe VERMEZ: yalnızca o kademeye kadarki temel
 * eğitimden muaf tutar ve alt kademelerden geçme şartını kaldırır. Federasyonun uygulamalı eğitimi
 * ve sınavı zorunludur; kademe, Bakanlık belgesi yüklenip İK onaylayınca güncellenir.
 */
export type KademeHakki = { brans: string; kademe: number; kural: string };

/**
 * Eğitmenin spor eğitimi: öğrenim bilgisinin ayrıntısı varsa o; yoksa Öğrenim Durumu ve Mezuniyet
 * Tarihi alanlarından türetilir (spor bilimleri mezunu → genel spor bilimleri kuralları).
 */
export function sporEgitimi(a: AdayEgitmen): SporEgitimi | undefined {
  if (a.sporEgitimi) return a.sporEgitimi;
  const e = a.egitimBilgisi ?? "";
  if (!e.includes("Spor Bilimleri") || !e.includes("(Mezun)")) return undefined;
  const [y, ay, g] = (a.mezuniyetTarihi ?? "").split("-");
  return {
    tur: "spor_bilimleri",
    mezuniyetTarihi: y && ay && g ? `${g}.${ay}.${y}` : undefined,
  };
}

function yilEkle(tarih: string | undefined, yil: number): Date | null {
  const d = tarih ? tarihCoz(tarih) : null;
  return d ? new Date(d.getFullYear() + yil, d.getMonth(), d.getDate()) : null;
}

const araliktan = (bas: number, son: number) =>
  Array.from({ length: son - bas + 1 }, (_, i) => bas + i);

/**
 * Spor eğitimi beyanından doğan tüm muafiyet ve kademe hakları. Süresi dolmuş muafiyetler de
 * döner (profilde "süresi doldu" olarak gösterilir); geçerlilik kontrolü `gecerliMi` ile yapılır.
 */
export function egitimHaklari(e: SporEgitimi | undefined): {
  muafiyetler: Muafiyet[];
  kademeHaklari: KademeHakki[];
} {
  const muafiyetler: Muafiyet[] = [];
  const kademeHaklari: KademeHakki[] = [];
  if (!e) return { muafiyetler, kademeHaklari };
  const dortYil = yilEkle(e.mezuniyetTarihi, MEZUNIYET_MUAFIYET_YILI);
  const dortYilMetni = dortYil ? ` (${tarihYaz(dortYil)} tarihine kadar)` : "";

  if (e.tur === "antrenorluk") {
    // Uzmanlık branşında temel eğitimden muaf; muafiyet aşağıda kademe hakkından türetilir.
    if (e.uzmanlikBransi) {
      kademeHaklari.push({
        brans: e.uzmanlikBransi,
        kademe: 3,
        kural: "Antrenörlük mezunu · uzmanlık branşı",
      });
    }
    // Uzmanlık dışında en az 1 dönem ders alınan tek bir branş ("tercih edeceği yalnızca bir
    // spor dalında"); spor lisesi ve öğretim elemanı muafiyeti de tek branşta geçerlidir.
    const ek = e.dersAlinanBranslar?.find(
      (d) => d.donem >= 1 && d.brans !== e.uzmanlikBransi,
    );
    if (ek) {
      kademeHaklari.push({
        brans: ek.brans,
        kademe: 1,
        kural: `Antrenörlük mezunu · uzmanlık dışı ${ek.donem} dönem ders`,
      });
    }
    for (const s of [2, 3]) {
      muafiyetler.push({
        seviye: s,
        brans: null,
        bitis: dortYil,
        kural: `Antrenörlük mezunu · mezuniyetten sonraki 4 yıl${dortYilMetni}`,
      });
    }
  }

  if (e.tur === "spor_bilimleri") {
    for (const d of e.dersAlinanBranslar ?? []) {
      if (d.donem >= 2) {
        kademeHaklari.push({
          brans: d.brans,
          kademe: 2,
          kural: `Spor bilimleri mezunu · ${d.donem} dönem ders`,
        });
      } else if (d.donem >= 1) {
        kademeHaklari.push({
          brans: d.brans,
          kademe: 1,
          kural: "Spor bilimleri mezunu · 1 dönem ders",
        });
      }
    }
    muafiyetler.push({
      seviye: 2,
      brans: null,
      bitis: dortYil,
      kural: `Spor bilimleri mezunu · mezuniyetten sonraki 4 yıl${dortYilMetni}`,
    });
  }

  // Tüm spor bilimleri mezunları 1. kademe temel eğitiminden süresiz muaftır.
  if (e.tur === "antrenorluk" || e.tur === "spor_bilimleri") {
    muafiyetler.push({
      seviye: 1,
      brans: null,
      bitis: null,
      kural: "Spor bilimleri mezunu · süresiz",
    });
  }

  if (e.tur === "spor_lisesi" && e.liseBransi) {
    kademeHaklari.push({
      brans: e.liseBransi,
      kademe: 1,
      kural: "Spor lisesi mezunu · okulda eğitim görülen branş",
    });
  }

  if (e.ogretimElemani && e.ogretimElemani.yil >= OGRETIM_ELEMANI_MIN_YIL) {
    muafiyetler.push({
      seviye: 3,
      brans: e.ogretimElemani.brans,
      bitis: null,
      kural: `Spor bilimleri öğretim elemanı · ${e.ogretimElemani.yil} yıl uygulamalı ders`,
    });
  }

  // Kademe hakkı, o kademeye kadarki temel eğitimlerden süresiz muaf tutar (mezuniyet temel
  // eğitimden muaf tutar; uygulamalı eğitim ve sınav ayrıca gerekir). Süreli muafiyet varsa da
  // eklenir ki süre dolunca hak branşındaki muafiyet düşmesin.
  for (const h of kademeHaklari) {
    for (const s of araliktan(1, h.kademe)) {
      const suresizVar = muafiyetler.some(
        (m) =>
          m.seviye === s &&
          m.bitis === null &&
          (m.brans === null || m.brans === h.brans),
      );
      if (!suresizVar) {
        muafiyetler.push({
          seviye: s,
          brans: h.brans,
          bitis: null,
          kural: h.kural,
        });
      }
    }
  }

  return { muafiyetler, kademeHaklari };
}

export const gecerliMi = (m: Muafiyet) =>
  !m.bitis || m.bitis.getTime() >= bugun().getTime();

/** Bir branşta eğitimden gelen en yüksek kademe hakkı. */
export function kademeHakki(
  a: AdayEgitmen,
  brans: string,
): KademeHakki | undefined {
  return egitimHaklari(sporEgitimi(a))
    .kademeHaklari.filter((h) => h.brans === brans)
    .sort((x, y) => y.kademe - x.kademe)[0];
}

export type TemelSeviyeDurumu =
  // gecerlilikBitisi: sınavdan 4 yıl sonrası; kullanildi: bu sürede o seviyenin belgesi alındı.
  | {
      durum: "sinav";
      sonuc: TemelEgitimSonucu;
      gecerlilikBitisi: Date | null;
      kullanildi: boolean;
    }
  | {
      durum: "suresi_doldu";
      sonuc: TemelEgitimSonucu;
      gecerlilikBitisi: Date | null;
    }
  | { durum: "muaf"; muafiyet: Muafiyet }
  | { durum: "onayda"; sonuc: TemelEgitimSonucu }
  | { durum: "basarisiz"; sonuc: TemelEgitimSonucu }
  | { durum: "yok" };

/** Sınavın girildiği branş; eski kayıtlarda branş yoksa Fitness. */
export const sinavBransi = (t: TemelEgitimSonucu) => t.brans ?? "Fitness";

export const temelGecerlilikBitisi = (t: TemelEgitimSonucu) =>
  yilEkle(t.sinavTarihi, TEMEL_EGITIM_GECERLILIK_YILI);

/**
 * Geçilen sınav 4 yıllık süre içinde o seviyenin kademe belgesiyle kullanıldı mı. `brans`
 * verilirse yalnızca o branştaki belge sayılır.
 */
function sinavKullanildiMi(
  a: AdayEgitmen,
  t: TemelEgitimSonucu,
  brans?: string,
): boolean {
  const bas = tarihCoz(t.sinavTarihi)?.getTime() ?? 0;
  const bitis = temelGecerlilikBitisi(t)?.getTime() ?? 0;
  return (a.sertifikalar ?? []).some((s) => {
    const belge = tarihCoz(s.belgeTarihi)?.getTime() ?? 0;
    return (
      s.onaylandi &&
      s.kademe === t.hedefKademe &&
      (!brans || s.brans === brans) &&
      belge >= bas &&
      belge <= bitis
    );
  });
}

/**
 * Bir temel eğitim seviyesinin durumu. `brans` verilirse o branşa özel muafiyetler de sayılır ve
 * süresi dolan sınav yalnızca o branşta kullanıldıysa geçerlidir (yeni başvuru için sayılmaz);
 * verilmezse genel seviye: süresi dolan sınav herhangi bir branşta kullanıldıysa tamamlanmıştır.
 */
export function temelSeviyeDurumu(
  a: AdayEgitmen,
  seviye: number,
  brans?: string,
): TemelSeviyeDurumu {
  // Branş verildiyse yalnızca o branşın sınavları sayılır (her branşın temel eğitimi ayrıdır);
  // verilmezse (genel seviye) tüm branşlar.
  const sonuclar = (a.temelEgitimSonuclari ?? []).filter(
    (t) =>
      t.hedefKademe === seviye && !t.redSebebi && (!brans || sinavBransi(t) === brans),
  );
  // Branş verildiyse önce o branş için alınmış sınavlar, sonra yeniden eskiye.
  const kendi = (t: TemelEgitimSonucu) =>
    !brans || sinavBransi(t) === brans ? 0 : 1;
  const gecenler = sonuclar
    .filter((t) => t.onaylandi && t.sonuc === "Geçti")
    .sort(
      (x, y) =>
        kendi(x) - kendi(y) ||
        (tarihCoz(y.sinavTarihi)?.getTime() ?? 0) -
          (tarihCoz(x.sinavTarihi)?.getTime() ?? 0),
    );
  const gecen = gecenler[0];
  const gecerlilikBitisi = gecen ? temelGecerlilikBitisi(gecen) : null;
  if (
    gecen &&
    gecerlilikBitisi &&
    gecerlilikBitisi.getTime() >= bugun().getTime()
  ) {
    return {
      durum: "sinav",
      sonuc: gecen,
      gecerlilikBitisi,
      kullanildi: sinavKullanildiMi(a, gecen, brans),
    };
  }
  const kullanilan = gecenler.find((t) => sinavKullanildiMi(a, t, brans));
  if (kullanilan) {
    return {
      durum: "sinav",
      sonuc: kullanilan,
      gecerlilikBitisi: temelGecerlilikBitisi(kullanilan),
      kullanildi: true,
    };
  }
  const muafiyet = egitimHaklari(sporEgitimi(a)).muafiyetler.find(
    (m) =>
      m.seviye === seviye &&
      gecerliMi(m) &&
      (m.brans === null || m.brans === brans),
  );
  if (muafiyet) return { durum: "muaf", muafiyet };
  if (gecen) return { durum: "suresi_doldu", sonuc: gecen, gecerlilikBitisi };
  const son = sonuclar.at(-1);
  if (son && !son.onaylandi) return { durum: "onayda", sonuc: son };
  if (son) return { durum: "basarisiz", sonuc: son };
  return { durum: "yok" };
}

export const temelTamamMi = (d: TemelSeviyeDurumu) =>
  d.durum === "sinav" || d.durum === "muaf";

/**
 * Temel eğitim seviyesi: 1. seviyeden başlayarak kesintisiz tamamlanan (sınav ya da muafiyet)
 * en yüksek seviye. `brans` verilirse o branşa özel muafiyetler de dahil edilir.
 */
export function temelEgitimSeviyesi(a: AdayEgitmen, brans?: string): number {
  let seviye = 0;
  while (
    seviye < TEMEL_EGITIM_SEVIYE_SAYISI &&
    temelTamamMi(temelSeviyeDurumu(a, seviye + 1, brans))
  ) {
    seviye++;
  }
  return seviye;
}

/** Muafiyetin kısa geçerlilik metni: "süresiz" / "12.06.2028'e kadar" / "süresi doldu". */
export function muafiyetSuresi(m: Muafiyet): string {
  if (!m.bitis) return "süresiz";
  return gecerliMi(m)
    ? `${tarihYaz(m.bitis)} tarihine kadar`
    : `süresi ${tarihYaz(m.bitis)} doldu`;
}
