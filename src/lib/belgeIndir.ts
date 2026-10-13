import type { AdayEgitmen } from "./types";

/**
 * Yüklenen belgelerin indirilmesi. Prototipte gerçek dosya saklanmadığından, belgenin adını,
 * adayı ve yükleme tarihini içeren örnek bir PDF üretilir; gerçek sistemde bu çağrı
 * depolanan dosyanın kendisini indirecek.
 */

// PDF'in standart Helvetica fontu (WinAnsi) ğ, ş, ı, İ harflerini içermez; bunlar en yakın
// harfe çevrilir. ç, ö, ü ve büyükleri WinAnsi'de olduğu gibi kalır.
// Uzun ve kısa tire WinAnsi'de 0x97 / 0x96 konumundadır.
const WINANSI_DISI: Record<string, string> = {
  ğ: "g",
  Ğ: "G",
  ş: "s",
  Ş: "S",
  ı: "i",
  İ: "I",
  "—": "\x97",
  "–": "\x96",
};

function pdfMetni(metin: string): string {
  return [...metin]
    .map((c) => WINANSI_DISI[c] ?? c)
    .map((c) => (c.charCodeAt(0) > 255 ? "?" : c))
    .join("")
    .replace(/[\\()]/g, (c) => `\\${c}`);
}

/** Verilen satırlarla tek sayfalık basit bir PDF üretir (ilk satır başlık olarak). */
function pdfOlustur(satirlar: string[]): Uint8Array {
  const [baslik, ...govde] = satirlar;
  const icerik = [
    "BT",
    "/F1 16 Tf",
    "56 780 Td",
    `(${pdfMetni(baslik)}) Tj`,
    "/F1 11 Tf",
    "0 -30 Td",
    ...govde.flatMap((s) => [`(${pdfMetni(s)}) Tj`, "0 -18 Td"]),
    "ET",
  ].join("\n");
  const nesneler = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${icerik.length} >>\nstream\n${icerik}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let pdf = "%PDF-1.4\n";
  const konumlar: number[] = [];
  nesneler.forEach((n, i) => {
    konumlar.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${n}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${nesneler.length + 1}\n0000000000 65535 f \n`;
  pdf += konumlar.map((k) => `${String(k).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${nesneler.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Tüm karakterler 0–255 aralığında olduğundan her karakter tek bayta yazılır.
  return Uint8Array.from(pdf, (c) => c.charCodeAt(0));
}

function dosyaAdiParcasi(metin: string): string {
  return [...metin.toLocaleLowerCase("tr-TR")]
    .map((c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function belgeIndir(
  belge: { ad: string; tarih?: string },
  aday: Pick<AdayEgitmen, "ad" | "soyad" | "themisId">,
  ekSatirlar: string[] = []
) {
  const pdf = pdfOlustur([
    belge.ad,
    `Eğitmen: ${aday.ad} ${aday.soyad} (Themis ID: ${aday.themisId})`,
    `Yüklenme tarihi: ${belge.tarih ?? "—"}`,
    ...(ekSatirlar.length ? ["", ...ekSatirlar] : []),
    "",
    "Themis prototipi — örnek belge.",
  ]);
  const url = URL.createObjectURL(
    new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${aday.themisId}-${dosyaAdiParcasi(belge.ad)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
