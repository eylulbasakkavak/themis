import { sentetikOzelBransMi } from "./egitmenUret";
import { IZIN_SEBEPLERI, LIG_SIRASI, ornekFinalPuanHesapla } from "./karne";
import type {
  EgitmenKarneAlanlari,
  EgitmenKarnesi,
  KarneHaricKaydi,
  KarneSabitlemeKaydi,
  KulupStudyoSayisi,
  MetrikLimitleri,
} from "./types";

const elleGirilenHaricKayitlari: KarneHaricKaydi[] = [
  {
    id: "h1",
    egitmenId: "20",
    donem: "2026-2",
    sebep: "Doğum İzni",
    oncekiLig: "Diamond",
    suresiz: true,
    aktif: true,
    girisTarihi: "01.08.2026",
    giren: "Elif Su (İK)",
  },
  {
    id: "h2",
    egitmenId: "9",
    donem: "2026-1",
    sebep: "Sağlık Durumu",
    oncekiLig: "Gold",
    suresiz: true,
    aktif: false,
    girisTarihi: "10.01.2026",
    donusTarihi: "01.03.2026",
    giren: "Elif Su (İK)",
  },
];

const elleGirilenSabitlemeKayitlari: KarneSabitlemeKaydi[] = [
  {
    id: "sf1",
    egitmenId: "18",
    donem: "2026-2",
    lig: "Silver",
    sebep: "Fraud",
    aktif: true,
    girisTarihi: "10.08.2026",
    giren: "Elif Su (İK)",
  },
  {
    id: "sf2",
    egitmenId: "16",
    donem: "2026-1",
    lig: "Silver",
    sebep: "Fraud",
    aktif: true,
    girisTarihi: "15.01.2026",
    giren: "Mert Aydın (Kulüp Müdürü)",
  },
];

/** Sentetik eğitmenler (21..63) içinden GX/Pilates/Havuz olmayanların indeksleri (0-based, 21'e göreceli). */
const GECMIS_EGITMEN_INDEKSLERI = Array.from({ length: 43 }, (_, i) => i).filter(
  (i) => !sentetikOzelBransMi(i)
);

/** Raporlama sayfasında geçmiş dönem filtresinin dolu görünmesi için kullanılan eski dönemler. */
const GECMIS_DONEMLER = ["2025-2", "2025-1", "2024-2", "2024-1"];
const GECMIS_GIRENLER = ["Elif Su (İK)", "Mert Aydın (Kulüp Müdürü)", "Selin Kaya (İK)"];
const GECMIS_GUNLER = ["05", "10", "15", "20", "25"];

function donemYili(donem: string): string {
  return donem.split("-")[0];
}

function donemBaslangicAyi(donem: string): number {
  return donem.endsWith("-1") ? 1 : 7;
}

/**
 * Raporlama'daki "Karneden Çıkarılan Eğitmenler" ve "Sabitlenen Eğitmenler" raporlarının
 * geçmiş dönemlerde de gerçek veriyle dolu görünmesi için üretilen sentetik geçmiş
 * İzinli hariç kayıtları. Hepsi aktif=false (dönmüş) — güncel karne görünümünü etkilemez.
 */
function sentetikGecmisHaricKayitlariUret(adet: number): KarneHaricKaydi[] {
  const sebepler = IZIN_SEBEPLERI.filter((s) => s !== "Diğer");
  const sonuc: KarneHaricKaydi[] = [];
  for (let i = 0; i < adet; i++) {
    const egitmenIndeksi = GECMIS_EGITMEN_INDEKSLERI[i % GECMIS_EGITMEN_INDEKSLERI.length];
    const donem = GECMIS_DONEMLER[i % GECMIS_DONEMLER.length];
    const ay = donemBaslangicAyi(donem) + (i % 3);
    const yil = donemYili(donem);
    sonuc.push({
      id: `gh${i + 1}`,
      egitmenId: String(21 + egitmenIndeksi),
      donem,
      sebep: sebepler[i % sebepler.length],
      oncekiLig: LIG_SIRASI[i % LIG_SIRASI.length],
      suresiz: true,
      aktif: false,
      girisTarihi: `${GECMIS_GUNLER[i % GECMIS_GUNLER.length]}.${String(ay).padStart(2, "0")}.${yil}`,
      donusTarihi: `${GECMIS_GUNLER[(i + 2) % GECMIS_GUNLER.length]}.${String(ay + 1).padStart(2, "0")}.${yil}`,
      giren: GECMIS_GIRENLER[i % GECMIS_GIRENLER.length],
    });
  }
  return sonuc;
}

/**
 * Sentetik geçmiş Fraud sabitleme kayıtları — az sayıda tutulur, sadece raporun
 * geçmiş dönemlerde de dolu görünmesi içindir. Fraud artık ayrı bir kalıcı liste
 * değil, "Ligi Sabitlenenler" listesinde sebebi Fraud olan normal kayıtlardır.
 */
function sentetikGecmisSabitlemeKayitlariUret(adet: number): KarneSabitlemeKaydi[] {
  const sonuc: KarneSabitlemeKaydi[] = [];
  for (let i = 0; i < adet; i++) {
    // Hariç kayıtlarıyla aynı eğitmenlere denk gelmemesi için indeks kaydırılır.
    const egitmenIndeksi =
      GECMIS_EGITMEN_INDEKSLERI[(i + 20) % GECMIS_EGITMEN_INDEKSLERI.length];
    const donem = GECMIS_DONEMLER[i % GECMIS_DONEMLER.length];
    const ay = donemBaslangicAyi(donem) + (i % 3);
    const yil = donemYili(donem);
    sonuc.push({
      id: `sgf${i + 1}`,
      egitmenId: String(21 + egitmenIndeksi),
      donem,
      lig: "Silver",
      sebep: "Fraud",
      aktif: true,
      girisTarihi: `${GECMIS_GUNLER[i % GECMIS_GUNLER.length]}.${String(ay).padStart(2, "0")}.${yil}`,
      giren: GECMIS_GIRENLER[i % GECMIS_GIRENLER.length],
    });
  }
  return sonuc;
}

export const karneHaricKayitlari: KarneHaricKaydi[] = [
  ...elleGirilenHaricKayitlari,
  ...sentetikGecmisHaricKayitlariUret(35),
];

export const karneSabitlemeKayitlari: KarneSabitlemeKaydi[] = [
  ...elleGirilenSabitlemeKayitlari,
  ...sentetikGecmisSabitlemeKayitlariUret(15),
];

export const kulupStudyoSayilari: KulupStudyoSayisi[] = [
  { id: "ks-atasehir-2", kulup: "Ataşehir", donem: "2026-2", gxSayisi: 5, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-bahcesehir-2", kulup: "Bahçeşehir", donem: "2026-2", gxSayisi: 3, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-bakirkoy-2", kulup: "Bakırköy", donem: "2026-2", gxSayisi: 4, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks1", kulup: "Beşiktaş", donem: "2026-2", gxSayisi: 6, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-bostanci-2", kulup: "Bostancı", donem: "2026-2", gxSayisi: 4, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-etiler-2", kulup: "Etiler", donem: "2026-2", gxSayisi: 3, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-kadikoy-2", kulup: "Kadıköy", donem: "2026-2", gxSayisi: 5, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks2", kulup: "Levent", donem: "2026-2", gxSayisi: 4, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-maslak-2", kulup: "Maslak", donem: "2026-2", gxSayisi: 2, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-sisli-2", kulup: "Şişli", donem: "2026-2", gxSayisi: 3, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks-umraniye-2", kulup: "Ümraniye", donem: "2026-2", gxSayisi: 4, girisTarihi: "01.08.2026", giren: "Elif Su (İK)" },
  { id: "ks3", kulup: "Beşiktaş", donem: "2026-1", gxSayisi: 5, girisTarihi: "05.01.2026", giren: "Elif Su (İK)" },
];

/**
 * Güncel dönem (2026-2) için kasıtlı olarak henüz bir kayıt yok — İK bu dönem için
 * threshold girişini henüz yapmadı senaryosunu simüler. Bu sayede Metrik Limitleri
 * sayfası açıldığında bir önceki dönemin (2026-1) değerleri varsayılan olarak gelir
 * (bkz. oncekiDonem, MetrikLimitleriPage).
 */
export const metrikLimitleri: MetrikLimitleri[] = [
  {
    id: "l2",
    donem: "2026-1",
    fitStartTekil: 160,
    fitStartTotal: 160,
    grupDersiTekil: 950,
    grupDersiTotal: 2300,
    ptTekil: 100,
    ptTotal: 750,
    alanHizmeti: 75,
    npsPozitifCevap: 45,
    calismaSuresi: 2600,
    girisTarihi: "05.01.2026",
    giren: "Elif Su (İK)",
  },
];

const elleGirilenKarneler: EgitmenKarnesi[] = [
  {
    id: "k1",
    egitmenId: "9",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 82,
      grupDersi: 74,
      ptDersi: 65,
      alanHizmeti: 90,
      npsPozitifCevap: 71,
      calismaSuresi: 88,
      kulupMemnuniyeti: 76,
      kulupSadakati: 80,
    },
    finalPuan: 80,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k2",
    egitmenId: "10",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 58,
      grupDersi: 62,
      ptDersi: 70,
      alanHizmeti: 55,
      npsPozitifCevap: 60,
      calismaSuresi: 64,
      kulupMemnuniyeti: 68,
      kulupSadakati: 59,
    },
    finalPuan: 61,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k3",
    egitmenId: "16",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 91,
      grupDersi: 85,
      ptDersi: 72,
      alanHizmeti: 88,
      npsPozitifCevap: 79,
      calismaSuresi: 95,
      kulupMemnuniyeti: 83,
      kulupSadakati: 86,
    },
    finalPuan: 87,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k4",
    egitmenId: "17",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 66,
      grupDersi: 70,
      ptDersi: 58,
      alanHizmeti: 61,
      npsPozitifCevap: 73,
      calismaSuresi: 52,
      kulupMemnuniyeti: 65,
      kulupSadakati: 63,
    },
    finalPuan: 64,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k5",
    egitmenId: "18",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 74,
      grupDersi: 45,
      ptDersi: 92,
      alanHizmeti: 68,
      npsPozitifCevap: 77,
      calismaSuresi: 70,
      kulupMemnuniyeti: 72,
      kulupSadakati: 69,
    },
    finalPuan: 71,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k6",
    egitmenId: "19",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 48,
      grupDersi: 40,
      ptDersi: 55,
      alanHizmeti: 62,
      npsPozitifCevap: 51,
      calismaSuresi: 46,
      kulupMemnuniyeti: 58,
      kulupSadakati: 53,
    },
    finalPuan: 50,
    yuklemeTarihi: "05.08.2026",
  },
  {
    id: "k7",
    egitmenId: "20",
    donem: "2026-2",
    alanlar: {
      olcumProgram: 95,
      grupDersi: 89,
      ptDersi: 80,
      alanHizmeti: 93,
      npsPozitifCevap: 84,
      calismaSuresi: 97,
      kulupMemnuniyeti: 90,
      kulupSadakati: 91,
    },
    finalPuan: 91,
    yuklemeTarihi: "05.08.2026",
  },
];

/** Aynı eğitmenlerin bir önceki dönemi (2026-1) — geçmiş dönem görüntülemesi için. */
const elleGirilenGecmisKarneler: EgitmenKarnesi[] = [
  {
    id: "gk1",
    egitmenId: "9",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 74,
      grupDersi: 68,
      ptDersi: 60,
      alanHizmeti: 84,
      npsPozitifCevap: 66,
      calismaSuresi: 80,
      kulupMemnuniyeti: 70,
      kulupSadakati: 74,
    },
    finalPuan: 73,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk2",
    egitmenId: "10",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 50,
      grupDersi: 55,
      ptDersi: 63,
      alanHizmeti: 48,
      npsPozitifCevap: 54,
      calismaSuresi: 58,
      kulupMemnuniyeti: 60,
      kulupSadakati: 52,
    },
    finalPuan: 54,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk3",
    egitmenId: "16",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 84,
      grupDersi: 79,
      ptDersi: 68,
      alanHizmeti: 81,
      npsPozitifCevap: 73,
      calismaSuresi: 88,
      kulupMemnuniyeti: 77,
      kulupSadakati: 80,
    },
    finalPuan: 80,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk4",
    egitmenId: "17",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 60,
      grupDersi: 64,
      ptDersi: 54,
      alanHizmeti: 56,
      npsPozitifCevap: 68,
      calismaSuresi: 48,
      kulupMemnuniyeti: 60,
      kulupSadakati: 58,
    },
    finalPuan: 59,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk5",
    egitmenId: "18",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 68,
      grupDersi: 50,
      ptDersi: 85,
      alanHizmeti: 62,
      npsPozitifCevap: 70,
      calismaSuresi: 64,
      kulupMemnuniyeti: 66,
      kulupSadakati: 63,
    },
    finalPuan: 64,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk6",
    egitmenId: "19",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 44,
      grupDersi: 36,
      ptDersi: 50,
      alanHizmeti: 58,
      npsPozitifCevap: 47,
      calismaSuresi: 42,
      kulupMemnuniyeti: 54,
      kulupSadakati: 49,
    },
    finalPuan: 47,
    yuklemeTarihi: "05.07.2026",
  },
  {
    id: "gk7",
    egitmenId: "20",
    donem: "2026-1",
    alanlar: {
      olcumProgram: 90,
      grupDersi: 84,
      ptDersi: 76,
      alanHizmeti: 88,
      npsPozitifCevap: 79,
      calismaSuresi: 92,
      kulupMemnuniyeti: 85,
      kulupSadakati: 86,
    },
    finalPuan: 86,
    yuklemeTarihi: "05.07.2026",
  },
];

/**
 * Her eğitmen için bir "seviye" (0-99 arasında geniş yayılımlı bir taban) belirleyip
 * alanları o seviyenin etrafında küçük bir sapmayla üretir. Alanları birbirinden
 * bağımsız üretmek (eski yöntem) ağırlıklı ortalamada ortalamaya doğru sıkışmaya
 * (regression to the mean) yol açıyordu — sonuçta neredeyse herkes Gold/Platinum
 * bandında toplanıyordu. Seviye bazlı üretim, final puanın Silver'dan Diamond'a
 * gerçekçi şekilde yayılmasını sağlar.
 */
function sentetikAlanlarUret(i: number): EgitmenKarneAlanlari {
  const seviye = 20 + ((i * 41) % 80);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const v = (n: number) => clamp(seviye + (((i * n) % 21) - 10));
  return {
    olcumProgram: v(17),
    grupDersi: v(23),
    ptDersi: v(31),
    alanHizmeti: v(11),
    npsPozitifCevap: v(19),
    calismaSuresi: v(13),
    kulupMemnuniyeti: v(29),
    kulupSadakati: v(37),
  };
}

/** Aynı eğitmenlerin bir önceki dönemi (2026-1) için farklı seviyeli, ayrı bir sentetik üretici. */
function sentetikGecmisAlanlarUret(i: number): EgitmenKarneAlanlari {
  const seviye = 15 + ((i * 29 + 13) % 80);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const v = (n: number) => clamp(seviye + (((i * n + 7) % 21) - 10));
  return {
    olcumProgram: v(17),
    grupDersi: v(23),
    ptDersi: v(31),
    alanHizmeti: v(11),
    npsPozitifCevap: v(19),
    calismaSuresi: v(13),
    kulupMemnuniyeti: v(29),
    kulupSadakati: v(37),
  };
}

/** sentetikEgitmenlerUret ile üretilen eğitmenlerin karnesini üretir (GX/Pilates/Havuz hariç). */
function sentetikKarnelerUret(
  baslangicEgitmenId: number,
  adet: number,
  baslangicKarneId: number,
  donem: string,
  alanlarUret: (i: number) => EgitmenKarneAlanlari,
  yuklemeTarihi: string
): EgitmenKarnesi[] {
  const sonuc: EgitmenKarnesi[] = [];
  for (let i = 0; i < adet; i++) {
    if (sentetikOzelBransMi(i)) continue;
    const alanlar = alanlarUret(i);
    sonuc.push({
      id: `k${baslangicKarneId + i}`,
      egitmenId: String(baslangicEgitmenId + i),
      donem,
      alanlar,
      finalPuan: ornekFinalPuanHesapla(alanlar),
      yuklemeTarihi,
    });
  }
  return sonuc;
}

export const egitmenKarneleri: EgitmenKarnesi[] = [
  ...elleGirilenKarneler,
  ...elleGirilenGecmisKarneler,
  ...sentetikKarnelerUret(21, 43, 100, "2026-2", sentetikAlanlarUret, "05.08.2026"),
  ...sentetikKarnelerUret(21, 43, 300, "2026-1", sentetikGecmisAlanlarUret, "05.07.2026"),
];
