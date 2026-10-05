import type { AdayEgitmen, AkademiDonemi, AkademiSinavSonucu, SinavBasligi } from "./types";

/** Puanı bu değerin altında olan ders "kaldı" olarak işaretlenir (PRD 9.1). */
export const GECME_PUANI = 70;

/** Akademi ekibinin kullandığı sınav Excel'inin kolonları (SINAV SONUCU.xlsx). */
export const VARSAYILAN_SINAV_BASLIKLARI: SinavBasligi[] = [
  { grup: "FITNESS TEORİK", ad: "TEORİK SINAV" },
  { grup: "FITNESS TEORİK", ad: "PROGRAM HAZIRLAMA" },
  { grup: "FITNESS UYGULAMA", ad: "DİRENÇ EGZ." },
  { grup: "FITNESS UYGULAMA", ad: "FONKSİYONEL EGZ." },
  { grup: "FITNESS UYGULAMA", ad: "ESNEKLİK" },
  { grup: "FITNESS UYGULAMA", ad: "FIT TEST" },
  { grup: "GX DERSLERİ", ad: "CYCLING" },
  { grup: "GX DERSLERİ", ad: "PILATES" },
  { grup: "GX DERSLERİ", ad: "KUVVET" },
  { grup: "GX DERSLERİ", ad: "CARDIO KICK BOX" },
  { grup: "GX DERSLERİ", ad: "STEP" },
];
export const GENEL_SONUC_GRUBU = "GENEL SONUÇ";
export const VARSAYILAN_GENEL_SONUC_BASLIGI = "PERSONAL TRAINING";

const KIMLIK_KOLONLARI = ["EĞİTMEN ID", "AD SOYAD", "KULÜP"];

const buyuk = (v: string) => v.trim().toLocaleUpperCase("tr-TR").replace(/\s+/g, " ");

/** Ardışık aynı gruptaki başlıkları birleştirir (tablo başlığında colSpan için). */
export function basliklariGrupla(basliklar: SinavBasligi[]) {
  const gruplar: { grup: string; adet: number }[] = [];
  for (const b of basliklar) {
    const son = gruplar.at(-1);
    if (son && son.grup === b.grup) son.adet += 1;
    else gruplar.push({ grup: b.grup, adet: 1 });
  }
  return gruplar;
}

function dosyaIndir(veri: ArrayBuffer, dosyaAdi: string) {
  const blob = new Blob([veri], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Akademi yoklamasında "Gelmedi" işaretlenenler sınava girmez; şablona ve yüklemeye dahil
 * edilmez.
 */
export function sinavaGirecekler(akademi: AkademiDonemi, adaylar: AdayEgitmen[]): AdayEgitmen[] {
  return akademi.kayitlilar
    .filter((id) => akademi.yoklama?.[id] !== "Gelmedi")
    .map((id) => adaylar.find((a) => a.id === id))
    .filter((a): a is AdayEgitmen => !!a);
}

/**
 * Seçilen akademinin sınav sonucu şablonunu indirir: akademiye katılan eğitmenlerin Eğitmen
 * ID, ad soyad ve kulüp bilgileri otomatik doldurulur, puanlar boş bırakılır.
 */
export async function sablonIndir(akademi: AkademiDonemi, adaylar: AdayEgitmen[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sınav Sonucu");
  const basliklar = VARSAYILAN_SINAV_BASLIKLARI;
  const toplamKolon = KIMLIK_KOLONLARI.length + basliklar.length + 1;

  // 1. satır: akademi bilgisi ve grup başlıkları; 2. satır: kolon başlıkları.
  ws.getRow(1).getCell(1).value = `${akademi.ad}\n${akademi.baslangicTarihi} AKADEMİ DÖNEMİ`;
  ws.mergeCells(1, 1, 1, KIMLIK_KOLONLARI.length);
  let kolon = KIMLIK_KOLONLARI.length + 1;
  for (const g of basliklariGrupla(basliklar)) {
    ws.getRow(1).getCell(kolon).value = g.grup;
    if (g.adet > 1) ws.mergeCells(1, kolon, 1, kolon + g.adet - 1);
    kolon += g.adet;
  }
  ws.getRow(1).getCell(toplamKolon).value = GENEL_SONUC_GRUBU;
  [...KIMLIK_KOLONLARI, ...basliklar.map((b) => b.ad), VARSAYILAN_GENEL_SONUC_BASLIGI].forEach(
    (ad, i) => {
      ws.getRow(2).getCell(i + 1).value = ad;
    }
  );

  for (const satir of [1, 2]) {
    ws.getRow(satir).height = satir === 1 ? 32 : 30;
    for (let c = 1; c <= toplamKolon; c++) {
      const cell = ws.getRow(satir).getCell(c);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: satir === 1 ? 11 : 9 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }
  ws.columns = [
    { width: 13 },
    { width: 26 },
    { width: 26 },
    ...basliklar.map(() => ({ width: 11 })),
    { width: 13 },
  ];
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 2 }];

  const kayitlilar = sinavaGirecekler(akademi, adaylar);
  const satirSayisi = kayitlilar.length;
  for (let i = 0; i < satirSayisi; i++) {
    const a = kayitlilar[i];
    const row = ws.getRow(3 + i);
    if (a) {
      row.getCell(1).value = a.themisId;
      row.getCell(2).value = `${a.ad} ${a.soyad}`.toLocaleUpperCase("tr-TR");
      row.getCell(3).value = a.kulup;
    }
    for (let c = 1; c <= toplamKolon; c++) {
      row.getCell(c).border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  // Puan hücreleri 0–100 arası sayı; genel sonuç GEÇTİ / KALDI listesinden seçilir.
  const sonSatir = 2 + satirSayisi;
  const harf = (n: number) => ws.getColumn(n).letter;
  const puanAraligi = `${harf(KIMLIK_KOLONLARI.length + 1)}3:${harf(toplamKolon - 1)}${sonSatir}`;
  for (let r = 3; r <= sonSatir; r++) {
    for (let c = KIMLIK_KOLONLARI.length + 1; c < toplamKolon; c++) {
      ws.getRow(r).getCell(c).dataValidation = {
        type: "whole",
        operator: "between",
        formulae: [0, 100],
        showErrorMessage: true,
        error: "Puan 0 ile 100 arasında olmalı.",
      };
      ws.getRow(r).getCell(c).alignment = { horizontal: "center" };
    }
    ws.getRow(r).getCell(toplamKolon).dataValidation = {
      type: "list",
      formulae: ['"GEÇTİ,KALDI"'],
      showErrorMessage: true,
      error: "GEÇTİ veya KALDI seçin.",
    };
    ws.getRow(r).getCell(toplamKolon).alignment = { horizontal: "center" };
  }
  // 70 altı kırmızı, 70 ve üstü yeşil (akademi ekibinin mevcut Excel'indeki gibi).
  ws.addConditionalFormatting({
    ref: puanAraligi,
    rules: [
      {
        type: "cellIs",
        operator: "lessThan",
        formulae: [GECME_PUANI],
        priority: 1,
        style: {
          fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF8D0D4" } },
          font: { color: { argb: "FF9C0006" } },
        },
      },
      {
        type: "cellIs",
        operator: "between",
        formulae: [GECME_PUANI, 100],
        priority: 2,
        style: {
          fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD3F2D6" } },
          font: { color: { argb: "FF006100" } },
        },
      },
    ],
  });

  const veri = await wb.xlsx.writeBuffer();
  const ad = akademi.ad.replace(/[\s/]+/g, "-");
  dosyaIndir(veri as ArrayBuffer, `akademi-sinav-sonucu-sablonu-${ad}.xlsx`);
}

export type YuklemeHatasi = { satir: number; egitmenId: string; adSoyad: string; sebep: string };

function hucreMetni(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    const o = v as { result?: unknown; richText?: { text: string }[]; text?: string };
    if (o.result !== undefined) return hucreMetni(o.result);
    if (o.richText) return o.richText.map((t) => t.text).join("");
    if (o.text !== undefined) return String(o.text);
  }
  return String(v).trim();
}

/**
 * Yüklenen sınav Excel'ini okur. Her satır Eğitmen ID (Themis ID) ile eşleştirilir; ID'si
 * eşleşmeyen veya hatalı satırlar kaydedilmez, hata listesinde döner (PRD 9.1).
 */
export async function sinavExceliniOku(
  dosya: File,
  akademi: AkademiDonemi,
  adaylar: AdayEgitmen[],
  yukleyen: string,
  tarih: string
): Promise<{
  sonuclar: Omit<AkademiSinavSonucu, "id">[];
  hatalar: YuklemeHatasi[];
  genelHata?: string;
}> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await dosya.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return { sonuclar: [], hatalar: [], genelHata: "Excel'de sayfa bulunamadı." };

  const kolonSayisi = ws.columnCount;
  const ust = (c: number) => buyuk(hucreMetni(ws.getRow(1).getCell(c).value));
  const alt = (c: number) => buyuk(hucreMetni(ws.getRow(2).getCell(c).value));

  let idKolonu = 0;
  let adKolonu = 0;
  let genelKolon = 0;
  const puanKolonlari: { kolon: number; baslik: SinavBasligi }[] = [];
  for (let c = 1; c <= kolonSayisi; c++) {
    const a = alt(c);
    if (!a) continue;
    if (a === "EĞİTMEN ID" || a === "EGITMEN ID") idKolonu = c;
    else if (a === "AD SOYAD") adKolonu = c;
    else if (a === "KULÜP") continue;
    else if (ust(c) === GENEL_SONUC_GRUBU) genelKolon = c;
    else puanKolonlari.push({ kolon: c, baslik: { grup: ust(c), ad: a } });
  }
  if (!idKolonu) {
    return {
      sonuclar: [],
      hatalar: [],
      genelHata: `"EĞİTMEN ID" kolonu bulunamadı. Lütfen Themis'ten indirilen şablonu kullanın.`,
    };
  }
  if (!genelKolon) {
    return { sonuclar: [], hatalar: [], genelHata: `"${GENEL_SONUC_GRUBU}" kolonu bulunamadı.` };
  }

  const sonuclar: Omit<AkademiSinavSonucu, "id">[] = [];
  const hatalar: YuklemeHatasi[] = [];
  const gorulenIdler = new Set<string>();
  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const egitmenId = hucreMetni(row.getCell(idKolonu).value);
    const adSoyad = adKolonu ? hucreMetni(row.getCell(adKolonu).value) : "";
    const genelHam = buyuk(hucreMetni(row.getCell(genelKolon).value));
    const puanHam = puanKolonlari.map((p) => hucreMetni(row.getCell(p.kolon).value));
    // Puanı ve genel sonucu girilmemiş satırlar (şablonun doldurulmamış kısmı, önceden
    // doldurulmuş kimlik bilgileri olsa bile) hata sayılmaz, atlanır.
    if (!genelHam && puanHam.every((p) => !p)) continue;

    const hata = (sebep: string) => hatalar.push({ satir: r, egitmenId, adSoyad, sebep });
    if (!egitmenId) {
      hata("Eğitmen ID boş");
      continue;
    }
    const aday = adaylar.find((a) => a.themisId === egitmenId);
    if (!aday) {
      hata("Eğitmen ID sistemde bulunamadı");
      continue;
    }
    // Yükleme seçilen akademiye bağlıdır; başka akademinin eğitmeni bu dosyadan kaydedilmez.
    if (!akademi.kayitlilar.includes(aday.id)) {
      hata(`Eğitmen ${akademi.ad} akademisine kayıtlı değil`);
      continue;
    }
    if (akademi.yoklama?.[aday.id] === "Gelmedi") {
      hata("Eğitmen akademiye katılmadı (yoklamada gelmedi)");
      continue;
    }
    if (gorulenIdler.has(egitmenId)) {
      hata("Aynı Eğitmen ID dosyada birden fazla kez var");
      continue;
    }
    if (genelHam !== "GEÇTİ" && genelHam !== "KALDI") {
      hata("Genel sonuç GEÇTİ veya KALDI olmalı");
      continue;
    }
    const puanlar = puanHam.map((p) => (p === "" ? null : Number(p.replace(",", "."))));
    const hataliIndeks = puanlar.findIndex(
      (p) => p !== null && (Number.isNaN(p) || p < 0 || p > 100)
    );
    if (hataliIndeks >= 0) {
      hata(`"${puanKolonlari[hataliIndeks].baslik.ad}" puanı 0–100 arasında bir sayı olmalı`);
      continue;
    }
    gorulenIdler.add(egitmenId);
    sonuclar.push({
      egitmenId: aday.id,
      akademiDonemiId: akademi.id,
      basliklar: puanKolonlari.map((p) => p.baslik),
      puanlar,
      genelSonuc: genelHam === "GEÇTİ" ? "Geçti" : "Kaldı",
      genelSonucBasligi: alt(genelKolon) || VARSAYILAN_GENEL_SONUC_BASLIGI,
      yuklemeTarihi: tarih,
      yukleyen,
    });
  }
  return { sonuclar, hatalar };
}
