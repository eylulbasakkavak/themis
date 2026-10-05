"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Columns3,
  Download,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { tarihCoz } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import {
  ALT_SOZLESME_TIPLERI,
  CINSIYET_SECENEKLERI,
  EGITIM_BILGISI_SECENEKLERI,
  FESIH_SEKLI_SECENEKLERI,
  ISTIHDAM_TIPLERI,
} from "@/lib/egitmenSecenekleri";
import { iseGirisTarihi } from "@/lib/egitmenGecis";
import { KULUPLER } from "@/lib/kulupler";
import { fitnessSertifikasi } from "@/lib/sertifika";
import { onayliIhtarlar } from "@/lib/sertifikaOnay";
import { UYELIK_TIPLERI, uyelikTipi } from "@/lib/status";
import type { AdayEgitmen, AkademiDonemi } from "@/lib/types";

type Baglam = { donemi: (a: AdayEgitmen) => AkademiDonemi | undefined };

/* ------------------------------------------------------------------ */
/* Ortak değerler                                                      */
/* ------------------------------------------------------------------ */

const KADEME_SECENEKLERI = ["1. Kademe", "2. Kademe", "3. Kademe", "4. Kademe", "5. Kademe"];

const kademe = (a: AdayEgitmen) => {
  const f = fitnessSertifikasi(a);
  return f ? `${f.kademe}. Kademe` : "";
};

const mulakatSonucu = (a: AdayEgitmen) =>
  a.gorusmeSonucu === "Olumlu" || a.gorusmeSonucu === "Olumsuz" || a.gorusmeSonucu === "Katılmadı"
    ? a.gorusmeSonucu
    : "";

const ihtarVarMi = (a: AdayEgitmen) => onayliIhtarlar(a).length > 0;

/* ------------------------------------------------------------------ */
/* Kolonlar                                                            */
/* ------------------------------------------------------------------ */

type Kolon = { anahtar: string; baslik: string; deger: (a: AdayEgitmen, b: Baglam) => string };

const KOLONLAR: Kolon[] = [
  { anahtar: "id", baslik: "Eğitmen ID", deger: (a) => a.themisId },
  { anahtar: "adSoyad", baslik: "Ad Soyad", deger: (a) => `${a.ad} ${a.soyad}` },
  { anahtar: "kulup", baslik: "Kulüp", deger: (a) => a.kulup },
  { anahtar: "telefon", baslik: "Telefon", deger: (a) => a.telefon },
  { anahtar: "sozlesmeTipi", baslik: "Sözleşme Tipi", deger: (a) => a.istihdamTipi ?? "" },
  {
    anahtar: "altSozlesmeTipi",
    baslik: "Alt Sözleşme Tipi",
    deger: (a) => a.altSozlesmeTipi ?? "",
  },
  { anahtar: "kademe", baslik: "Kademe Durumu", deger: kademe },
  { anahtar: "iseGiris", baslik: "İşe Giriş Tarihi", deger: iseGirisTarihi },
  { anahtar: "istenCikis", baslik: "İşten Çıkış Tarihi", deger: (a) => a.cikisTarihi ?? "" },
  {
    anahtar: "akademiBaslangic",
    baslik: "Akademi Başlangıç Tarihi",
    deger: (a, b) => b.donemi(a)?.baslangicTarihi ?? "",
  },
  {
    anahtar: "akademiBitis",
    baslik: "Akademi Bitiş Tarihi",
    deger: (a, b) => b.donemi(a)?.bitisTarihi ?? "",
  },
  { anahtar: "statu", baslik: "Statü", deger: (a) => uyelikTipi(a.surecDurumu) },
  {
    anahtar: "durum",
    baslik: "Eğitmen Durumu",
    deger: (a) => (uyelikTipi(a.surecDurumu) === "Pasif Eğitmen" ? "Pasif" : "Aktif"),
  },
  { anahtar: "mulakatSonucu", baslik: "Mülakat Sonucu", deger: mulakatSonucu },
  { anahtar: "tckn", baslik: "TCKN", deger: (a) => a.tcKimlikNo ?? "" },
  { anahtar: "cinsiyet", baslik: "Cinsiyet", deger: (a) => a.cinsiyet ?? "" },
  { anahtar: "eposta", baslik: "E-posta", deger: (a) => a.eposta ?? "" },
  { anahtar: "egitim", baslik: "Eğitim", deger: (a) => a.egitimBilgisi ?? "" },
  { anahtar: "fesihSekli", baslik: "Fesih Şekli", deger: (a) => a.fesihSekli ?? "" },
  { anahtar: "fesihNedeni", baslik: "Fesih Nedeni", deger: (a) => a.fesihNedeni ?? "" },
  {
    anahtar: "ihtar",
    baslik: "İhtar Durumu",
    deger: (a) => (ihtarVarMi(a) ? `Var (${onayliIhtarlar(a).length})` : "Yok"),
  },
  {
    anahtar: "artiBir",
    baslik: "Eğitmen +1 Kullanımı",
    deger: (a) => (a.artiBirKullanimlari ?? []).map((u) => `${u.uyeId} - ${u.uyeAdi}`).join("; "),
  },
];

const VARSAYILAN_KOLONLAR = [
  "id",
  "adSoyad",
  "kulup",
  "statu",
  "sozlesmeTipi",
  "kademe",
  "iseGiris",
];

/* ------------------------------------------------------------------ */
/* Filtreler                                                           */
/* ------------------------------------------------------------------ */

type TarihAraligi = { bas: string; bit: string };
type FiltreDegeri = string[] | TarihAraligi | string;

type FiltreAlani =
  | {
      anahtar: string;
      baslik: string;
      tip: "coklu";
      secenekler: readonly string[];
      deger: (a: AdayEgitmen, b: Baglam) => string;
    }
  | {
      anahtar: string;
      baslik: string;
      tip: "tarih";
      // Kişinin ilgili tarihi seçilen aralığa düşüyor mu.
      uyar: (a: AdayEgitmen, b: Baglam, bas: Date | null, bit: Date | null) => boolean;
    }
  | { anahtar: string; baslik: string; tip: "metin"; deger: (a: AdayEgitmen) => string };

/** Boş bırakılan uç sınırsız sayılır. */
function aralikta(t: Date | null, bas: Date | null, bit: Date | null): boolean {
  return !!t && (!bas || t >= bas) && (!bit || t <= bit);
}

const FILTRE_ALANLARI: FiltreAlani[] = [
  {
    anahtar: "statu",
    baslik: "Statü",
    tip: "coklu",
    secenekler: UYELIK_TIPLERI,
    deger: (a) => uyelikTipi(a.surecDurumu),
  },
  { anahtar: "kulup", baslik: "Kulüp", tip: "coklu", secenekler: KULUPLER, deger: (a) => a.kulup },
  {
    anahtar: "sozlesmeTipi",
    baslik: "Sözleşme Tipi",
    tip: "coklu",
    secenekler: ISTIHDAM_TIPLERI,
    deger: (a) => a.istihdamTipi ?? "",
  },
  {
    anahtar: "altSozlesmeTipi",
    baslik: "Alt Sözleşme Tipi",
    tip: "coklu",
    secenekler: ALT_SOZLESME_TIPLERI,
    deger: (a) => a.altSozlesmeTipi ?? "",
  },
  {
    anahtar: "kademe",
    baslik: "Kademe Durumu",
    tip: "coklu",
    secenekler: KADEME_SECENEKLERI,
    deger: kademe,
  },
  {
    // İki tarih arasında işe girenler.
    anahtar: "iseGiris",
    baslik: "İşe Giriş Tarihi",
    tip: "tarih",
    uyar: (a, _, bas, bit) => aralikta(tarihCoz(iseGirisTarihi(a)), bas, bit),
  },
  {
    // İki tarih arasında işten çıkanlar.
    anahtar: "istenCikis",
    baslik: "İşten Çıkış Tarihi",
    tip: "tarih",
    uyar: (a, _, bas, bit) => aralikta(a.cikisTarihi ? tarihCoz(a.cikisTarihi) : null, bas, bit),
  },
  {
    // Akademi dönemi seçilen aralıkla kesişenler (aralıkta akademide bulunanlar).
    anahtar: "akademi",
    baslik: "Akademi Tarihi",
    tip: "tarih",
    uyar: (a, b, bas, bit) => {
      const d = b.donemi(a);
      if (!d) return false;
      const ilk = tarihCoz(d.baslangicTarihi);
      const son = tarihCoz(d.bitisTarihi);
      return !!ilk && (!bit || ilk <= bit) && (!bas || !son || son >= bas);
    },
  },
  {
    anahtar: "mulakatSonucu",
    baslik: "Mülakat Sonucu",
    tip: "coklu",
    secenekler: ["Olumlu", "Olumsuz", "Katılmadı"],
    deger: mulakatSonucu,
  },
  {
    anahtar: "cinsiyet",
    baslik: "Cinsiyet",
    tip: "coklu",
    secenekler: CINSIYET_SECENEKLERI,
    deger: (a) => a.cinsiyet ?? "",
  },
  {
    anahtar: "egitim",
    baslik: "Eğitim",
    tip: "coklu",
    secenekler: EGITIM_BILGISI_SECENEKLERI,
    deger: (a) => a.egitimBilgisi ?? "",
  },
  {
    anahtar: "fesihSekli",
    baslik: "Fesih Şekli",
    tip: "coklu",
    secenekler: FESIH_SEKLI_SECENEKLERI,
    deger: (a) => a.fesihSekli ?? "",
  },
  {
    anahtar: "fesihNedeni",
    baslik: "Fesih Nedeni",
    tip: "metin",
    deger: (a) => a.fesihNedeni ?? "",
  },
  {
    anahtar: "ihtar",
    baslik: "İhtar Durumu",
    tip: "coklu",
    secenekler: ["Var", "Yok"],
    deger: (a) => (ihtarVarMi(a) ? "Var" : "Yok"),
  },
];

const alanBul = (anahtar: string) => FILTRE_ALANLARI.find((f) => f.anahtar === anahtar)!;

const kucukHarf = (s: string) => s.toLocaleLowerCase("tr-TR");
const inputTarihi = (t: string) => (t ? new Date(`${t}T00:00`) : null);
const tarihGoster = (t: string) => (t ? t.split("-").reverse().join(".") : "…");

function bosMu(d: FiltreDegeri | undefined): boolean {
  if (d === undefined) return true;
  if (typeof d === "string") return !d.trim();
  if (Array.isArray(d)) return d.length === 0;
  return !d.bas && !d.bit;
}

function uyuyorMu(alan: FiltreAlani, a: AdayEgitmen, b: Baglam, d: FiltreDegeri): boolean {
  switch (alan.tip) {
    case "coklu":
      return (d as string[]).includes(alan.deger(a, b));
    case "tarih": {
      const { bas, bit } = d as TarihAraligi;
      return alan.uyar(a, b, inputTarihi(bas), inputTarihi(bit));
    }
    case "metin":
      return kucukHarf(alan.deger(a)).includes(kucukHarf((d as string).trim()));
  }
}

function etiketMetni(alan: FiltreAlani, d: FiltreDegeri): string {
  if (alan.tip === "coklu") return `${alan.baslik}: ${(d as string[]).join(", ")}`;
  if (alan.tip === "tarih") {
    const { bas, bit } = d as TarihAraligi;
    return `${alan.baslik}: ${tarihGoster(bas)} – ${tarihGoster(bit)}`;
  }
  return `${alan.baslik}: "${(d as string).trim()}"`;
}

function bosDeger(alan: FiltreAlani): FiltreDegeri {
  return alan.tip === "coklu" ? [] : alan.tip === "tarih" ? { bas: "", bit: "" } : "";
}

/** Tek arama kutusu: ID, ad soyad, TCKN, telefon ve e-posta. */
function aramayaUyuyor(a: AdayEgitmen, q: string): boolean {
  const rakam = q.replace(/\D/g, "");
  return (
    kucukHarf(`${a.themisId} ${a.ad} ${a.soyad} ${a.eposta ?? ""} ${a.tcKimlikNo ?? ""}`).includes(
      kucukHarf(q)
    ) ||
    (rakam.length >= 3 && a.telefon.replace(/\D/g, "").includes(rakam))
  );
}

/* ------------------------------------------------------------------ */
/* Kayıtlı raporlar (tarayıcıda saklanır)                              */
/* ------------------------------------------------------------------ */

type KayitliRapor = {
  id: string;
  ad: string;
  arama: string;
  filtreler: Record<string, FiltreDegeri>;
  kolonlar: string[];
};

const KAYIT_ANAHTARI = "themis.kayitliRaporlar";

function kayitlariOku(): KayitliRapor[] {
  try {
    return JSON.parse(localStorage.getItem(KAYIT_ANAHTARI) ?? "[]");
  } catch {
    return [];
  }
}

function kayitlariYaz(liste: KayitliRapor[]) {
  try {
    localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(liste));
  } catch {
    // Tarayıcı depolaması kapalıysa rapor yalnızca bu oturumda kalır.
  }
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

async function exceleAktar(
  kolonlar: Kolon[],
  satirlar: string[][],
  filtreler: string[],
  dosyaAdi: string
) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rapor", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = kolonlar.map((k, i) => ({
    header: k.baslik,
    key: k.anahtar,
    width: Math.min(60, Math.max(k.baslik.length, ...satirlar.map((s) => s[i].length)) + 3),
  }));
  satirlar.forEach((s) => ws.addRow(s));
  const baslik = ws.getRow(1);
  baslik.font = { bold: true, color: { argb: "FFFFFFFF" } };
  baslik.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kolonlar.length } };

  // Raporun hangi filtrelerle alındığı ikinci sayfada saklanır.
  const bilgi = wb.addWorksheet("Filtreler");
  bilgi.columns = [{ header: "Uygulanan filtre", key: "f", width: 80 }];
  bilgi.getRow(1).font = { bold: true };
  (filtreler.length ? filtreler : ["Filtre yok — tüm kayıtlar"]).forEach((f) => bilgi.addRow([f]));
  bilgi.addRow([]);
  bilgi.addRow([`Kayıt sayısı: ${satirlar.length}`]);

  const veri = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([veri], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  link.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Küçük bileşenler                                                    */
/* ------------------------------------------------------------------ */

/** Dışarı tıklanınca veya Esc ile kapanan açılır panel. */
function AcilirPanel({
  acik,
  onKapat,
  tetik,
  children,
  sag = false,
  genislik = "w-72",
}: {
  acik: boolean;
  onKapat: () => void;
  tetik: ReactNode;
  children: ReactNode;
  sag?: boolean;
  genislik?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!acik) return;
    const disari = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onKapat();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onKapat();
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, [acik, onKapat]);
  return (
    <div ref={ref} className="relative">
      {tetik}
      {acik && (
        <div
          className={`absolute top-full z-30 mt-2 ${sag ? "right-0" : "left-0"} ${genislik} rounded-xl border border-zinc-200 bg-white p-2 shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function tarihKisayollari(): { label: string; bas: string; bit: string }[] {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const b = new Date();
  const y = b.getFullYear();
  const m = b.getMonth();
  return [
    { label: "Bu ay", bas: iso(new Date(y, m, 1)), bit: iso(new Date(y, m + 1, 0)) },
    { label: "Geçen ay", bas: iso(new Date(y, m - 1, 1)), bit: iso(new Date(y, m, 0)) },
    { label: "Son 3 ay", bas: iso(new Date(y, m - 2, 1)), bit: iso(new Date(y, m + 1, 0)) },
    { label: "Bu yıl", bas: iso(new Date(y, 0, 1)), bit: iso(new Date(y, 11, 31)) },
  ];
}

/** Seçili filtre alanının değerini düzenler; değişiklikler anında uygulanır. */
function DegerEditoru({
  alan,
  deger,
  onChange,
}: {
  alan: FiltreAlani;
  deger: FiltreDegeri;
  onChange: (d: FiltreDegeri) => void;
}) {
  const [ara, setAra] = useState("");
  if (alan.tip === "coklu") {
    const secili = deger as string[];
    const liste = alan.secenekler.filter((s) => kucukHarf(s).includes(kucukHarf(ara)));
    return (
      <div className="flex flex-col gap-1">
        {alan.secenekler.length > 8 && (
          <input
            autoFocus
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder={`${alan.baslik} ara…`}
            className="mb-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
          />
        )}
        <div className="max-h-64 overflow-y-auto">
          {liste.map((s) => {
            const var_ = secili.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange(var_ ? secili.filter((x) => x !== s) : [...secili, s])}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    var_ ? "border-brand bg-brand text-white" : "border-zinc-300"
                  }`}
                >
                  {var_ && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                {s}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (alan.tip === "tarih") {
    const t = deger as TarihAraligi;
    return (
      <div className="flex flex-col gap-2 p-1">
        <div className="grid grid-cols-2 gap-2">
          {(["bas", "bit"] as const).map((uc) => (
            <label key={uc} className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              {uc === "bas" ? "Başlangıç" : "Bitiş"}
              <input
                type="date"
                value={t[uc]}
                onChange={(e) => onChange({ ...t, [uc]: e.target.value })}
                className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-brand"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tarihKisayollari().map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => onChange({ bas: k.bas, bit: k.bit })}
              className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400">Boş bırakılan tarih sınırsız sayılır.</p>
      </div>
    );
  }
  return (
    <input
      autoFocus
      value={deger as string}
      onChange={(e) => onChange(e.target.value)}
      placeholder="İçeren metin"
      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
    />
  );
}

const ikincilButon =
  "flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

/* ------------------------------------------------------------------ */
/* Sayfa                                                               */
/* ------------------------------------------------------------------ */

/**
 * Esnek raporlama (PRD 14): tek arama kutusu, "+ Filtre ekle" ile eklenen etiket filtreler,
 * seçilip sıralanabilen kolonlar, kayıtlı raporlar ve Excel çıktısı. Sonuç canlı güncellenir.
 */
export function EsnekRapor() {
  const { adaylar } = useAdaylar();
  const { donemler } = useAkademiDonemleri();
  const [arama, setArama] = useState("");
  const [filtreler, setFiltreler] = useState<Record<string, FiltreDegeri>>({});
  // Tüm kolonların sırası; seçili olanlar bu sırayla gösterilir.
  const [kolonSirasi, setKolonSirasi] = useState<string[]>(() => [
    ...VARSAYILAN_KOLONLAR,
    ...KOLONLAR.map((k) => k.anahtar).filter((k) => !VARSAYILAN_KOLONLAR.includes(k)),
  ]);
  const [seciliKolonlar, setSeciliKolonlar] = useState<string[]>(VARSAYILAN_KOLONLAR);
  // null: kapalı · "liste": eklenecek alan seçiliyor · diğer: o alanın değeri düzenleniyor.
  const [filtreMenusu, setFiltreMenusu] = useState<string | null>(null);
  const [kolonMenusu, setKolonMenusu] = useState(false);
  const [kayitMenusu, setKayitMenusu] = useState(false);
  const [kaydetMenusu, setKaydetMenusu] = useState(false);
  const [kayitlilar, setKayitlilar] = useState<KayitliRapor[]>([]);
  const [raporAdi, setRaporAdi] = useState("");
  const [acikRapor, setAcikRapor] = useState<string | null>(null);
  const [surukle, setSurukle] = useState<string | null>(null);
  const [indiriliyor, setIndiriliyor] = useState(false);

  const baglam = useMemo<Baglam>(
    () => ({ donemi: (a) => donemler.find((d) => d.id === a.akademiDonemiId) }),
    [donemler]
  );

  const aktifFiltreler = FILTRE_ALANLARI.filter((f) => !bosMu(filtreler[f.anahtar]));

  const sonuc = useMemo(() => {
    const q = arama.trim();
    return adaylar.filter(
      (a) =>
        (!q || aramayaUyuyor(a, q)) &&
        FILTRE_ALANLARI.every(
          (f) => bosMu(filtreler[f.anahtar]) || uyuyorMu(f, a, baglam, filtreler[f.anahtar])
        )
    );
  }, [adaylar, arama, filtreler, baglam]);

  const gorunenKolonlar = kolonSirasi
    .filter((k) => seciliKolonlar.includes(k))
    .map((k) => KOLONLAR.find((c) => c.anahtar === k)!);

  const filtreKapat = () => {
    // Değer seçilmeden kapatılan filtre eklenmemiş sayılır.
    setFiltreler((prev) => Object.fromEntries(Object.entries(prev).filter(([, d]) => !bosMu(d))));
    setFiltreMenusu(null);
  };

  const filtreEtiketleri = [
    ...(arama.trim() ? [`Arama: "${arama.trim()}"`] : []),
    ...aktifFiltreler.map((f) => etiketMetni(f, filtreler[f.anahtar])),
  ];

  const acikRaporAdi = acikRapor ? kayitlilar.find((r) => r.id === acikRapor)?.ad : undefined;
  const duzenlenenAlan =
    filtreMenusu && filtreMenusu !== "liste" ? alanBul(filtreMenusu) : undefined;

  const indir = async () => {
    setIndiriliyor(true);
    const d = new Date();
    const tarih = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    await exceleAktar(
      gorunenKolonlar,
      sonuc.map((a) => gorunenKolonlar.map((k) => k.deger(a, baglam))),
      filtreEtiketleri,
      `${acikRaporAdi ? acikRaporAdi.replace(/[^\p{L}\p{N}]+/gu, "_") : "Themis_Egitmen_Raporu"}_${tarih}.xlsx`
    );
    setIndiriliyor(false);
  };

  const raporKaydet = () => {
    const ad = raporAdi.trim();
    if (!ad) return;
    const mevcut = kayitlariOku();
    const ayniAd = mevcut.find((r) => kucukHarf(r.ad) === kucukHarf(ad));
    const rapor: KayitliRapor = {
      id: ayniAd?.id ?? `r${Date.now()}`,
      ad,
      arama,
      filtreler,
      kolonlar: kolonSirasi.filter((k) => seciliKolonlar.includes(k)),
    };
    const yeni = ayniAd ? mevcut.map((r) => (r.id === ayniAd.id ? rapor : r)) : [...mevcut, rapor];
    kayitlariYaz(yeni);
    setKayitlilar(yeni);
    setAcikRapor(rapor.id);
    setKaydetMenusu(false);
  };

  const raporAc = (r: KayitliRapor) => {
    setArama(r.arama);
    setFiltreler(r.filtreler);
    setSeciliKolonlar(r.kolonlar);
    setKolonSirasi([
      ...r.kolonlar,
      ...KOLONLAR.map((k) => k.anahtar).filter((k) => !r.kolonlar.includes(k)),
    ]);
    setAcikRapor(r.id);
    setKayitMenusu(false);
  };

  const raporSil = (id: string) => {
    const yeni = kayitlariOku().filter((r) => r.id !== id);
    kayitlariYaz(yeni);
    setKayitlilar(yeni);
    if (acikRapor === id) setAcikRapor(null);
  };

  const kolonTasi = (kaynak: string, hedef: string) => {
    if (kaynak === hedef) return;
    setKolonSirasi((prev) => {
      const liste = prev.filter((k) => k !== kaynak);
      liste.splice(liste.indexOf(hedef), 0, kaynak);
      return liste;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Raporlama</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {acikRaporAdi ? (
              <>
                Kayıtlı rapor: <span className="font-medium text-zinc-800">{acikRaporAdi}</span>
              </>
            ) : (
              "Filtre ekleyin, kolonları seçin ve sonucu Excel olarak indirin."
            )}
          </p>
        </div>
        <AcilirPanel
          acik={kayitMenusu}
          onKapat={() => setKayitMenusu(false)}
          sag
          tetik={
            <button
              onClick={() => {
                setKayitlilar(kayitlariOku());
                setKayitMenusu((a) => !a);
              }}
              className={ikincilButon}
            >
              <Bookmark className="h-4 w-4" />
              Kayıtlı raporlarım
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
          }
        >
          {kayitlilar.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-400">
              Henüz kayıtlı rapor yok. Filtre ve kolonları ayarlayıp &quot;Raporu kaydet&quot;e
              basın.
            </p>
          ) : (
            kayitlilar.map((r) => (
              <div key={r.id} className="flex items-center gap-1 rounded-lg hover:bg-zinc-50">
                <button
                  onClick={() => raporAc(r)}
                  className="min-w-0 flex-1 px-2 py-1.5 text-left text-sm"
                >
                  <div className="truncate font-medium text-zinc-800">{r.ad}</div>
                  <div className="text-xs text-zinc-400">
                    {Object.keys(r.filtreler).length} filtre · {r.kolonlar.length} kolon
                  </div>
                </button>
                <button
                  onClick={() => raporSil(r.id)}
                  aria-label={`${r.ad} raporunu sil`}
                  className="mr-1 rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </AcilirPanel>
      </div>

      <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus-within:border-brand">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ad, ID, TCKN, telefon veya e-posta ile ara"
              className="w-full outline-none placeholder:text-zinc-400"
            />
            {arama && (
              <button
                onClick={() => setArama("")}
                aria-label="Aramayı temizle"
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aktifFiltreler.map((f) => (
              <AcilirPanel
                key={f.anahtar}
                acik={filtreMenusu === f.anahtar}
                onKapat={filtreKapat}
                genislik={f.tip === "tarih" ? "w-80" : "w-72"}
                tetik={
                  <span className="flex max-w-md items-center rounded-full border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-700">
                    <button
                      onClick={() => setFiltreMenusu(filtreMenusu === f.anahtar ? null : f.anahtar)}
                      className="truncate py-1.5 pl-3 pr-1 hover:text-zinc-900"
                    >
                      {etiketMetni(f, filtreler[f.anahtar])}
                    </button>
                    <button
                      onClick={() =>
                        setFiltreler((prev) => {
                          const yeni = { ...prev };
                          delete yeni[f.anahtar];
                          return yeni;
                        })
                      }
                      aria-label={`${f.baslik} filtresini kaldır`}
                      className="mr-1 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                }
              >
                <div className="mb-1 px-1 text-xs font-semibold text-zinc-500">{f.baslik}</div>
                <DegerEditoru
                  alan={f}
                  deger={filtreler[f.anahtar]}
                  onChange={(d) => setFiltreler((prev) => ({ ...prev, [f.anahtar]: d }))}
                />
              </AcilirPanel>
            ))}

            <AcilirPanel
              acik={
                filtreMenusu === "liste" ||
                (!!duzenlenenAlan && bosMu(filtreler[duzenlenenAlan.anahtar]))
              }
              onKapat={filtreKapat}
              genislik={duzenlenenAlan?.tip === "tarih" ? "w-80" : "w-72"}
              tetik={
                <button
                  onClick={() => (filtreMenusu ? filtreKapat() : setFiltreMenusu("liste"))}
                  className="flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Filtre ekle
                </button>
              }
            >
              {duzenlenenAlan ? (
                <>
                  <div className="mb-1 px-1 text-xs font-semibold text-zinc-500">
                    {duzenlenenAlan.baslik}
                  </div>
                  <DegerEditoru
                    alan={duzenlenenAlan}
                    deger={filtreler[duzenlenenAlan.anahtar] ?? bosDeger(duzenlenenAlan)}
                    onChange={(d) =>
                      setFiltreler((prev) => ({ ...prev, [duzenlenenAlan.anahtar]: d }))
                    }
                  />
                </>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {FILTRE_ALANLARI.filter((f) => bosMu(filtreler[f.anahtar])).map((f) => (
                    <button
                      key={f.anahtar}
                      onClick={() => {
                        setFiltreler((prev) => ({ ...prev, [f.anahtar]: bosDeger(f) }));
                        setFiltreMenusu(f.anahtar);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {f.baslik}
                      <span className="text-[11px] text-zinc-400">
                        {f.tip === "tarih"
                          ? "Tarih aralığı"
                          : f.tip === "metin"
                            ? "Metin"
                            : "Seçim"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </AcilirPanel>

            {(aktifFiltreler.length > 0 || arama) && (
              <button
                onClick={() => {
                  setFiltreler({});
                  setArama("");
                }}
                className="text-xs font-medium text-brand hover:underline"
              >
                Tümünü temizle
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <span className="text-sm text-zinc-500">
            {filtreEtiketleri.length > 0 ? (
              <>
                {adaylar.length.toLocaleString("tr-TR")} kişi içinden{" "}
                <strong className="text-zinc-900">{sonuc.length.toLocaleString("tr-TR")}</strong>{" "}
                kişi
              </>
            ) : (
              <>
                <strong className="text-zinc-900">{adaylar.length.toLocaleString("tr-TR")}</strong>{" "}
                kişi
              </>
            )}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <AcilirPanel
              acik={kolonMenusu}
              onKapat={() => setKolonMenusu(false)}
              sag
              tetik={
                <button onClick={() => setKolonMenusu((a) => !a)} className={ikincilButon}>
                  <Columns3 className="h-4 w-4" />
                  Kolonlar
                  <span className="text-xs text-zinc-400">{gorunenKolonlar.length}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
              }
            >
              <div className="mb-1 flex items-center justify-between px-1 text-xs">
                <span className="font-semibold text-zinc-500">Sürükleyerek sıralayın</span>
                <span className="flex gap-2 font-medium">
                  <button
                    onClick={() => setSeciliKolonlar(KOLONLAR.map((k) => k.anahtar))}
                    className="text-brand hover:underline"
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setSeciliKolonlar(VARSAYILAN_KOLONLAR)}
                    className="text-zinc-500 hover:underline"
                  >
                    Varsayılan
                  </button>
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {kolonSirasi.map((anahtar) => {
                  const k = KOLONLAR.find((c) => c.anahtar === anahtar)!;
                  const secili = seciliKolonlar.includes(anahtar);
                  return (
                    <div
                      key={anahtar}
                      draggable
                      onDragStart={() => setSurukle(anahtar)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (surukle) kolonTasi(surukle, anahtar);
                      }}
                      onDragEnd={() => setSurukle(null)}
                      className={`flex items-center gap-1 rounded-lg px-1 hover:bg-zinc-50 ${
                        surukle === anahtar ? "bg-zinc-100" : ""
                      }`}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-zinc-300" />
                      <button
                        onClick={() =>
                          setSeciliKolonlar((prev) =>
                            secili ? prev.filter((x) => x !== anahtar) : [...prev, anahtar]
                          )
                        }
                        className="flex flex-1 items-center gap-2 py-1.5 text-left text-sm text-zinc-700"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            secili ? "border-brand bg-brand text-white" : "border-zinc-300"
                          }`}
                        >
                          {secili && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        {k.baslik}
                      </button>
                    </div>
                  );
                })}
              </div>
            </AcilirPanel>

            <AcilirPanel
              acik={kaydetMenusu}
              onKapat={() => setKaydetMenusu(false)}
              sag
              tetik={
                <button
                  onClick={() => {
                    setRaporAdi(acikRaporAdi ?? "");
                    setKaydetMenusu((a) => !a);
                  }}
                  className={ikincilButon}
                >
                  <Bookmark className="h-4 w-4" />
                  Raporu kaydet
                </button>
              }
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  raporKaydet();
                }}
                className="flex flex-col gap-2 p-1"
              >
                <label className="text-xs font-semibold text-zinc-500" htmlFor="rapor-adi">
                  Rapor adı
                </label>
                <input
                  id="rapor-adi"
                  autoFocus
                  value={raporAdi}
                  onChange={(e) => setRaporAdi(e.target.value)}
                  placeholder="Örn. Aylık işe girenler"
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                />
                <p className="text-[11px] text-zinc-400">
                  Arama, filtreler ve kolonlar kaydedilir. Aynı adla kaydetmek raporu günceller.
                </p>
                <button
                  type="submit"
                  disabled={!raporAdi.trim()}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
                >
                  Kaydet
                </button>
              </form>
            </AcilirPanel>

            <button
              onClick={indir}
              disabled={indiriliyor || gorunenKolonlar.length === 0 || sonuc.length === 0}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {indiriliyor ? "Hazırlanıyor…" : "Excel indir"}
            </button>
          </div>
        </div>

        {gorunenKolonlar.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-400">
            Raporda görmek istediğiniz en az bir kolon seçin.
          </p>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-zinc-100 bg-white text-xs font-medium text-zinc-400">
                  {gorunenKolonlar.map((k) => (
                    <th key={k.anahtar} className="whitespace-nowrap px-4 py-2.5">
                      {k.baslik}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sonuc.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                  >
                    {gorunenKolonlar.map((k) => {
                      const h = k.deger(a, baglam);
                      return (
                        <td key={k.anahtar} className="whitespace-nowrap px-4 py-2.5 text-zinc-700">
                          {h || <span className="text-zinc-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {sonuc.length === 0 && (
                  <tr>
                    <td
                      colSpan={gorunenKolonlar.length}
                      className="px-4 py-12 text-center text-sm text-zinc-400"
                    >
                      Filtrelere uyan kayıt yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
