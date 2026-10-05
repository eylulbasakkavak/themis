import { FESIH_SEKLI_SECENEKLERI } from "./egitmenSecenekleri";
import { KULUPLER } from "./kulupler";
import type {
  AdayEgitmen,
  AkademiTipi,
  Belge,
  IstihdamTipi,
  MulakatRolu,
  SozlesmeKaydi,
  SozlesmeTipi,
} from "./types";

export const ADLAR = [
  "Mert",
  "Elif",
  "Ahmet",
  "Zeynep",
  "Can",
  "Deniz",
  "Ece",
  "Burak",
  "Selin",
  "Kerem",
  "Onur",
  "Gizem",
  "Yağmur",
  "Cem",
  "Aslı",
  "Berk",
  "Alper",
  "Pelin",
  "Tolga",
  "Ayşe",
  "Kaan",
  "Merve",
  "Emre",
  "Buse",
  "Serhat",
  "Nazlı",
  "İrem",
  "Umut",
  "Sinem",
  "Barış",
  "Ceren",
  "Tarık",
  "Gül",
  "Volkan",
  "Esra",
  "Hakan",
  "Nur",
  "Fatih",
  "Sude",
  "Oğuz",
  "Aylin",
  "Rıza",
  "Duygu",
  "Kadir",
];

// Örnek verideki cinsiyet alanı için ADLAR listesindeki kadın adları.
const KADIN_ADLARI = new Set([
  "Elif",
  "Zeynep",
  "Deniz",
  "Ece",
  "Selin",
  "Gizem",
  "Yağmur",
  "Aslı",
  "Pelin",
  "Ayşe",
  "Merve",
  "Buse",
  "Nazlı",
  "İrem",
  "Sinem",
  "Ceren",
  "Gül",
  "Esra",
  "Nur",
  "Sude",
  "Aylin",
  "Duygu",
]);
const ornekCinsiyet = (ad: string): "Kadın" | "Erkek" => (KADIN_ADLARI.has(ad) ? "Kadın" : "Erkek");

export const SOYADLAR = [
  "Yıldız",
  "Kaya",
  "Şahin",
  "Çelik",
  "Aydın",
  "Koç",
  "Yılmaz",
  "Kaplan",
  "Aksoy",
  "Demir",
  "Aydemir",
  "Şimşek",
  "Güneş",
  "Sarı",
  "Erdem",
  "Bulut",
  "Uslu",
  "Doğan",
  "Er",
  "Aslan",
  "Karaca",
  "Toprak",
  "Ateş",
  "Polat",
  "Öz",
  "Tekin",
  "Yalçın",
  "Uçar",
  "Bilgin",
  "Kurt",
];

const SPOR_GECMISI_POOL = [
  "Fitness enstrüktörü, 5 yıl deneyim",
  "Basketbol altyapı antrenörlüğü, 4 yıl deneyim",
  "Yüzme milli takım altyapısı, 6 yıl deneyim",
  "Crossfit L1 antrenör, 3 yıl deneyim",
  "Pilates enstrüktörü, 4 yıl deneyim",
  "Atletizm antrenörlüğü, 7 yıl deneyim",
  "Vücut geliştirme, PT sertifikası, 5 yıl deneyim",
  "Boks antrenörü, 4 yıl deneyim",
  "Voleybol altyapı antrenörlüğü, 3 yıl deneyim",
  "Yoga eğitmeni sertifikası, 3 yıl deneyim",
];

const IS_DENEYIMI_POOL = [
  "3 yıl özel spor salonu eğitmenliği",
  "4 yıl grup dersleri eğitmenliği",
  "2 yıl kişisel antrenörlük",
  "5 yıl butik stüdyo eğitmenliği",
  "3 yıl kulüp bünyesinde eğitmenlik",
];

const KM_ISIMLERI = ["Mert Aydın", "Barış Ç.", "Aslı Kurt"];
const IK_ISIMLERI = ["Elif Su"];
const BEDENLER = ["XS", "S", "M", "L", "XL", "XXL"];
const ISTIHDAM_TIPLERI: IstihdamTipi[] = ["Tam Zamanlı", "Yarı Zamanlı", "Kiracı"];
const OZEL_BRANSLAR: SozlesmeTipi[] = ["GX", "Pilates", "Havuz"];
const KULUP_DEGISIM_NEDENLERI = ["Kulüp değişikliği", "Yeni görev yeri ataması"];

function turkceyiSadelestir(deger: string): string {
  return deger
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, "");
}

function tarihUret(i: number): string {
  return tarihUretYil(i, 2025);
}

function tarihUretYil(i: number, yil: number): string {
  const gun = String((i % 28) + 1).padStart(2, "0");
  const ay = String(((i * 3) % 12) + 1).padStart(2, "0");
  return `${gun}.${ay}.${yil}`;
}

/** Her eğitmen için en az bir, bazılarında bir önceki kulüpten sona ermiş bir tane daha
 * olacak şekilde sentetik sözleşme/kulüp geçmişi üretir (Flyby'dan geldiği varsayılan alan). */
function sozlesmeGecmisiUret(
  i: number,
  kulup: string,
  istihdamTipi: IstihdamTipi,
  guncelBaslangic: string
): SozlesmeKaydi[] {
  const kayitlar: SozlesmeKaydi[] = [];
  const oncekiKulup = KULUPLER[(i + 5) % KULUPLER.length];
  if (i % 3 === 0 && oncekiKulup !== kulup) {
    kayitlar.push({
      kulup: oncekiKulup,
      sozlesmeTipi: ISTIHDAM_TIPLERI[(i + 1) % ISTIHDAM_TIPLERI.length],
      baslangicTarihi: tarihUretYil(i, 2021 + (i % 3)),
      bitisTarihi: tarihUretYil(i, 2024),
      durum: "Sona Erdi",
      bitisNedeni: KULUP_DEGISIM_NEDENLERI[i % KULUP_DEGISIM_NEDENLERI.length],
    });
  }
  kayitlar.push({
    kulup,
    sozlesmeTipi: istihdamTipi,
    baslangicTarihi: guncelBaslangic,
    durum: "Devam Ediyor",
  });
  return kayitlar;
}

/** Bir sentetik eğitmenin GX/Pilates/Havuz gibi karneden otomatik hariç bir branşta olup olmadığı. */
export function sentetikOzelBransMi(i: number): boolean {
  return i % 9 === 8;
}

/** Mock veri için deterministik, 7 haneli Flyby ID'si (Themis ID) üretir. */
export function themisIdUret(tohum: number): string {
  return String(2_400_000 + tohum * 1_379);
}

/**
 * Yeni eklenen aday için Flyby'dan dönen üyelik ID'sini simüle eder. Gerçekte bu ID,
 * telefon numarasıyla yapılan üyelik kontrolünde Flyby'dan okunur.
 */
export function yeniThemisId(): string {
  return String(3_000_000 + Math.floor(Math.random() * 1_000_000));
}

/**
 * Eğitmen Karne'yi gerçekçi bir ölçekte (çok sayıda eğitmenle) görebilmek için
 * kullanılan sentetik eğitmen üretici. Gerçek bir veri kaynağı değildir.
 */
export function sentetikEgitmenlerUret(
  baslangicId: number,
  adet: number,
  // İkinci bir grup üretilirken isim ve kulüplerin ilk grupla çakışmaması için kaydırma.
  kaydirma = 0
): AdayEgitmen[] {
  const sonuc: AdayEgitmen[] = [];

  for (let i = 0; i < adet; i++) {
    const id = String(baslangicId + i);
    const ad = ADLAR[(i + kaydirma) % ADLAR.length];
    const soyad = SOYADLAR[(i * 7 + 3 + kaydirma * 3) % SOYADLAR.length];
    const kulup = KULUPLER[(i + kaydirma) % KULUPLER.length];
    const kmMi = i % 2 === 0;
    const mulakatiYapanRol: MulakatRolu = kmMi ? "Kulüp Müdürü" : "İK";
    const mulakatiYapan = kmMi ? KM_ISIMLERI[i % KM_ISIMLERI.length] : IK_ISIMLERI[0];
    const istihdamTipi: IstihdamTipi = ISTIHDAM_TIPLERI[i % ISTIHDAM_TIPLERI.length];
    const sozlesmeTipi: SozlesmeTipi | undefined = sentetikOzelBransMi(i)
      ? OZEL_BRANSLAR[Math.floor(i / 9) % OZEL_BRANSLAR.length]
      : undefined;
    const basvuruTarihi = tarihUret(i);
    const beden = BEDENLER[i % BEDENLER.length];
    const ayakkabiNo = String(36 + (i % 10));
    const eposta = `${turkceyiSadelestir(ad)}.${turkceyiSadelestir(soyad)}${id}@gmail.com`;
    // Her 14 sentetik eğitmenden biri işten çıkmış (Pasif Eğitmen) olarak üretilir.
    const pasifMi = i % 14 === 13;
    const cikisTarihi = pasifMi ? `${String(5 + (i % 20)).padStart(2, "0")}.09.2026` : undefined;
    const fesihSekli = pasifMi
      ? FESIH_SEKLI_SECENEKLERI[i % FESIH_SEKLI_SECENEKLERI.length]
      : undefined;
    const telefon = `05${30 + (i % 9)} ${String(100 + i).padStart(3, "0")} ${String(10 + (i % 80)).padStart(2, "0")} ${String(10 + ((i * 3) % 80)).padStart(2, "0")}`;

    const ilkBelgeSeti: Belge[] = kmMi
      ? [
          { ad: "Mülakat Formu", durum: "yuklendi", tarih: basvuruTarihi },
          { ad: "Aday CV'si", durum: "yuklendi", tarih: basvuruTarihi },
          { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: basvuruTarihi },
        ]
      : [
          { ad: "Mülakat Formu", durum: "yuklendi", tarih: basvuruTarihi },
          { ad: "Aday CV'si", durum: "yuklendi", tarih: basvuruTarihi },
        ];

    sonuc.push({
      id,
      themisId: themisIdUret(baslangicId + i),
      ad,
      soyad,
      telefon,
      eposta,
      kulup,
      mulakatiYapanRol,
      mulakatiYapan,
      basvuruTarihi,
      surecDurumu: pasifMi ? "pasif" : "egitmen",
      cikisTarihi,
      fesihSekli,
      gorusmeSonucu: "Olumlu",
      sporGecmisi: SPOR_GECMISI_POOL[i % SPOR_GECMISI_POOL.length],
      isDeneyimi: IS_DENEYIMI_POOL[i % IS_DENEYIMI_POOL.length],
      istihdamTipi,
      sozlesmeTipi,
      ilkBelgeSeti,
      ikinciBelgeSeti: [
        { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: basvuruTarihi },
      ],
      ikinciBelgeSetiOnaylandi: kmMi ? true : undefined,
      ayakkabiNo,
      beden,
      // Akademi Eğitmeni statüsüne geçmek Vergi Levhası'nın İK tarafından onaylanmış olmasını
      // gerektirir (bkz. AkademiEgitimineDavet); bu yüzden "egitmen" olan her sentetik kayıtta
      // bu belge zaten yüklenmiş/onaylanmış kabul edilir.
      vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: basvuruTarihi },
      sozlesmeGecmisi: sozlesmeGecmisiUret(i, kulup, istihdamTipi, basvuruTarihi).map((k) =>
        pasifMi && k.durum === "Devam Ediyor"
          ? { ...k, durum: "Sona Erdi", bitisTarihi: cikisTarihi, bitisNedeni: fesihSekli }
          : k
      ),
      aksiyonGecmisi: [
        {
          tarih: basvuruTarihi,
          aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
          yapan: "Sistem (Themis)",
        },
        {
          tarih: basvuruTarihi,
          aksiyon: `${istihdamTipi} Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı`,
          yapan: "Sistem (Themis) — toplu işlem",
        },
        ...(pasifMi
          ? [
              {
                tarih: cikisTarihi!,
                aksiyon: `İşten çıkış yapıldı (${fesihSekli}); statü Pasif Eğitmen oldu`,
                yapan: "Ayşe Demir (İK)",
              },
            ]
          : []),
      ],
    });
  }

  return sonuc;
}

/**
 * Akademi mülakatı planlanmış, sonucu bekleyen örnek adaylar — Akademi Mülakatı
 * Değerlendirme ekranının dolu görünmesi için. İki belge seti de onaylıdır.
 */
export function mulakatBekleyenAdaylarUret(
  baslangicId: number,
  adet: number,
  kaydirma = 0
): AdayEgitmen[] {
  // Geçmiş (sonucu girilmemiş) ve önümüzdeki iki haftaya yayılmış mülakat günleri.
  const tarihler = [
    "2026-10-01",
    "2026-10-06",
    "2026-10-08",
    "2026-10-13",
    "2026-10-15",
    "2026-10-20",
  ];
  return Array.from({ length: adet }, (_, i) => {
    const id = String(baslangicId + i);
    const ad = ADLAR[(i * 5 + 11 + kaydirma) % ADLAR.length];
    const soyad = SOYADLAR[(i * 3 + 17 + kaydirma * 2) % SOYADLAR.length];
    const kmMi = i % 2 === 0;
    const mulakatiYapanRol: MulakatRolu = kmMi ? "Kulüp Müdürü" : "İK";
    const mulakatiYapan = kmMi ? KM_ISIMLERI[i % KM_ISIMLERI.length] : IK_ISIMLERI[0];
    const basvuruTarihi = `${String(10 + i).padStart(2, "0")}.09.2026`;
    return {
      id,
      themisId: themisIdUret(baslangicId + i),
      ad,
      soyad,
      telefon: `0541 ${String(300 + i)} ${String(20 + i)} ${String(40 + i)}`,
      eposta: `${turkceyiSadelestir(ad)}.${turkceyiSadelestir(soyad)}${id}@gmail.com`,
      kulup: KULUPLER[(i * 2 + kaydirma) % KULUPLER.length],
      mulakatiYapanRol,
      mulakatiYapan,
      basvuruTarihi,
      surecDurumu: "mulakat_sonucu_bekleniyor",
      cinsiyet: ornekCinsiyet(ad),
      akademiMulakatTipi:
        i % 3 === 2
          ? "Kısa Dönem Akademi Mülakatı (1 Hafta)"
          : "Standart Akademi Mülakatı (4 Hafta)",
      ilkBelgeSeti: [
        { ad: "Mülakat Formu", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Aday CV'si", durum: "yuklendi", tarih: basvuruTarihi },
        ...(kmMi
          ? [{ ad: "Bölge Müdürü Onayı", durum: "yuklendi" as const, tarih: basvuruTarihi }]
          : []),
      ],
      ikinciBelgeSeti: [
        { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: basvuruTarihi },
      ],
      ikinciBelgeSetiOnaylandi: true,
      dijitalOryantasyonTamamlandi: true,
      mulakatPlanlananTarihi: tarihler[i % tarihler.length],
      mulakatPlanlananSaat: `${10 + (i % 6)}:00`,
      mulakatPlanlayanKisi: `${IK_ISIMLERI[0]} (İK)`,
      mulakatPlanlamaTarihi: "28.09.2026",
      aksiyonGecmisi: [
        {
          tarih: basvuruTarihi,
          aksiyon: "Aday eğitmen olarak eklendi",
          yapan: `${mulakatiYapan} (${mulakatiYapanRol})`,
        },
        {
          tarih: "28.09.2026",
          aksiyon: `Akademi mülakatı ${tarihler[i % tarihler.length]} tarihine planlandı`,
          yapan: `${IK_ISIMLERI[0]} (İK)`,
        },
      ],
    };
  });
}

type OrnekAsama =
  | "ilk_belge"
  | "ikinci_belge"
  | "ik_onayi"
  | "planlanacak"
  | "katilmadi"
  | "olumsuz"
  | "yeniden"
  // Mülakatı olumlu: davet bilgileri bekleniyor / davet İK onayında.
  | "olumlu"
  | "davet_onay";

// Aday Eğitmenler listesinin her süreç adımını göstermesi için sıra.
const ORNEK_ASAMALAR: OrnekAsama[] = [
  "ilk_belge",
  "ikinci_belge",
  "ik_onayi",
  "planlanacak",
  "olumsuz",
  "ilk_belge",
  "ikinci_belge",
  "ik_onayi",
  "planlanacak",
  "katilmadi",
  "yeniden",
  "planlanacak",
  "olumlu",
  "davet_onay",
  "davet_onay",
];

/**
 * Aday sürecinin farklı adımlarındaki örnek adaylar (birinci / ikinci belge seti, İK onayı,
 * mülakat planlanacak, mülakata katılmadı, olumsuz, yeniden değerlendirilebilir).
 */
export function adaySureciOrnekleriUret(baslangicId: number, kaydirma = 0): AdayEgitmen[] {
  return mulakatBekleyenAdaylarUret(baslangicId, ORNEK_ASAMALAR.length, kaydirma).map(
    (temel, i) => {
      const asama = ORNEK_ASAMALAR[i];
      const ad = ADLAR[(i * 7 + 3 + kaydirma) % ADLAR.length];
      const soyad = SOYADLAR[(i * 11 + 5 + kaydirma) % SOYADLAR.length];
      const eklenme = temel.aksiyonGecmisi[0];
      const tarih = `${String(15 + (i % 10)).padStart(2, "0")}.09.2026`;
      const a: AdayEgitmen = {
        ...temel,
        ad,
        soyad,
        cinsiyet: ornekCinsiyet(ad),
        eposta: `${turkceyiSadelestir(ad)}.${turkceyiSadelestir(soyad)}${temel.id}@gmail.com`,
        kulup: KULUPLER[(i * 5 + 1 + kaydirma) % KULUPLER.length],
        mulakatPlanlananTarihi: undefined,
        mulakatPlanlananSaat: undefined,
        mulakatPlanlayanKisi: undefined,
        mulakatPlanlamaTarihi: undefined,
        aksiyonGecmisi: [eklenme],
      };
      const yuklenmedi = (b: Belge): Belge => ({ ad: b.ad, durum: "yuklenmedi" });

      switch (asama) {
        case "ilk_belge":
          return {
            ...a,
            surecDurumu: "ilk_belge_seti_bekleniyor",
            ilkBelgeSeti: a.ilkBelgeSeti.map((b, j) => (j === 0 ? b : yuklenmedi(b))),
            ikinciBelgeSeti: a.ikinciBelgeSeti.map(yuklenmedi),
            ikinciBelgeSetiOnaylandi: false,
            dijitalOryantasyonTamamlandi: false,
          };
        case "ikinci_belge":
          return {
            ...a,
            surecDurumu: "ikinci_belge_seti_bekleniyor",
            ikinciBelgeSeti: a.ikinciBelgeSeti.map((b, j) => (j === 0 ? b : yuklenmedi(b))),
            ikinciBelgeSetiOnaylandi: false,
            dijitalOryantasyonTamamlandi: false,
          };
        case "ik_onayi":
          return {
            ...a,
            surecDurumu: "ik_onayi_bekliyor",
            ikinciBelgeSetiOnaylandi: false,
            aksiyonGecmisi: [
              eklenme,
              { tarih, aksiyon: "İkinci belge seti İK onayına gönderildi", yapan: eklenme.yapan },
            ],
          };
        case "olumlu":
        case "davet_onay":
          // Belge, mülakat ve (davet onayında) davet bilgileri veri tutarlılığı adımında tamamlanır.
          return {
            ...a,
            surecDurumu:
              asama === "olumlu" ? "akademi_egitimine_hazir" : "akademi_daveti_onayi_bekliyor",
            gorusmeSonucu: "Olumlu",
          };
        case "planlanacak":
          return {
            ...a,
            aksiyonGecmisi: [
              eklenme,
              { tarih, aksiyon: "İkinci belge seti onaylandı", yapan: `${IK_ISIMLERI[0]} (İK)` },
            ],
          };
        default: {
          // Mülakatı yapılmış adaylar: planlama bilgisi korunur, sonuç girilir.
          const katilmadi = asama === "katilmadi";
          const kriterler = {
            kisiselOzellikler: 1,
            fizikselGorunum: 0,
            tecrube: 1,
            egitimSertifika: 0,
            egzersizBilgisi: 0,
            tecrubeyiAktarabilme: 0,
          } as const;
          const aciklama = katilmadi ? undefined : "Teknik bilgi ve egzersiz uygulaması yetersiz.";
          return {
            ...a,
            mulakatPlanlananTarihi: "2026-09-29",
            mulakatPlanlananSaat: "11:00",
            mulakatPlanlayanKisi: `${IK_ISIMLERI[0]} (İK)`,
            mulakatPlanlamaTarihi: "22.09.2026",
            surecDurumu: katilmadi
              ? "mulakata_katilmadi"
              : asama === "yeniden"
                ? "ileride_degerlendirilebilir"
                : "reddedildi",
            gorusmeSonucu: katilmadi ? "Katılmadı" : "Olumsuz",
            gorusmeSonucuTarihi: "29.09.2026",
            olumsuzOlmaNedeni: aciklama,
            mulakatDegerlendirmesi: {
              katilmadi,
              kriterler: katilmadi ? {} : kriterler,
              aciklama,
              altiAySonraBasvurabilir: asama === "yeniden",
              giren: `${IK_ISIMLERI[0]} (İK)`,
              tarih: "29.09.2026",
            },
            aksiyonGecmisi: [
              eklenme,
              {
                tarih: "29.09.2026",
                aksiyon: katilmadi
                  ? "Akademi mülakatına katılmadı olarak işaretlendi"
                  : "Akademi mülakatı sonucu Olumsuz (2/6) olarak girildi",
                yapan: `${IK_ISIMLERI[0]} (İK)`,
                detay: aciklama,
              },
            ],
          };
        }
      }
    }
  );
}

/**
 * Akademi listesine yazılmış (davet onaylanmış) örnek akademi eğitmenleri — Akademi
 * detayının ve yoklamanın dolu görünmesi için. `gelmeyenSiralari` verilirse o sıradaki
 * kişiler yoklamada "Gelmedi" işaretlenmiş (akademiye katılmamış) olarak üretilir.
 */
export function akademiKatilimcilariUret(
  baslangicId: number,
  adet: number,
  akademi: { id: string; ad: string; tip: AkademiTipi; baslangicTarihi: string },
  gelmeyenSiralari: number[] = []
): AdayEgitmen[] {
  return Array.from({ length: adet }, (_, i) => {
    const id = String(baslangicId + i);
    const ad = ADLAR[(i * 7 + baslangicId) % ADLAR.length];
    const soyad = SOYADLAR[(i * 5 + baslangicId) % SOYADLAR.length];
    const kmMi = i % 2 === 1;
    const mulakatiYapanRol: MulakatRolu = kmMi ? "Kulüp Müdürü" : "İK";
    const mulakatiYapan = kmMi ? KM_ISIMLERI[i % KM_ISIMLERI.length] : IK_ISIMLERI[0];
    const basvuruTarihi = `${String(1 + (i % 20)).padStart(2, "0")}.08.2026`;
    const gelmedi = gelmeyenSiralari.includes(i);
    return {
      id,
      themisId: themisIdUret(baslangicId + i),
      ad,
      soyad,
      telefon: `0542 ${String(500 + baslangicId + i)} ${String(10 + i)} ${String(30 + i)}`,
      eposta: `${turkceyiSadelestir(ad)}.${turkceyiSadelestir(soyad)}${id}@gmail.com`,
      kulup: KULUPLER[(i * 3 + baslangicId) % KULUPLER.length],
      mulakatiYapanRol,
      mulakatiYapan,
      basvuruTarihi,
      surecDurumu: gelmedi ? "akademiye_katilmadi" : "akademi_egitmeni",
      cinsiyet: ornekCinsiyet(ad),
      gorusmeSonucu: "Olumlu",
      gorusmeSonucuTarihi: "25.08.2026",
      akademiMulakatTipi: akademi.tip,
      ilkBelgeSeti: [
        { ad: "Mülakat Formu", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Aday CV'si", durum: "yuklendi", tarih: basvuruTarihi },
        ...(kmMi
          ? [{ ad: "Bölge Müdürü Onayı", durum: "yuklendi" as const, tarih: basvuruTarihi }]
          : []),
      ],
      ikinciBelgeSeti: [
        { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: basvuruTarihi },
        { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: basvuruTarihi },
      ],
      ikinciBelgeSetiOnaylandi: true,
      vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "01.09.2026" },
      bmOnayliKonaklama: i % 3 === 0 ? "Evet" : "Hayır",
      akademiHesabiAcildiMi: true,
      akademiHesapUserId: `AKD-${baslangicId + i}`,
      akademiDonemiId: akademi.id,
      yonlendirilecekAkademiTarihi: akademi.baslangicTarihi,
      ayakkabiNo: String(37 + (i % 9)),
      ustBeden: BEDENLER[(i + 1) % BEDENLER.length],
      altBeden: BEDENLER[(i + 2) % BEDENLER.length],
      katilmadigiAkademiler: gelmedi
        ? [{ akademiId: akademi.id, akademiAdi: akademi.ad, tarih: akademi.baslangicTarihi }]
        : undefined,
      aksiyonGecmisi: [
        {
          tarih: basvuruTarihi,
          aksiyon: "Aday eğitmen olarak eklendi",
          yapan: `${mulakatiYapan} (${mulakatiYapanRol})`,
        },
        {
          tarih: "01.09.2026",
          aksiyon: `Akademi daveti onaylandı; aday ${akademi.ad} listesine yazıldı`,
          yapan: `${IK_ISIMLERI[0]} (İK)`,
        },
        ...(gelmedi
          ? [
              {
                tarih: akademi.baslangicTarihi,
                aksiyon: `Akademiye katılmadı (${akademi.ad}); Akademi Eğitmeni sözleşmesi kapatıldı, önceki üyelik tipine dönüldü`,
                yapan: `${IK_ISIMLERI[0]} (İK)`,
              },
            ]
          : []),
      ],
    };
  });
}
