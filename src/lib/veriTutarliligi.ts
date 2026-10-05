import { TUM_AKADEMI_TANIMLARI, type AkademiTanimi } from "./akademiData";
import { ILK_BELGE_SETI_ADLARI, IKINCI_BELGE_SETI_ADLARI } from "./belgeKurallari";
import {
  BEDENLER,
  EGITIM_BILGISI_SECENEKLERI,
  FEDERASYON_KADEME_SECENEKLERI,
} from "./egitmenSecenekleri";
import { KULUPLER } from "./kulupler";
import { MULAKAT_KRITERLERI } from "./mulakatDegerlendirme";
import type { AdayEgitmen, AksiyonKaydi, Belge, SurecDurumu } from "./types";

/**
 * Örnek verinin tutarlılığı: her kişi bulunduğu aşamaya gelene kadarki tüm adımların verisine
 * sahip olur. Örn. Akademi Eğitmeni olmuş birinin belgeleri, mülakat sonucu ve davet bilgileri
 * eksiksizdir; eğitmenin akademi geçmişi, vergi levhası ve sözleşmesi tamamdır.
 */

/** Sürecin hangi aşamasına kadar ilerlendiği (yüksek = daha ileri). */
const ASAMA: Record<SurecDurumu, number> = {
  ilk_belge_seti_bekleniyor: 0,
  ikinci_belge_seti_bekleniyor: 1,
  ik_onayi_bekliyor: 2,
  mulakat_sonucu_bekleniyor: 3,
  mulakata_katilmadi: 3,
  reddedildi: 3,
  ileride_degerlendirilebilir: 3,
  akademi_egitimine_hazir: 4,
  akademi_daveti_onayi_bekliyor: 4,
  akademi_egitmeni: 5,
  akademiye_katilmadi: 5,
  surec_sonlandirildi: 5,
  akademiyi_tamamladi: 6,
  egitmen: 7,
  pasif: 7,
};

/* ---------------- tarih yardımcıları ---------------- */

function coz(t?: string): Date | null {
  if (!t) return null;
  const [g, a, y] = t.split(".").map(Number);
  return g && a && y ? new Date(y, a - 1, g) : null;
}
const yaz = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ekle = (d: Date, gun: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + gun);

/* ---------------- akademi sınavı kuralı ---------------- */

/**
 * Bitmiş bir akademideki Akademi Eğitmeni için örnek sınav durumu (data ve sınav sonuçları aynı
 * kuralı kullanır): kimliği 4'e bölünen "Kaldı", 1 kalan "sonuç bekleniyor", diğerleri "Geçti".
 */
export function ornekSinavDurumu(id: string): "Kaldı" | "Bekleniyor" | "Geçti" {
  const n = Number(id) % 4;
  return n === 0 ? "Kaldı" : n === 1 ? "Bekleniyor" : "Geçti";
}

export function akademiBittiMi(akademiId?: string, bugun = new Date()): boolean {
  const t = TUM_AKADEMI_TANIMLARI.find((x) => x.id === akademiId);
  const bitis = coz(t?.bitisTarihi);
  return !!bitis && bitis < bugun;
}

/* ---------------- akademi seçimi ---------------- */

/** İşe girişten önce biten, eğitmenin akademi tipine uyan en son geçmiş akademi. */
function mezunOlunanAkademi(isGiris: Date, kisa: boolean): AkademiTanimi {
  const uygun = TUM_AKADEMI_TANIMLARI.filter(
    (t) =>
      t.tip.startsWith("Kısa") === kisa && (coz(t.bitisTarihi)?.getTime() ?? 0) < isGiris.getTime()
  ).sort((x, y) => coz(y.bitisTarihi)!.getTime() - coz(x.bitisTarihi)!.getTime());
  if (uygun[0]) return uygun[0];
  // Kısa dönem akademiler 2023'te başladı; daha eski eğitmen standart akademiden mezundur.
  return kisa ? mezunOlunanAkademi(isGiris, false) : TUM_AKADEMI_TANIMLARI[0];
}

/** Davet onayı bekleyen aday için kayıt açık, yaklaşan bir akademi. */
function yaklasanAkademi(kisa: boolean, i: number): AkademiTanimi {
  const bugun = new Date();
  const uygun = TUM_AKADEMI_TANIMLARI.filter(
    // Kontenjanı küçük (dolmak üzere) akademiler davet için seçilmez.
    (t) =>
      t.tip.startsWith("Kısa") === kisa &&
      t.kontenjan >= 10 &&
      (coz(t.baslangicTarihi)?.getTime() ?? 0) > bugun.getTime()
  );
  return uygun[i % uygun.length] ?? TUM_AKADEMI_TANIMLARI[TUM_AKADEMI_TANIMLARI.length - 1];
}

/** Mezun olunan geçmiş akademi, işe giriş tarihi ve sözleşme / kulüp geçmişi. */
function akademiyeGoreYerlestir(a: AdayEgitmen, i: number, kisa: boolean): Partial<AdayEgitmen> {
  const gecmis = TUM_AKADEMI_TANIMLARI.filter(
    (t) => (t.id.startsWith("gs") || t.id.startsWith("gk")) && t.tip.startsWith("Kısa") === kisa
  );
  const akademi = gecmis[(i * 7 + Math.floor(i / 4)) % gecmis.length];
  const isGiris = ekle(coz(akademi.bitisTarihi)!, 10 + (i % 12));
  const bugun = new Date();
  const tip = a.istihdamTipi ?? "Tam Zamanlı";
  const sozlesmeGecmisi: AdayEgitmen["sozlesmeGecmisi"] = [];
  const oncekiKulup = KULUPLER[(KULUPLER.indexOf(a.kulup) + 5) % KULUPLER.length];
  // Bir kısmı önce başka bir kulüpte başlamış, sonra rotasyonla şimdiki kulübüne geçmiştir.
  if (i % 3 === 0 && bugun.getTime() - isGiris.getTime() > 400 * 24 * 3600 * 1000) {
    const gecis = new Date((isGiris.getTime() + bugun.getTime()) / 2);
    const gecisGunu = new Date(gecis.getFullYear(), gecis.getMonth(), 1);
    sozlesmeGecmisi.push(
      {
        kulup: oncekiKulup,
        sozlesmeTipi: tip,
        altSozlesmeTipi: a.altSozlesmeTipi,
        baslangicTarihi: yaz(isGiris),
        bitisTarihi: yaz(ekle(gecisGunu, -1)),
        durum: "Sona Erdi",
        bitisNedeni: "Kulüp değişikliği: Rotasyon",
      },
      {
        kulup: a.kulup,
        sozlesmeTipi: tip,
        altSozlesmeTipi: a.altSozlesmeTipi,
        baslangicTarihi: yaz(gecisGunu),
        durum: "Devam Ediyor",
      }
    );
  } else {
    sozlesmeGecmisi.push({
      kulup: a.kulup,
      sozlesmeTipi: tip,
      altSozlesmeTipi: a.altSozlesmeTipi,
      baslangicTarihi: yaz(isGiris),
      durum: "Devam Ediyor",
    });
  }
  return {
    akademiDonemiId: akademi.id,
    akademiMulakatTipi: akademi.tip,
    yonlendirilecekAkademiTarihi: akademi.baslangicTarihi,
    sozlesmeGecmisi,
    // Aksiyon geçmişi yeniden kurulur (eski üretim tarihleri akademiyle uyumsuz olabilir).
    aksiyonGecmisi: a.aksiyonGecmisi.filter((k) => /işten çıkış/i.test(k.aksiyon)),
  };
}

/* ---------------- kayıt tamamlama ---------------- */

// `yenidenTarihle`: eğitmen akademiye göre yeniden yerleştirildiyse eski üretim tarihleri atılır.
const tumuYuklu = (
  adlar: string[],
  mevcut: Belge[],
  tarih: string,
  yenidenTarihle = false
): Belge[] =>
  adlar.map((ad) => {
    const b = mevcut.find((x) => x.ad === ad);
    return b?.durum === "yuklendi" && !yenidenTarihle ? b : { ad, durum: "yuklendi", tarih };
  });

const IK = "Elif Su (İK)";

export function kaydiTutarliHaleGetir(a: AdayEgitmen, i: number): AdayEgitmen {
  const asama = ASAMA[a.surecDurumu];
  const r: AdayEgitmen = { ...a };
  const kisa = !!r.akademiMulakatTipi?.startsWith("Kısa");

  // Eğitmen / pasif: işe giriş tarihine göre mezun olduğu akademi; aday eklenme tarihi ondan önce.
  if (asama >= 7) {
    // Üretilen eğitmenler geçmiş akademilere yayılır; işe giriş mezun olunan akademiden sonradır
    // ve sözleşme geçmişi buna göre kurulur. Elle girilmiş örnek kayıtların tarihleri korunur.
    // Eğitmenlerin yaklaşık dörtte biri kısa dönem akademiden mezundur.
    if (Number(r.id) >= 21) Object.assign(r, akademiyeGoreYerlestir(r, i, kisa || i % 4 === 1));
    const isGiris =
      coz(
        r.sozlesmeGecmisi
          ?.map((s) => s.baslangicTarihi)
          .sort((x, y) => coz(x)!.getTime() - coz(y)!.getTime())[0]
      ) ?? coz(r.basvuruTarihi)!;
    const akademi =
      TUM_AKADEMI_TANIMLARI.find((t) => t.id === r.akademiDonemiId && Number(r.id) >= 21) ??
      mezunOlunanAkademi(isGiris, kisa);
    r.akademiMulakatTipi = akademi.tip;
    r.akademiDonemiId = akademi.id;
    r.yonlendirilecekAkademiTarihi = akademi.baslangicTarihi;
    r.basvuruTarihi = yaz(ekle(coz(akademi.baslangicTarihi)!, -56 - (i % 20)));
    if (!r.sozlesmeGecmisi?.length) {
      r.sozlesmeGecmisi = [
        {
          kulup: r.kulup,
          sozlesmeTipi: r.istihdamTipi ?? "Tam Zamanlı",
          altSozlesmeTipi: r.altSozlesmeTipi,
          baslangicTarihi: yaz(isGiris),
          durum: "Devam Ediyor",
        },
      ];
    }
    r.istihdamTipi ??= "Tam Zamanlı";
    // İşten çıkmış eğitmen akademiyi zaten bitirmiştir.
    if (r.surecDurumu === "pasif") {
      if (!r.fesihSekli || r.fesihSekli === "Akademiyi Bitirmeden Ayrılma") {
        r.fesihSekli = "Eğitmen Tarafından Fesih";
      }
      r.fesihNedeni ??= ["Başka bir kulüple anlaştı", "Şehir değişikliği", "Kişisel nedenler"][
        i % 3
      ];
      r.cikisTarihi ??= "15.09.2026";
      r.sozlesmeGecmisi = r.sozlesmeGecmisi.map((k) =>
        k.durum === "Devam Ediyor"
          ? { ...k, durum: "Sona Erdi", bitisTarihi: r.cikisTarihi, bitisNedeni: r.fesihSekli }
          : k
      );
    }
  }

  // Mülakatı olumlu sonuçlanmış aday için mülakat (eklenmeden ~16 gün sonra) bugünden sonraya
  // düşmesin: eklenme tarihi geriye alınır, mevcut "eklendi" kaydı da buna uyar.
  if (asama === 4) {
    const bugun = new Date();
    const eski = r.basvuruTarihi;
    if ((coz(eski)?.getTime() ?? 0) > ekle(bugun, -20).getTime()) {
      r.basvuruTarihi = yaz(ekle(bugun, -30 - (i % 10)));
      r.aksiyonGecmisi = r.aksiyonGecmisi.map((k) =>
        k.tarih === eski && /eklendi/i.test(k.aksiyon) ? { ...k, tarih: r.basvuruTarihi } : k
      );
    }
  }

  // Belge tarihleri akademi takvimiyle çelişiyorsa (eğitmenler ya da belgeleri akademiden sonra
  // görünen akademi eğitmenleri) belgeler eklenme tarihine göre yeniden tarihlenir.
  const akademiIlkGun = coz(
    TUM_AKADEMI_TANIMLARI.find((t) => t.id === r.akademiDonemiId)?.baslangicTarihi
  );
  const yenidenTarihle =
    asama >= 7 ||
    (asama >= 5 &&
      !!akademiIlkGun &&
      [...r.ilkBelgeSeti, ...r.ikinciBelgeSeti, ...(r.vergiLevhasi ? [r.vergiLevhasi] : [])].some(
        (b) => (coz(b.tarih)?.getTime() ?? 0) >= akademiIlkGun.getTime()
      ));
  const eklenme = coz(r.basvuruTarihi) ?? new Date(2026, 8, 1);
  const g = (gun: number) => ekle(eklenme, gun);

  // Mülakat formu (birinci belge setiyle birlikte doldurulur).
  if (asama >= 1) {
    r.cinsiyet ??= i % 2 === 0 ? "Erkek" : "Kadın";
    r.egitimBilgisi ??= EGITIM_BILGISI_SECENEKLERI[(i * 3) % EGITIM_BILGISI_SECENEKLERI.length];
    // İşe alınan eğitmenin en az Fitness 1. kademe belgesi vardır (PRD 12.1).
    r.federasyonKademeDurumu ??=
      asama >= 5
        ? FEDERASYON_KADEME_SECENEKLERI[2 + (i % 4)]
        : FEDERASYON_KADEME_SECENEKLERI[i % 6];
    r.antrenorlukGecmisiVarMi ??= i % 3 === 0 ? "Hayır" : "Evet";
    r.akademiMulakatTipi ??= "Standart Akademi Mülakatı (4 Hafta)";
    r.formKulup ??= r.kulup;
    r.formTarih ??= iso(g(2));
    r.formAdSoyad ??= `${r.ad} ${r.soyad}`;
    r.ilkBelgeSeti = tumuYuklu(
      ILK_BELGE_SETI_ADLARI[r.mulakatiYapanRol],
      r.ilkBelgeSeti,
      yaz(g(2)),
      yenidenTarihle
    );
  }
  if (asama >= 2) {
    r.ikinciBelgeSeti = tumuYuklu(
      IKINCI_BELGE_SETI_ADLARI,
      r.ikinciBelgeSeti,
      yaz(g(9)),
      yenidenTarihle
    );
    r.dijitalOryantasyonTamamlandi = true;
  }
  if (asama >= 3) {
    r.ikinciBelgeSetiOnaylandi = true;
    r.ikinciBelgeSetiRedSebebi = undefined;
  }

  // Akademi mülakatı: planlanmış ve (aşama 4+) olumlu sonuçlanmış.
  const mulakatGunu = g(16);
  if (asama >= 4 || r.gorusmeSonucu) {
    r.mulakatPlanlananTarihi ??= iso(mulakatGunu);
    r.mulakatPlanlananSaat ??= `${10 + (i % 6)}:00`;
    r.mulakatPlanlayanKisi ??= IK;
    r.mulakatPlanlamaTarihi ??= yaz(g(11));
  }
  // Akademiye girmiş birinin mülakatı akademiden önce yapılmıştır.
  const akademiBaslangic = coz(
    TUM_AKADEMI_TANIMLARI.find((t) => t.id === r.akademiDonemiId)?.baslangicTarihi
  );
  if (
    asama >= 5 &&
    akademiBaslangic &&
    (coz(r.gorusmeSonucuTarihi)?.getTime() ?? 0) >= akademiBaslangic.getTime()
  ) {
    r.mulakatPlanlananTarihi = iso(mulakatGunu);
    r.mulakatPlanlamaTarihi = yaz(g(11));
    r.gorusmeSonucuTarihi = yaz(mulakatGunu);
    if (r.mulakatDegerlendirmesi) {
      r.mulakatDegerlendirmesi = { ...r.mulakatDegerlendirmesi, tarih: r.gorusmeSonucuTarihi };
    }
  }
  if (asama >= 4) {
    r.gorusmeSonucu = "Olumlu";
    r.gorusmeSonucuTarihi ??= yaz(mulakatGunu);
    const sifirSayisi = i % 3; // 4, 5 ya da 6 kriter karşılanır
    r.mulakatDegerlendirmesi ??= {
      katilmadi: false,
      kriterler: Object.fromEntries(
        MULAKAT_KRITERLERI.map((k, j) => [k.anahtar, j < 6 - sifirSayisi ? 1 : 0])
      ),
      kisaAkademiUygun: kisa ? true : undefined,
      giren: IK,
      tarih: r.gorusmeSonucuTarihi,
    };
  }

  // Akademiye davet bilgileri: davet onayı bekleyen ve daha ileri aşamadakilerde eksiksiz.
  const davetGirildi = asama >= 5 || r.surecDurumu === "akademi_daveti_onayi_bekliyor";
  if (davetGirildi) {
    if (!r.akademiDonemiId) {
      const akademi = yaklasanAkademi(kisa, i);
      r.akademiDonemiId = akademi.id;
      r.yonlendirilecekAkademiTarihi = akademi.baslangicTarihi;
    }
    const davetTarihi = yaz(ekle(coz(r.yonlendirilecekAkademiTarihi) ?? g(30), -14));
    r.vergiLevhasi = {
      ad: "Vergi Levhası",
      durum: "yuklendi",
      tarih: yenidenTarihle ? davetTarihi : (r.vergiLevhasi?.tarih ?? davetTarihi),
    };
    r.bmOnayliKonaklama ??= i % 3 === 0 ? "Evet" : "Hayır";
    r.akademiHesabiAcildiMi = true;
    r.akademiHesapUserId ??= `AKD-${r.themisId}`;
    r.ayakkabiNo ??= String(37 + (i % 9));
    r.ustBeden ??= r.beden ?? BEDENLER[(i + 1) % BEDENLER.length];
    r.altBeden ??= r.beden ?? BEDENLER[(i + 2) % BEDENLER.length];
  }

  // Kişisel bilgiler (akademiye girişte alınan, başka sistemde tutulmayan bilgiler).
  if (asama >= 5) {
    r.dogumTarihi ??= iso(new Date(1990 + (i % 12), (i * 5) % 12, 1 + (i % 27)));
    r.macCampusId ??= `MC-${r.themisId}`;
    if (r.egitimBilgisi?.includes("Mezun"))
      r.mezuniyetTarihi ??= iso(new Date(2012 + (i % 12), 5, 20));
  }

  r.aksiyonGecmisi = zamanCizelgesi(r, asama, i);
  return r;
}

/* ---------------- aksiyon geçmişi ---------------- */

/** Aşamanın gerektirdiği adımlar geçmişte yoksa tarihleriyle eklenir; liste tarihe göre sıralanır. */
function zamanCizelgesi(a: AdayEgitmen, asama: number, i: number): AksiyonKaydi[] {
  const eklenme = coz(a.basvuruTarihi) ?? new Date(2026, 8, 1);
  const g = (gun: number) => yaz(ekle(eklenme, gun));
  const ekleyen = `${a.mulakatiYapan} (${a.mulakatiYapanRol})`;
  const akademi = TUM_AKADEMI_TANIMLARI.find((t) => t.id === a.akademiDonemiId);
  const adimlar: { anahtar: RegExp; kayit: AksiyonKaydi; gerekli: boolean }[] = [
    {
      anahtar: /eklendi/i,
      kayit: { tarih: a.basvuruTarihi, aksiyon: "Aday eğitmen olarak eklendi", yapan: ekleyen },
      gerekli: true,
    },
    {
      anahtar: /birinci belge|ilk belge|mülakat formu/i,
      kayit: {
        tarih: g(2),
        aksiyon: "Mülakat formu dolduruldu, birinci belge seti tamamlandı",
        yapan: ekleyen,
      },
      gerekli: asama >= 1,
    },
    {
      anahtar: /ikinci belge|belge seti İK tarafından onaylandı|belge seti onaylandı/i,
      kayit: { tarih: g(10), aksiyon: "İkinci belge seti İK tarafından onaylandı", yapan: IK },
      gerekli: asama >= 3,
    },
    {
      anahtar: /planlandı/i,
      kayit: {
        tarih: a.mulakatPlanlamaTarihi ?? g(11),
        aksiyon: `Akademi mülakatı ${a.mulakatPlanlananTarihi?.split("-").reverse().join(".") ?? ""} tarihine planlandı`,
        yapan: IK,
      },
      gerekli: asama >= 4,
    },
    {
      anahtar: /mülakatı sonucu|mülakat sonucu/i,
      kayit: {
        tarih: a.gorusmeSonucuTarihi ?? g(16),
        aksiyon: `Akademi mülakatı sonucu Olumlu (${6 - (i % 3)}/6) olarak girildi`,
        yapan: IK,
      },
      gerekli: asama >= 4,
    },
    {
      anahtar: /davet/i,
      kayit: {
        tarih: akademi ? yaz(ekle(coz(akademi.baslangicTarihi)!, -10)) : g(25),
        aksiyon: `Akademi daveti onaylandı; aday ${akademi?.ad ?? "akademi"} listesine yazıldı, Akademi Eğitmeni sözleşmesi tanımlandı`,
        yapan: IK,
      },
      gerekli: asama >= 5,
    },
    {
      anahtar: /sınav/i,
      kayit: {
        tarih: akademi?.bitisTarihi ?? g(60),
        aksiyon: "Akademi sınav sonuçları yüklendi: Geçti",
        yapan: IK,
      },
      gerekli: asama >= 6,
    },
    {
      anahtar: /Eğitmen statüsüne/i,
      kayit: {
        tarih: a.sozlesmeGecmisi?.[0]?.baslangicTarihi ?? g(70),
        aksiyon: `Eğitmen statüsüne geçirildi (${a.altSozlesmeTipi ?? a.istihdamTipi ?? "Tam Zamanlı"}); Flyby'da Eğitmen Self-Employee sözleşmesi tanımlandı`,
        yapan: IK,
      },
      gerekli: asama >= 7,
    },
  ];
  const mevcut = a.aksiyonGecmisi.filter((k) => k.tarih !== "Bugün");
  const eksikler = adimlar
    .filter((ad) => ad.gerekli && !mevcut.some((k) => ad.anahtar.test(k.aksiyon)))
    .map((ad) => ad.kayit);
  return [...mevcut, ...eksikler].sort(
    (x, y) => (coz(x.tarih)?.getTime() ?? 0) - (coz(y.tarih)?.getTime() ?? 0)
  );
}

/** Aynı ad soyadın birden fazla kişide görünmemesi için tekrar edenlerin soyadı değiştirilir. */
export function adlariTeklestir(liste: AdayEgitmen[], soyadlar: string[]): AdayEgitmen[] {
  const kullanilan = new Set<string>();
  return liste.map((a, i) => {
    let soyad = a.soyad;
    let k = 0;
    while (kullanilan.has(`${a.ad} ${soyad}`) && k < soyadlar.length) {
      soyad = soyadlar[(i + k * 7) % soyadlar.length];
      k++;
    }
    kullanilan.add(`${a.ad} ${soyad}`);
    return soyad === a.soyad
      ? a
      : { ...a, soyad, formAdSoyad: a.formAdSoyad && `${a.ad} ${soyad}` };
  });
}
