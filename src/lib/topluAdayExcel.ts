import { KULUPLER } from "./kulupler";
import { tekrarBasvuruUyarisi, telefonAnahtari } from "./mulakatDegerlendirme";
import type { AdayEgitmen } from "./types";

/** Toplu Aday Ekle şablonunun kolonları; e-posta toplu eklemede istenmez. */
export const ADAY_SABLON_KOLONLARI = [
  "TELEFON NO",
  "AD",
  "SOYAD",
  "POTANSİYEL KULÜP",
];

/** Şablonda veri doğrulaması (kulüp listesi) uygulanan boş satır sayısı. */
const SABLON_SATIR_SAYISI = 200;

const buyuk = (v: string) =>
  v.trim().toLocaleUpperCase("tr-TR").replace(/\s+/g, " ");

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

/** Boş Toplu Aday Ekle şablonunu indirir; kulüp kolonu Themis'teki kulüp listesinden seçilir. */
export async function adaySablonuIndir() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Adaylar");
  // Kulüp listesi ayrı (gizli) sayfada tutulur; açılır liste buradan beslenir.
  const liste = wb.addWorksheet("Kulüpler", { state: "veryHidden" });
  KULUPLER.forEach((k, i) => {
    liste.getCell(i + 1, 1).value = k;
  });

  const baslik = ws.getRow(1);
  ADAY_SABLON_KOLONLARI.forEach((ad, i) => {
    const cell = baslik.getCell(i + 1);
    cell.value = ad;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
  baslik.height = 24;
  ws.columns = [{ width: 18 }, { width: 20 }, { width: 20 }, { width: 22 }];
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (let r = 2; r <= SABLON_SATIR_SAYISI + 1; r++) {
    const row = ws.getRow(r);
    // Telefon metin olarak tutulur; aksi halde Excel baştaki 0'ı siler.
    row.getCell(1).numFmt = "@";
    row.getCell(4).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`Kulüpler!$A$1:$A$${KULUPLER.length}`],
      showErrorMessage: true,
      error: "Listeden bir kulüp seçin.",
    };
  }

  const veri = await wb.xlsx.writeBuffer();
  dosyaIndir(veri as ArrayBuffer, "toplu-aday-ekle-sablonu.xlsx");
}

export type OkunanAday = {
  telefon: string;
  ad: string;
  soyad: string;
  kulup: string;
  // Aynı telefonla daha önce olumsuz sonuçlanmış kayıt varsa (PRD 5.7) — ekleme engellenmez.
  uyari?: string;
};

export type AdayYuklemeHatasi = {
  satir: number;
  adSoyad: string;
  sebep: string;
};

function hucreMetni(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    const o = v as {
      result?: unknown;
      richText?: { text: string }[];
      text?: string;
    };
    if (o.result !== undefined) return hucreMetni(o.result);
    if (o.richText) return o.richText.map((t) => t.text).join("");
    if (o.text !== undefined) return String(o.text);
  }
  return String(v).trim();
}

/**
 * Doldurulan Toplu Aday Ekle şablonunu okur. Kolonlar başlık adına göre bulunur; tüm alanlar
 * zorunludur. Hatalı satırlar eklenmez, hata listesinde döner.
 */
export async function adayExceliniOku(
  dosya: File,
  adaylar: AdayEgitmen[],
): Promise<{
  adaylar: OkunanAday[];
  hatalar: AdayYuklemeHatasi[];
  genelHata?: string;
}> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await dosya.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws)
    return {
      adaylar: [],
      hatalar: [],
      genelHata: "Excel'de sayfa bulunamadı.",
    };

  const kolonlar = new Map<string, number>();
  for (let c = 1; c <= ws.columnCount; c++) {
    const ad = buyuk(hucreMetni(ws.getRow(1).getCell(c).value));
    if (ad) kolonlar.set(ad, c);
  }
  const eksik = ADAY_SABLON_KOLONLARI.filter((k) => !kolonlar.has(k));
  if (eksik.length) {
    return {
      adaylar: [],
      hatalar: [],
      genelHata: `${eksik.map((k) => `"${k}"`).join(", ")} kolonu bulunamadı. Lütfen Themis'ten indirilen şablonu kullanın.`,
    };
  }

  const kulupBul = (v: string) => KULUPLER.find((k) => buyuk(k) === buyuk(v));
  const okunan: OkunanAday[] = [];
  const hatalar: AdayYuklemeHatasi[] = [];
  const gorulenTelefonlar = new Set<string>();
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const deger = (k: string) =>
      hucreMetni(row.getCell(kolonlar.get(k)!).value);
    const telefon = deger("TELEFON NO");
    const ad = deger("AD");
    const soyad = deger("SOYAD");
    const kulupHam = deger("POTANSİYEL KULÜP");
    // Tamamen boş satırlar (şablonun doldurulmamış kısmı) atlanır.
    if (!telefon && !ad && !soyad && !kulupHam) continue;

    const hata = (sebep: string) =>
      hatalar.push({ satir: r, adSoyad: `${ad} ${soyad}`.trim(), sebep });
    const bosAlanlar = [
      ["Telefon No", telefon],
      ["Ad", ad],
      ["Soyad", soyad],
      ["Potansiyel Kulüp", kulupHam],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (bosAlanlar.length) {
      hata(`Zorunlu alan boş: ${bosAlanlar.join(", ")}`);
      continue;
    }
    const anahtar = telefonAnahtari(telefon);
    if (anahtar.length !== 10) {
      hata("Telefon numarası geçersiz (10 haneli olmalı, örn. 0532 123 45 67)");
      continue;
    }
    const kulup = kulupBul(kulupHam);
    if (!kulup) {
      hata(`"${kulupHam}" Themis'te kayıtlı bir kulüp değil`);
      continue;
    }
    if (gorulenTelefonlar.has(anahtar)) {
      hata("Aynı telefon numarası dosyada birden fazla kez var");
      continue;
    }
    gorulenTelefonlar.add(anahtar);
    const oncekiOlumsuz = adaylar.find(
      (a) =>
        telefonAnahtari(a.telefon) === anahtar && a.gorusmeSonucu === "Olumsuz",
    );
    okunan.push({
      telefon,
      ad,
      soyad,
      kulup,
      uyari:
        (oncekiOlumsuz && tekrarBasvuruUyarisi(oncekiOlumsuz)) || undefined,
    });
  }
  return { adaylar: okunan, hatalar };
}
