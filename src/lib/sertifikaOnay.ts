import type { AdayEgitmen } from "./types";

/**
 * Sertifika, vize ve temel eğitim kayıtlarının İK onayı / reddi (PRD 12.2–12.4). Onay
 * Talepleri sayfası ve profil aynı fonksiyonları kullanır.
 */

/**
 * Kademe belgesi onaylanınca eğitmenin o branştaki kademesi bu belgeye göre güncellenir. Vize
 * branşa aittir: yeni belgenin kendi vizesi yoksa önceki aktif belgenin geçerli vizesi aktarılır.
 */
export function sertifikaOnayla(a: AdayEgitmen, sertifikaId: string): AdayEgitmen {
  const yeni = a.sertifikalar?.find((s) => s.id === sertifikaId);
  const onceki = (a.sertifikalar ?? [])
    .filter((s) => yeni && s.brans === yeni.brans && s.onaylandi && s.id !== sertifikaId)
    .sort((x, y) => y.kademe - x.kademe)[0];
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id !== sertifikaId
        ? s
        : {
            ...s,
            onaylandi: true,
            redSebebi: undefined,
            ...(!s.vizeBitisTarihi && onceki?.vizeBitisTarihi
              ? { vizeDonemi: onceki.vizeDonemi, vizeBitisTarihi: onceki.vizeBitisTarihi }
              : {}),
          }
    ),
  };
}

export function sertifikaReddet(a: AdayEgitmen, sertifikaId: string, sebep: string): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id === sertifikaId ? { ...s, onaylandi: false, redSebebi: sebep } : s
    ),
  };
}

/** Vize onaylanınca sertifikanın geçerli vize dönemi ve bitiş tarihi bu kayıttan alınır. */
export function vizeOnayla(a: AdayEgitmen, sertifikaId: string, vizeId: string): AdayEgitmen {
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
          v.id === vizeId ? { ...v, onaylandi: true, redSebebi: undefined } : v
        ),
      };
    }),
  };
}

export function vizeReddet(
  a: AdayEgitmen,
  sertifikaId: string,
  vizeId: string,
  sebep: string
): AdayEgitmen {
  return {
    ...a,
    sertifikalar: (a.sertifikalar ?? []).map((s) =>
      s.id === sertifikaId
        ? {
            ...s,
            vizeler: (s.vizeler ?? []).map((v) =>
              v.id === vizeId ? { ...v, onaylandi: false, redSebebi: sebep } : v
            ),
          }
        : s
    ),
  };
}

export function temelEgitimOnayla(a: AdayEgitmen, id: string): AdayEgitmen {
  return {
    ...a,
    temelEgitimSonuclari: (a.temelEgitimSonuclari ?? []).map((t) =>
      t.id === id ? { ...t, onaylandi: true, redSebebi: undefined } : t
    ),
  };
}

export function temelEgitimReddet(a: AdayEgitmen, id: string, sebep: string): AdayEgitmen {
  return {
    ...a,
    temelEgitimSonuclari: (a.temelEgitimSonuclari ?? []).map((t) =>
      t.id === id ? { ...t, onaylandi: false, redSebebi: sebep } : t
    ),
  };
}

/** İhtar kaydının kimliği; eski kayıtlarda id yoksa listedeki sırası kullanılır. */
export const ihtarKimligi = (id: string | undefined, sira: number) => id ?? String(sira);

/** PRD 11.4: KM/KMY'nin girdiği ihtar İK onayıyla kesinleşir. */
export function ihtarOnayla(a: AdayEgitmen, kimlik: string): AdayEgitmen {
  return {
    ...a,
    ihtarKayitlari: (a.ihtarKayitlari ?? []).map((k, i) =>
      ihtarKimligi(k.id, i) === kimlik ? { ...k, onaylandi: true, redSebebi: undefined } : k
    ),
  };
}

export function ihtarReddet(a: AdayEgitmen, kimlik: string, sebep: string): AdayEgitmen {
  return {
    ...a,
    ihtarKayitlari: (a.ihtarKayitlari ?? []).map((k, i) =>
      ihtarKimligi(k.id, i) === kimlik ? { ...k, onaylandi: false, redSebebi: sebep } : k
    ),
  };
}

/** Raporlarda ve listelerde sayılan ihtarlar: onay bekleyen ve reddedilenler hariç. */
export const onayliIhtarlar = (a: AdayEgitmen) =>
  (a.ihtarKayitlari ?? []).filter((k) => k.onaylandi !== false);
