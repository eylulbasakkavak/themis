import { bugun, tarihCoz, tarihYaz } from "./akademi";
import { uyelikTipi } from "./status";
import type { AdayEgitmen, IstihdamTipi, SozlesmeKaydi } from "./types";

/** Eğitmenlikteki ilk sözleşmenin başlangıcı; eğitmen olmamış kişide boş. */
export function iseGirisTarihi(a: AdayEgitmen): string {
  const t = uyelikTipi(a.surecDurumu);
  if (t !== "Eğitmen" && t !== "Pasif Eğitmen") return "";
  const tarihler = (a.sozlesmeGecmisi ?? []).map((s) => s.baslangicTarihi);
  return (
    tarihler.sort((x, y) => (tarihCoz(x)?.getTime() ?? 0) - (tarihCoz(y)?.getTime() ?? 0))[0] ??
    a.basvuruTarihi
  );
}

/** Eğitmen statüsüne geçiş için profilde doldurulmuş olması gereken bilgiler. */
export function egitmenBilgileriEksikMi(aday: AdayEgitmen): boolean {
  return !aday.ayakkabiNo || !aday.ustBeden || !aday.altBeden;
}

/**
 * Akademiyi tamamlayan adayı seçilen sözleşme tipiyle eğitmen statüsüne geçirir (PRD 10.2):
 * eğitmen, aday olarak eklendiği kulüpte başlar; sözleşme geçmişi ve aksiyon kaydı eklenir.
 */
export function egitmeneGecir(
  aday: AdayEgitmen,
  istihdamTipi: IstihdamTipi,
  altSozlesmeTipi: string,
  yapan: string
): AdayEgitmen {
  const tarih = tarihYaz(bugun());
  return {
    ...aday,
    surecDurumu: "egitmen",
    istihdamTipi,
    altSozlesmeTipi,
    sozlesmeGecmisi: [
      ...(aday.sozlesmeGecmisi ?? []),
      {
        kulup: aday.kulup,
        sozlesmeTipi: istihdamTipi,
        altSozlesmeTipi,
        baslangicTarihi: tarih,
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      ...aday.aksiyonGecmisi,
      {
        tarih,
        aksiyon: `Eğitmen statüsüne geçirildi (${altSozlesmeTipi}); Akademi Eğitmeni sözleşmesi kapatıldı, Flyby'da Eğitmen Self-Employee sözleşmesi tanımlandı, kulüp bilgisi Flyby ve CMS'e aktarıldı`,
        yapan,
      },
    ],
  };
}

/** Olumsuz / ileride değerlendirilebilir adayı akademi mülakatı aşamasına geri alır. */
export function sureceYenidenDahilEt(aday: AdayEgitmen, yapan: string): AdayEgitmen {
  return {
    ...aday,
    gorusmeSonucu: undefined,
    gorusmeSonucuTarihi: undefined,
    olumsuzOlmaNedeni: undefined,
    mulakatDegerlendirmesi: undefined,
    // Yeni akademi mülakatı İK tarafından yeniden planlanır.
    mulakatPlanlananTarihi: undefined,
    mulakatPlanlananSaat: undefined,
    // Belge setleri zaten onaylı — sadece mülakat sonucu yeniden değerlendirmeye açılır.
    surecDurumu: "mulakat_sonucu_bekleniyor",
    aksiyonGecmisi: [
      ...aday.aksiyonGecmisi,
      {
        tarih: tarihYaz(bugun()),
        aksiyon: "Aday süreç yeniden dahil edildi, Mülakat Sonucu yeniden değerlendirmeye açıldı",
        yapan,
      },
    ],
  };
}

/** Açık (devam eden) sözleşme kayıtlarını verilen tarih ve nedenle kapatır. */
export function sozlesmeleriKapat(
  gecmis: SozlesmeKaydi[] | undefined,
  tarih: string,
  neden: string
): SozlesmeKaydi[] {
  return (gecmis ?? []).map((k) =>
    k.durum === "Devam Ediyor"
      ? { ...k, durum: "Sona Erdi" as const, bitisTarihi: tarih, bitisNedeni: neden }
      : k
  );
}

/**
 * Kulüp ya da sözleşme tipi değişikliği (PRD 11.1, 11.2): devam eden sözleşme geçerlilik
 * tarihinde kapanır, yeni kulüp / tip ile yeni kayıt açılır. Geçmiş profilde tarihleriyle görünür.
 */
export function sozlesmeDegistir(
  aday: AdayEgitmen,
  yeni: { kulup: string; sozlesmeTipi: IstihdamTipi; altSozlesmeTipi?: string },
  tarih: string,
  neden: string
): SozlesmeKaydi[] {
  return [
    ...sozlesmeleriKapat(aday.sozlesmeGecmisi, tarih, neden),
    { ...yeni, baslangicTarihi: tarih, durum: "Devam Ediyor" },
  ];
}
