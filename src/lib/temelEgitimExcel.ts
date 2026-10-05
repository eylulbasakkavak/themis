import { aktifSertifika, TEMEL_BRANS, TEMEL_EGITIM_DERSLERI } from "./sertifika";
import type { AdayEgitmen } from "./types";

/** Toplu temel eğitim girişindeki bir satır (tablo ve Excel aynı yapıyı kullanır). */
export type TemelEgitimSatiri = {
  hedef: number;
  katilmadi: boolean;
  dersler: Record<string, "Geçti" | "Kaldı">;
  mazeret: string;
};

export type TemelEgitimExcelHatasi = { satir: number; kimlik: string; mesaj: string };

const GRUP = "ANADOLU ÜNİVERSİTESİ TEMEL EĞİTİM SINAVI";
const KIMLIK = ["EĞİTMEN ID", "AD SOYAD", "KULÜP", "MEVCUT KADEME", "HEDEF KADEME"];
const SONUC = "SINAV SONUCU";
const KALAN = "KALDIĞI DERS SAYISI";
const MAZERET = "MAZERET";
const buyuk = (s: string) => s.toLocaleUpperCase("tr-TR").trim();
const DERS_BASLIKLARI = TEMEL_EGITIM_DERSLERI.map(buyuk);

function hucreMetni(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "richText" in (v as object)) {
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  if (typeof v === "object" && "result" in (v as object)) {
    return String((v as { result: unknown }).result ?? "");
  }
  return String(v);
}

/** "GEÇTİ", "Geçti", "GECTI" → "Geçti"; "KALDI" → "Kaldı"; "KATILMADI" → "Katılmadı". */
function sonucCoz(metin: string): "Geçti" | "Kaldı" | "Katılmadı" | null {
  const m = buyuk(metin).replace(/İ/g, "I").replace(/Ç/g, "C");
  if (m.startsWith("GEC")) return "Geçti";
  if (m.startsWith("KAL")) return "Kaldı";
  if (m.startsWith("KAT")) return "Katılmadı";
  return null;
}

function dosyaIndir(veri: ArrayBuffer, dosyaAdi: string) {
  const url = URL.createObjectURL(
    new Blob([veri], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Eğitmen listesi dolu temel eğitim şablonu: kimlik kolonları hazır, sınav sonucu ve dersler
 * açılır listeden seçilir, kaldığı ders sayısı Excel formülüyle hesaplanır.
 */
export async function temelEgitimSablonuIndir(egitmenler: AdayEgitmen[], sinavTarihi: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Temel Eğitim Sınavı");
  const basliklar = [...KIMLIK, SONUC, KALAN, ...DERS_BASLIKLARI, MAZERET];
  const n = basliklar.length;
  const ilkDers = KIMLIK.length + 3;
  const sonDers = ilkDers + DERS_BASLIKLARI.length - 1;

  ws.getRow(1).getCell(1).value = `TEMEL EĞİTİM SINAVI · ${sinavTarihi}`;
  ws.mergeCells(1, 1, 1, KIMLIK.length);
  ws.getRow(1).getCell(KIMLIK.length + 1).value = GRUP;
  ws.mergeCells(1, KIMLIK.length + 1, 1, n);
  basliklar.forEach((b, i) => (ws.getRow(2).getCell(i + 1).value = b));
  for (const r of [1, 2]) {
    ws.getRow(r).height = r === 1 ? 24 : 42;
    for (let c = 1; c <= n; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: r === 1 && c > KIMLIK.length ? "FF2F87C8" : "FF000000" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    }
  }

  egitmenler.forEach((a, i) => {
    const r = ws.getRow(i + 3);
    const mevcut = aktifSertifika(a, TEMEL_BRANS)?.kademe ?? 0;
    r.getCell(1).value = a.themisId;
    r.getCell(2).value = `${a.ad} ${a.soyad}`;
    r.getCell(3).value = a.kulup;
    r.getCell(4).value = `${mevcut}. Kademe`;
    r.getCell(5).value = `${Math.min(5, mevcut + 1)}. Kademe`;
    const satir = i + 3;
    const dersAraligi = `${ws.getColumn(ilkDers).letter}${satir}:${ws.getColumn(sonDers).letter}${satir}`;
    r.getCell(KIMLIK.length + 2).value = {
      formula: `IF(COUNTIF(${dersAraligi},"KALDI")=0,"",COUNTIF(${dersAraligi},"KALDI"))`,
    };
    r.getCell(KIMLIK.length + 1).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"GEÇTİ,KALDI,KATILMADI"'],
    };
    for (let c = ilkDers; c <= sonDers; c++) {
      r.getCell(c).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"GEÇTİ,KALDI"'],
      };
    }
  });

  ws.columns = basliklar.map((b, i) => ({
    width: i === 1 ? 24 : i === n - 1 ? 30 : b.length > 14 ? 16 : 13,
  }));
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 2 }];
  dosyaIndir(await wb.xlsx.writeBuffer(), `Temel_Egitim_Sinavi_${sinavTarihi}.xlsx`);
}

/**
 * Doldurulmuş şablonu okur: satırlar Eğitmen ID ile eşleştirilir; boş bırakılan satırlar
 * atlanır, eşleşmeyen veya hatalı satırlar listelenir.
 */
export async function temelEgitimExceliniOku(
  dosya: File,
  egitmenler: AdayEgitmen[]
): Promise<{
  satirlar: Record<string, TemelEgitimSatiri>;
  hatalar: TemelEgitimExcelHatasi[];
  genelHata?: string;
}> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await dosya.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return { satirlar: {}, hatalar: [], genelHata: "Excel'de sayfa bulunamadı." };

  // Başlık satırı: "EĞİTMEN ID" geçen ilk satır (şablonda 2. satır).
  let baslikSatiri = 0;
  const kolon: Record<string, number> = {};
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !baslikSatiri; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const b = buyuk(hucreMetni(ws.getRow(r).getCell(c).value));
      if (b === "EĞİTMEN ID" || b === "EGITMEN ID") baslikSatiri = r;
      if (b) kolon[b] = c;
    }
    if (!baslikSatiri) for (const k of Object.keys(kolon)) delete kolon[k];
  }
  if (!baslikSatiri) {
    return {
      satirlar: {},
      hatalar: [],
      genelHata: `"EĞİTMEN ID" kolonu bulunamadı. Lütfen Themis'ten indirilen şablonu kullanın.`,
    };
  }
  const idKolonu = kolon["EĞİTMEN ID"] ?? kolon["EGITMEN ID"];
  const satirlar: Record<string, TemelEgitimSatiri> = {};
  const hatalar: TemelEgitimExcelHatasi[] = [];

  for (let r = baslikSatiri + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const metin = (b: string) => (kolon[b] ? hucreMetni(row.getCell(kolon[b]).value).trim() : "");
    const kimlik = metin(KIMLIK[0]) || hucreMetni(row.getCell(idKolonu).value).trim();
    const sonucMetni = metin(SONUC);
    const dersler: Record<string, "Geçti" | "Kaldı"> = {};
    TEMEL_EGITIM_DERSLERI.forEach((d, j) => {
      const v = sonucCoz(metin(DERS_BASLIKLARI[j]));
      if (v === "Geçti" || v === "Kaldı") dersler[d] = v;
    });
    const mazeret = metin(MAZERET);
    // Doldurulmamış satır: şablonda olduğu gibi bırakılmış, atlanır.
    if (!sonucMetni && Object.keys(dersler).length === 0 && !mazeret) continue;
    if (!kimlik) continue;
    const aday = egitmenler.find((a) => a.themisId === kimlik);
    if (!aday) {
      hatalar.push({ satir: r, kimlik, mesaj: "Eğitmen ID sistemde bulunamadı" });
      continue;
    }
    const sonuc = sonucCoz(sonucMetni);
    if (sonucMetni && !sonuc) {
      hatalar.push({ satir: r, kimlik, mesaj: `Sınav sonucu tanınmadı: "${sonucMetni}"` });
    }
    const mevcut = aktifSertifika(aday, TEMEL_BRANS)?.kademe ?? 0;
    const hedef = Number(metin(KIMLIK[4]).match(/\d/)?.[0]) || mevcut + 1;
    if (hedef <= mevcut || hedef > 5) {
      hatalar.push({ satir: r, kimlik, mesaj: `Hedef kademe geçersiz (${hedef}. Kademe)` });
      continue;
    }
    const katilmadi = sonuc === "Katılmadı";
    const kalanVar = Object.values(dersler).includes("Kaldı");
    if (sonuc === "Geçti" && kalanVar) {
      hatalar.push({
        satir: r,
        kimlik,
        mesaj: "Sonuç GEÇTİ yazılmış ama kalınan ders var; sonuç derslerden hesaplandı",
      });
    }
    satirlar[aday.id] = { hedef, katilmadi, dersler: katilmadi ? {} : dersler, mazeret };
  }
  return { satirlar, hatalar };
}
