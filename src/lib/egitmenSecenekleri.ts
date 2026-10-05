import type { AdayEgitmen, AkademiTipi, IstihdamTipi } from "./types";

export const ISTIHDAM_TIPLERI = [
  "Tam Zamanlı",
  "Yarı Zamanlı",
  "Kiracı",
  "Alt Kiracı",
  "Grup Ders Eğitmeni",
  "Instructor",
] as const satisfies readonly IstihdamTipi[];

/**
 * Alt sözleşme tipleri (PRD 10.2). Sözleşme tipinden bağımsız, tek bir liste olarak seçilir.
 * PRD'ye göre bu liste Sistem Yöneticisi tarafından tanımlanır; tanım ekranı gelene kadar
 * burada tutulur.
 */
export const ALT_SOZLESME_TIPLERI = [
  "Alt Kiracı Boks",
  "Alt Kiracı Pilates",
  "Grup Ders Eğitmeni",
  "Instructor Yüzme",
  "Instructor Boks",
  "Kiracı Personal Coach",
  "Kiracı Pilates Coach",
  "Kiracı Yüzme",
  "Kiracı (Yarı Zamanlı)",
  "Tam Zamanlı Personal Coach",
  "Kiracı Personal Coach ve Pilates",
  "Kiracı Personal Coach + Boks",
];

/** Akademiyi tamamlayamayan adayın süreci sonlandırılırken seçilen nedenler (PRD 10.1, 8.2). */
export const SUREC_SONLANDIRMA_NEDENLERI = [
  "Akademi sınavlarından başarısız",
  "Akademiyi yarıda bıraktı",
  "Akademiye katılmadı",
] as const;

export const FESIH_SEKLI_SECENEKLERI = [
  "Akademiyi Bitirmeden Ayrılma",
  "Eğitmen Tarafından Fesih",
  "Kira Değişikliği",
  "Kulüp Değişikliği",
  "Şirket Tarafından Fesih",
] as const;

export const BEDENLER = ["XS", "S", "M", "L", "XL", "XXL"];
export const AYAKKABI_NUMARALARI = Array.from({ length: 46 - 34 + 1 }, (_, i) => String(34 + i));

export const CINSIYET_SECENEKLERI: NonNullable<AdayEgitmen["cinsiyet"]>[] = ["Kadın", "Erkek"];

export const EGITIM_BILGISI_SECENEKLERI = [
  "Lise mezunu",
  "Ön Lisans - Spor Bilimleri Bölümü (Devam ediyor)",
  "Ön Lisans - Spor Bilimleri Bölümü (Mezun)",
  "Ön Lisans - Alan Dışı Bölüm (Devam ediyor)",
  "Ön Lisans - Alan Dışı Bölüm (Mezun)",
  "Lisans - Spor Bilimleri Fakültesi veya Besyo (Devam ediyor)",
  "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
  "Lisans - Alan Dışı Bölüm (Devam ediyor)",
  "Lisans - Alan Dışı Bölüm (Mezun)",
];

export const FEDERASYON_KADEME_SECENEKLERI = [
  "1. Kademe belgem yok. 1. Kademe temel eğitimim de yok.",
  "1. Kademe belgem yok. 1. Kademe temel eğitimim var. 1. Kademe kursunu bekliyorum.",
  "1. Kademe belgem var. 2. Kademe temel eğitimim yok.",
  "1. Kademe belgem var. 2. Kademe temel eğitimim de var. 2. Kademe kursunu bekliyorum.",
  "2. Kademe belgem var.",
  "3. Kademe belgem var.",
  "4. Kademe belgem var.",
  "5. Kademe belgem var.",
  "Denklik Bekliyor (Mezun)",
  "Denklik Bekliyor (Öğrenci)",
];

export const AKADEMI_MULAKAT_SECENEKLERI: AkademiTipi[] = [
  "Standart Akademi Mülakatı (4 Hafta)",
  "Kısa Dönem Akademi Mülakatı (1 Hafta)",
];

/** Bu iki seçenek "belgem yok" anlamına gelir — federasyon sertifikası yükleme alanı bunlarda gizlenir. */
export const FEDERASYON_BELGESI_YOK_SECENEKLERI = new Set(
  FEDERASYON_KADEME_SECENEKLERI.slice(0, 2)
);

/** "Federasyon Sertifikaları" listesinde seçilebilecek federasyon/disiplin tipleri. */
export const FEDERASYON_TIPLERI = [
  "Pilates Federasyonu",
  "Jimnastik Federasyonu",
  "Fitness Federasyonu",
  "Yoga Federasyonu",
  "Dans Federasyonu",
  "Yüzme Federasyonu",
  "Diğer",
];

export const TITLE_SECENEKLERI = [
  "Kişisel Eğitmen",
  "Grup Eğitmeni",
  "Yüzme Eğitmeni",
  "Pilates Eğitmeni",
];

export const ALT_CALISMA_SEKLI_SECENEKLERI = ["Bireysel", "Grup", "Kurumsal"];

export const DIL_SECENEKLERI = [
  "Türkçe",
  "İngilizce",
  "Almanca",
  "Fransızca",
  "İspanyolca",
  "Arapça",
];

export function telefonMaskele(telefon: string): string {
  const rakamlar = telefon.replace(/\D/g, "");
  if (rakamlar.length < 6) return telefon;
  const bas = rakamlar.slice(0, 4);
  const son = rakamlar.slice(-2);
  return `${bas} *** ** ${son}`;
}
