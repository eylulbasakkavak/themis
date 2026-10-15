import { seminerVizeleriniGuncelle } from "./sertifika";
import type { AdayEgitmen } from "./types";

/**
 * Sertifika, vize ve temel eğitim kayıtlarının İK onayı / reddi (PRD 12.2–12.4). Onay
 * Talepleri sayfası ve profil aynı fonksiyonları kullanır.
 */

/**
 * Kademe belgesi onaylanınca eğitmenin o branştaki kademesi bu belgeye göre güncellenir. Vize
 * gelişim seminerlerinden (ya da yeni belge tarihinden) yeniden hesaplanır.
 */
export function sertifikaOnayla(
  a: AdayEgitmen,
  sertifikaId: string,
): AdayEgitmen {
  return seminerVizeleriniGuncelle({
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id !== sertifikaId
        ? s
        : { ...s, onaylandi: true, redSebebi: undefined },
    ),
  });
}

export function sertifikaReddet(
  a: AdayEgitmen,
  sertifikaId: string,
  sebep: string,
): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id === sertifikaId ? { ...s, onaylandi: false, redSebebi: sebep } : s,
    ),
  };
}

/** Vize onaylanınca sertifikanın geçerli vize dönemi ve bitiş tarihi bu kayıttan alınır. */
export function vizeOnayla(
  a: AdayEgitmen,
  sertifikaId: string,
  vizeId: string,
): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) => {
      if (s.id !== sertifikaId) return s;
      const vize = s.vizeler?.find((v) => v.id === vizeId);
      if (!vize) return s;
      return {
        ...s,
        vizeDonemi: vize.donem,
        vizeBitisTarihi: vize.bitisTarihi,
        vizeler: s.vizeler!.map((v) =>
          v.id === vizeId ? { ...v, onaylandi: true, redSebebi: undefined } : v,
        ),
      };
    }),
  };
}

export function vizeReddet(
  a: AdayEgitmen,
  sertifikaId: string,
  vizeId: string,
  sebep: string,
): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id === sertifikaId
        ? {
            ...s,
            vizeler: (s.vizeler ?? []).map((v) =>
              v.id === vizeId
                ? { ...v, onaylandi: false, redSebebi: sebep }
                : v,
            ),
          }
        : s,
    ),
  };
}

export function temelEgitimOnayla(a: AdayEgitmen, id: string): AdayEgitmen {
  return {
    ...a,
    temelEgitimSonuclari: (a.temelEgitimSonuclari ?? []).map((t) =>
      t.id === id ? { ...t, onaylandi: true, redSebebi: undefined } : t,
    ),
  };
}

export function temelEgitimReddet(
  a: AdayEgitmen,
  id: string,
  sebep: string,
): AdayEgitmen {
  return {
    ...a,
    temelEgitimSonuclari: (a.temelEgitimSonuclari ?? []).map((t) =>
      t.id === id ? { ...t, onaylandi: false, redSebebi: sebep } : t,
    ),
  };
}

/** İhtar kaydının kimliği; eski kayıtlarda id yoksa listedeki sırası kullanılır. */
export const ihtarKimligi = (id: string | undefined, sira: number) =>
  id ?? String(sira);

/** PRD 11.4: KM/KMY'nin girdiği ihtar İK onayıyla kesinleşir. */
export function ihtarOnayla(a: AdayEgitmen, kimlik: string): AdayEgitmen {
  return {
    ...a,
    ihtarKayitlari: (a.ihtarKayitlari ?? []).map((k, i) =>
      ihtarKimligi(k.id, i) === kimlik
        ? { ...k, onaylandi: true, redSebebi: undefined }
        : k,
    ),
  };
}

export function ihtarReddet(
  a: AdayEgitmen,
  kimlik: string,
  sebep: string,
): AdayEgitmen {
  return {
    ...a,
    ihtarKayitlari: (a.ihtarKayitlari ?? []).map((k, i) =>
      ihtarKimligi(k.id, i) === kimlik
        ? { ...k, onaylandi: false, redSebebi: sebep }
        : k,
    ),
  };
}

/** Raporlarda ve listelerde sayılan ihtarlar: onay bekleyen ve reddedilenler hariç. */
export const onayliIhtarlar = (a: AdayEgitmen) =>
  (a.ihtarKayitlari ?? []).filter((k) => k.onaylandi !== false);

/** Onaylanan seminer kademe geçişinde sayılır ve branşın vizesini 1 yıl yeniler. */
export function seminerOnayla(a: AdayEgitmen, id: string): AdayEgitmen {
  return seminerVizeleriniGuncelle({
    ...a,
    gelisimSeminerleri: (a.gelisimSeminerleri ?? []).map((s) =>
      s.id === id ? { ...s, onaylandi: true, redSebebi: undefined } : s,
    ),
  });
}

export function seminerReddet(
  a: AdayEgitmen,
  id: string,
  sebep: string,
): AdayEgitmen {
  return {
    ...a,
    gelisimSeminerleri: (a.gelisimSeminerleri ?? []).map((s) =>
      s.id === id ? { ...s, onaylandi: false, redSebebi: sebep } : s,
    ),
  };
}

/** Profilde İK'ya gösterilen, onay bekleyen bir kayıt (Onay Talepleri'ndeki talep kimliğiyle). */
export type OnayBekleyenKayit = {
  talep: string;
  baslik: string;
  detay: string;
};

const bekliyorMu = (k: { onaylandi?: boolean; redSebebi?: string }) =>
  k.onaylandi === false && !k.redSebebi;

/** Adayın İK onayı bekleyen kademe belgesi, seminer, temel eğitim ve ihtar kayıtları. */
export function onayBekleyenKayitlar(a: AdayEgitmen): OnayBekleyenKayit[] {
  return [
    ...(a.sertifikalar ?? [])
      .filter((s) => s.yukleyen && bekliyorMu(s))
      .map((s) => ({
        talep: `${a.id}-sertifika-${s.id}`,
        baslik: `${s.brans} ${s.kademe}. kademe belgesi`,
        detay: s.belgeTarihi,
      })),
    ...(a.gelisimSeminerleri ?? []).filter(bekliyorMu).map((g) => ({
      talep: `${a.id}-seminer-${g.id}`,
      baslik: `${g.brans} gelişim semineri`,
      detay: g.seminerTarihi,
    })),
    ...(a.temelEgitimSonuclari ?? []).filter(bekliyorMu).map((t) => ({
      talep: `${a.id}-temel-${t.id}`,
      baslik: `${t.brans ?? "Fitness"} ${t.hedefKademe}. kademe temel eğitim sonucu`,
      detay: t.sinavTarihi,
    })),
    ...(a.ihtarKayitlari ?? [])
      .map((k, i) => ({ k, i }))
      .filter(({ k }) => bekliyorMu(k))
      .map(({ k, i }) => ({
        talep: `${a.id}-ihtar-${ihtarKimligi(k.id, i)}`,
        baslik: "İhtar kaydı",
        detay: k.tarih,
      })),
  ];
}
