import type { AdayEgitmen, BelgeDurumu, SurecDurumu } from "./types";

export type Tone =
  "gray" | "amber" | "orange" | "purple" | "blue" | "green" | "pink" | "red" | "indigo" | "lime";

export const surecDurumuBilgi: Record<SurecDurumu, { label: string; tone: Tone }> = {
  ilk_belge_seti_bekleniyor: { label: "Birinci Belge Seti Bekleniyor", tone: "amber" },
  ikinci_belge_seti_bekleniyor: { label: "İkinci Belge Seti Bekleniyor", tone: "indigo" },
  mulakat_sonucu_bekleniyor: { label: "Mülakat Planlandı", tone: "blue" },
  mulakata_katilmadi: { label: "Mülakata Katılmadı", tone: "orange" },
  akademi_egitimine_hazir: { label: "Akademi Daveti / İK Onayı Bekleniyor", tone: "orange" },
  akademi_daveti_onayi_bekliyor: { label: "Akademi Daveti / İK Onayı Bekleniyor", tone: "orange" },
  ik_onayi_bekliyor: { label: "İK Onayı Bekleniyor", tone: "orange" },
  ileride_degerlendirilebilir: { label: "Yeniden Değerlendirilebilir", tone: "pink" },
  akademi_egitmeni: { label: "Akademide", tone: "blue" },
  akademiyi_tamamladi: { label: "Eğitmenliğe Geçiş Hazır", tone: "green" },
  egitmen: { label: "Eğitmen", tone: "purple" },
  pasif: { label: "Pasif Eğitmen", tone: "gray" },
  akademiye_katilmadi: { label: "Akademiye Katılmadı", tone: "red" },
  surec_sonlandirildi: { label: "Süreç Sonlandırıldı", tone: "red" },
  reddedildi: { label: "Olumsuz", tone: "red" },
};

/**
 * Listede ve profilde gösterilen süreç durumu (PRD adımları). Akademi mülakatı aşamasındaki
 * aday, mülakat tarihi belirlenene kadar "Mülakat Planlanacak", sonra "Mülakat Planlandı"
 * olarak görünür.
 */
export function surecDurumuGorunumu(
  a: Pick<AdayEgitmen, "surecDurumu" | "mulakatPlanlananTarihi">
): { label: string; tone: Tone } {
  if (a.surecDurumu === "mulakat_sonucu_bekleniyor" && !a.mulakatPlanlananTarihi) {
    return { label: "Mülakat Planlanacak", tone: "orange" };
  }
  return surecDurumuBilgi[a.surecDurumu];
}

/**
 * Eğitmen statüsü (PRD §3): "Aday Eğitmen Ekle" ile kişi "Aday Eğitmen" olur; akademi
 * davet bilgileri İK tarafından onaylanınca "Akademi Eğitmeni"ne, "Eğitmen Statüsüne
 * Geçir" ile "Eğitmen"e, işten çıkışla "Pasif Eğitmen"e geçer. Themis'in ayrıntılı süreç
 * durumları bu statülerin altında bir detay/alt-etiket olarak gösterilir
 * (bkz. surecDurumuBilgi).
 */
export type UyelikTipi = "Aday Eğitmen" | "Akademi Eğitmeni" | "Eğitmen" | "Pasif Eğitmen";

export const UYELIK_TIPLERI: UyelikTipi[] = [
  "Aday Eğitmen",
  "Akademi Eğitmeni",
  "Eğitmen",
  "Pasif Eğitmen",
];

const UYELIK_TIPI_HARITASI: Record<SurecDurumu, UyelikTipi> = {
  ilk_belge_seti_bekleniyor: "Aday Eğitmen",
  ikinci_belge_seti_bekleniyor: "Aday Eğitmen",
  mulakat_sonucu_bekleniyor: "Aday Eğitmen",
  mulakata_katilmadi: "Aday Eğitmen",
  ik_onayi_bekliyor: "Aday Eğitmen",
  ileride_degerlendirilebilir: "Aday Eğitmen",
  reddedildi: "Aday Eğitmen",
  // Davet bilgileri İK onayına kadar kişi hâlâ Aday Eğitmen'dir (PRD §3, §6).
  akademi_egitimine_hazir: "Aday Eğitmen",
  akademi_daveti_onayi_bekliyor: "Aday Eğitmen",
  akademi_egitmeni: "Akademi Eğitmeni",
  akademiyi_tamamladi: "Akademi Eğitmeni",
  egitmen: "Eğitmen",
  pasif: "Pasif Eğitmen",
  // Gelmedi işaretlenen adayın Akademi Eğitmeni sözleşmesi kapatılır (PRD 8.2).
  akademiye_katilmadi: "Aday Eğitmen",
  surec_sonlandirildi: "Aday Eğitmen",
};

export function uyelikTipi(surecDurumu: SurecDurumu): UyelikTipi {
  return UYELIK_TIPI_HARITASI[surecDurumu];
}

export const uyelikTipiBilgi: Record<UyelikTipi, { tone: Tone }> = {
  "Aday Eğitmen": { tone: "amber" },
  "Akademi Eğitmeni": { tone: "blue" },
  Eğitmen: { tone: "purple" },
  "Pasif Eğitmen": { tone: "gray" },
};

export const belgeDurumuBilgi: Record<BelgeDurumu, { label: string; tone: Tone }> = {
  yuklenmedi: { label: "Yüklenmedi", tone: "gray" },
  yuklendi: { label: "Yüklendi", tone: "blue" },
};

export const gorusmeSonucuBilgi: Record<
  NonNullable<AdayEgitmen["gorusmeSonucu"]>,
  { tone: Tone }
> = {
  Olumlu: { tone: "green" },
  Olumsuz: { tone: "red" },
  Katılmadı: { tone: "orange" },
  "İleride Değerlendirilebilir": { tone: "amber" },
};

export const toneClasses: Record<Tone, string> = {
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pink: "bg-pink-50 text-pink-700 ring-pink-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  lime: "bg-lime-50 text-lime-700 ring-lime-200",
};

/** toneClasses ile aynı renkler, ama pill/çerçeve olmadan sadece metin rengi olarak. */
export const toneTextClasses: Record<Tone, string> = {
  gray: "text-zinc-600",
  amber: "text-amber-700",
  orange: "text-orange-700",
  purple: "text-purple-700",
  blue: "text-blue-700",
  green: "text-emerald-700",
  pink: "text-pink-700",
  red: "text-rose-700",
  indigo: "text-indigo-700",
  lime: "text-lime-700",
};
