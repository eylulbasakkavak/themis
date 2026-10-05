import type { AdayEgitmen, Belge, MulakatRolu, SurecDurumu } from "./types";

export const ILK_BELGE_SETI_ADLARI: Record<MulakatRolu, string[]> = {
  İK: ["Mülakat Formu", "Aday CV'si"],
  "Kulüp Müdürü": ["Mülakat Formu", "Aday CV'si", "Bölge Müdürü Onayı"],
};

export function ilkBelgeSetiOlustur(rol: MulakatRolu): Belge[] {
  return ILK_BELGE_SETI_ADLARI[rol].map((ad) => ({ ad, durum: "yuklenmedi" as const }));
}

export const IKINCI_BELGE_SETI_ADLARI = [
  "Adli Sicil Belgesi",
  "Fiziki Oryantasyon Formu",
  "Öğrenim Durumu Belgesi",
];

export function ikinciBelgeSetiOlustur(): Belge[] {
  return IKINCI_BELGE_SETI_ADLARI.map((ad) => ({ ad, durum: "yuklenmedi" as const }));
}

export function belgeSetiTamamMi(belgeler: Belge[]): boolean {
  return belgeler.every((b) => b.durum !== "yuklenmedi");
}

/**
 * Mülakat sonucu (İK + akademi eğitmenleri tarafından, her iki belge seti onaylandıktan
 * sonra girilir — bkz. MulakatSonucuModal) girildiğinde sıradaki süreç durumu:
 * - Olumsuzsa: reddedildi.
 * - "İleride Değerlendirilebilir" ise: aynı adıyla süreç sonlanır.
 * - Sadece "Olumlu" olan adaylarda süreç devam eder — akademi eğitimine hazır olur.
 */
export function mulakatSonucuSonrasiDurum(
  gorusmeSonucu: AdayEgitmen["gorusmeSonucu"]
): SurecDurumu {
  if (gorusmeSonucu === "Olumsuz") return "reddedildi";
  // Mülakata gelmeyen adayın süreci sonlanmaz; İK mülakatı yeniden planlayabilir.
  if (gorusmeSonucu === "Katılmadı") return "mulakata_katilmadi";
  if (gorusmeSonucu === "İleride Değerlendirilebilir") return "ileride_degerlendirilebilir";
  return "akademi_egitimine_hazir";
}

/** Mülakat sonucu "Olumlu" olmadıkça süreç ilerlemez — reddedildi ve ileride
 * değerlendirilebilir kararları süreci burada sonlandırır. */
export function surecDurduruldu(gorusmeSonucu: AdayEgitmen["gorusmeSonucu"]): boolean {
  return gorusmeSonucu === "Olumsuz" || gorusmeSonucu === "İleride Değerlendirilebilir";
}

/**
 * İlk belge setinde ayrı bir İK onayına gerek yoktur: İK mülakatlarında belgeler zaten
 * otonom kabul edilir, Kulüp Müdürü mülakatlarında ise setin kendi içindeki "Bölge
 * Müdürü Onayı" belgesi onay mekanizmasının ta kendisidir. Bu yüzden ilk belge seti,
 * tüm belgeleri yüklenir yüklenmez (role bakılmaksızın) tamamlanmış/onaylanmış sayılır.
 */
export function ilkBelgeSetiOnaylanmisMi(aday: Pick<AdayEgitmen, "ilkBelgeSeti">): boolean {
  return belgeSetiTamamMi(aday.ilkBelgeSeti);
}

/**
 * İkinci belge setinde İK'nın gerçek bir onayı gerekir (setin içinde otomatik onay
 * sayılacak bir belge yok). Otonom durum (ayrı onay gerekmemesi) adayın mülakatını
 * kimin yaptığına değil, belgeleri şu an kimin tamamladığına bağlıdır — bu yüzden burada
 * sadece kalıcı onay bayrağına bakılır; otonom tamamlama anı (ikinciYukle) bu bayrağı
 * zaten doğrudan set eder.
 */
export function ikinciBelgeSetiOnaylanmisMi(
  aday: Pick<AdayEgitmen, "ikinciBelgeSetiOnaylandi">
): boolean {
  return !!aday.ikinciBelgeSetiOnaylandi;
}

/**
 * Kulüp Müdürü ikinci belge seti için "İK Onayına Gönder" dediğinde süreç durumu
 * "ik_onayi_bekliyor" olur (ilk belge seti hiç bu duruma girmez, kendi kendine
 * tamamlanır). "İK Onayı Bekleyenler" sayfası bu bilgiyle çalışır.
 */
export function bekleyenBelgeSeti(aday: AdayEgitmen): "ikinci" | null {
  if (aday.surecDurumu !== "ik_onayi_bekliyor") return null;
  return ikinciBelgeSetiOnaylanmisMi(aday) ? null : "ikinci";
}

/**
 * İK onayı (iki belge seti) tamamlanmış ama akademi mülakatı henüz planlanmamış aday;
 * mülakata katılmayan aday da yeniden planlanmayı bekler.
 */
export function mulakatPlanlanacakMi(aday: AdayEgitmen): boolean {
  return (
    aday.surecDurumu === "mulakata_katilmadi" ||
    (aday.surecDurumu === "mulakat_sonucu_bekleniyor" &&
      !aday.mulakatPlanlananTarihi &&
      ilkBelgeSetiOnaylanmisMi(aday) &&
      ikinciBelgeSetiOnaylanmisMi(aday))
  );
}
