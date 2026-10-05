"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, Filter, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { AdayDetayModal } from "@/components/aday/AdayDetayModal";
import { iseGirisTarihi } from "@/lib/egitmenGecis";
import { sonIslemSirasi } from "@/lib/sonIslem";
import { useAdaylar } from "@/lib/AdaylarContext";
import { akademiAsamasi } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import {
  ikinciBelgeSetiOlustur,
  ilkBelgeSetiOlustur,
  mulakatPlanlanacakMi,
} from "@/lib/belgeKurallari";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { yeniThemisId } from "@/lib/egitmenUret";
import { tekrarBasvuruUyarisi, telefonAnahtari } from "@/lib/mulakatDegerlendirme";
import { KULUPLER } from "@/lib/kulupler";
import {
  BRANS_TANIMLARI,
  digerBransSertifikalari,
  enAcilSertifika,
  fitnessSertifikasi,
  onayBekleyenSertifikaVarMi,
  VIZE_DURUMU_BILGI,
  vizeAciklamasi,
  vizeDurumu,
  vizeRozetMetni,
  vizesiGecmisMi,
  vizesiYaklasiyorMu,
} from "@/lib/sertifika";
import {
  surecDurumuGorunumu,
  toneClasses,
  uyelikTipi,
  uyelikTipiBilgi,
  type Tone,
} from "@/lib/status";
import type {
  AdayEgitmen,
  AkademiSinavSonucu,
  SurecDurumu,
  YoklamaDurumu,
} from "@/lib/types";

function bugununTarihi() {
  const d = new Date();
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  return `${gun}.${ay}.${d.getFullYear()}`;
}

/** "DD.MM.YYYY" ya da "Bugün" biçimindeki tarih metnini Date'e çevirir. */
function tarihiCoz(tarih: string): Date | null {
  if (tarih === "Bugün") return new Date();
  const parcalar = tarih.split(".");
  if (parcalar.length !== 3) return null;
  const [gun, ay, yil] = parcalar.map(Number);
  if (!gun || !ay || !yil) return null;
  return new Date(yil, ay - 1, gun);
}

type Sekme = "aday" | "akademi" | "egitmen" | "pasif";

/**
 * Özet kartları aynı zamanda liste filtresidir: tıklanınca tablo yalnızca `kosul`u sağlayan
 * kişileri gösterir; seçili karta yeniden tıklamak filtreyi kaldırır.
 */
type OzetKart = {
  baslik: string;
  kosul?: (a: AdayEgitmen, b: HucreBaglami) => boolean;
  veriYok?: boolean; // veri kaynağı henüz bağlanmadı; sayı gösterilmez, tıklanamaz
  altMetin: string;
  vurgu?: "red" | "amber";
  // Başlığın önündeki noktanın rengi (Tailwind bg-* sınıfı).
  nokta: string;
};

type HucreBaglami = {
  akademiAdi: (akademiDonemiId?: string) => string | undefined;
  // Yoklama sonucu; yoklama alınmadıysa tanımsız.
  akademiKatilimi: (a: AdayEgitmen) => YoklamaDurumu | undefined;
  sinavSonucu: (a: AdayEgitmen) => AkademiSinavSonucu["genelSonuc"] | undefined;
  akademiAsamasi: (a: AdayEgitmen) => { label: string; tone: Tone };
};

type Kolon = {
  baslik: string;
  hucre: (a: AdayEgitmen, b: HucreBaglami) => ReactNode;
};

type SekmeTanimi = {
  id: Sekme;
  label: string;
  // Sekmeler statüyü değil sürecin aşamasını izler: örn. mülakatı olumlu geçip akademiye
  // giriş bekleyen kişi statüsü hâlâ Aday Eğitmen olsa da Akademi sekmesinde listelenir.
  kapsam: (a: AdayEgitmen) => boolean;
  kartlar: OzetKart[];
  kolonlar: Kolon[];
};

const bos = <span className="text-zinc-400">—</span>;

const themisIdKolonu: Kolon = {
  baslik: "Themis ID",
  hucre: (a) => <span className="font-mono text-xs text-zinc-500">{a.themisId}</span>,
};

const adSoyadKolonu: Kolon = {
  baslik: "Ad Soyad",
  hucre: (a) => (
    <span className="flex items-center gap-2 font-medium text-zinc-900 group-hover:text-brand">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
        {a.ad[0]}
        {a.soyad[0]}
      </span>
      {a.ad} {a.soyad}
    </span>
  ),
};

const kulupKolonu: Kolon = {
  baslik: "Kulüp",
  hucre: (a) => <span className="text-zinc-600">{a.kulup}</span>,
};

const surecDurumuKolonu: Kolon = {
  baslik: "Süreç Durumu",
  hucre: (a) => {
    const d = surecDurumuGorunumu(a);
    return <Badge label={d.label} tone={d.tone} />;
  },
};

const iseGirisKolonu: Kolon = {
  baslik: "İşe Giriş Tarihi",
  hucre: (a) => <span className="text-zinc-500">{iseGirisTarihi(a) || "—"}</span>,
};

const sozlesmeTipiKolonu: Kolon = {
  baslik: "Sözleşme Tipi",
  hucre: (a) => (
    <span className="text-zinc-600">
      {a.istihdamTipi ?? "Tam Zamanlı"}
      {a.altSozlesmeTipi && (
        <span className="block text-xs text-zinc-400">{a.altSozlesmeTipi}</span>
      )}
    </span>
  ),
};

const akademiKolonu: Kolon = {
  baslik: "Akademi",
  hucre: (a, b) => {
    const ad = b.akademiAdi(a.akademiDonemiId);
    return ad ? (
      <span className="text-zinc-700">{ad}</span>
    ) : (
      <span className="text-zinc-400">Henüz atanmadı</span>
    );
  },
};

/**
 * Tüm Eğitmenler ekranının 4 ana sekmesi. Her sekmenin üstteki özet kartları ve tablo
 * kolonları kendine özeldir; son kart her zaman o sekmedeki kişi sayısıdır.
 */
/** Eğitmenliğe varmadan süreci biten aday durumları ("Süreci Biten" sekmesi). */
const SURECI_BITEN: SurecDurumu[] = [
  "reddedildi",
  "ileride_degerlendirilebilir",
  "surec_sonlandirildi",
];

/** Sürecin bittiği tarih ve neden: işten çıkış, olumsuz mülakat ya da süreç sonlandırma. */
function bitisBilgisi(a: AdayEgitmen): { tarih?: string; neden?: string; detay?: string } {
  switch (a.surecDurumu) {
    case "pasif":
      return { tarih: a.cikisTarihi, neden: a.fesihSekli, detay: a.fesihNedeni };
    case "reddedildi":
      return {
        tarih: a.gorusmeSonucuTarihi,
        neden: "Akademi mülakatı olumsuz",
        detay: a.olumsuzOlmaNedeni ?? a.mulakatDegerlendirmesi?.aciklama,
      };
    case "ileride_degerlendirilebilir":
      return {
        tarih: a.gorusmeSonucuTarihi,
        neden: "6 ay sonra tekrar başvurabilir",
        detay: a.olumsuzOlmaNedeni ?? a.mulakatDegerlendirmesi?.aciklama,
      };
    case "surec_sonlandirildi":
      return {
        tarih: a.surecSonlandirma?.tarih,
        neden: a.surecSonlandirma?.neden,
        detay: a.surecSonlandirma?.aciklama,
      };
    default:
      return {};
  }
}

const SEKMELER: SekmeTanimi[] = [
  {
    id: "aday",
    label: "Aday Eğitmenler",
    // Sekmeler statüye göre ayrılır: davet bilgileri İK tarafından onaylanana kadar kişi
    // Aday Eğitmen'dir ve bu sekmede görünür (PRD §3, §6).
    // Süreci biten adaylar (olumsuz, yeniden değerlendirilebilir, sonlandırılan) "Süreci Biten"
    // sekmesindedir; mülakata / akademiye katılmayanların süreci devam ettiği için burada kalır.
    kapsam: (a) =>
      uyelikTipi(a.surecDurumu) === "Aday Eğitmen" && !SURECI_BITEN.includes(a.surecDurumu),
    kartlar: [
      {
        baslik: "Belge Bekleyen",
        nokta: "bg-amber-500",
        kosul: (a) =>
          a.surecDurumu === "ilk_belge_seti_bekleniyor" ||
          a.surecDurumu === "ikinci_belge_seti_bekleniyor",
        altMetin: "Birinci veya ikinci belge seti",
        vurgu: "amber",
      },
      {
        baslik: "İK Onayı Bekleyen",
        nokta: "bg-violet-500",
        kosul: (a) => a.surecDurumu === "ik_onayi_bekliyor",
        altMetin: "İkinci belge seti onayı",
      },
      {
        baslik: "Akademi Mülakatı Planlanacak",
        nokta: "bg-orange-500",
        kosul: mulakatPlanlanacakMi,
        altMetin: "İK onayı tamam, mülakat tarihi yok",
        vurgu: "amber",
      },
      {
        baslik: "Akademi Mülakatı Sonucu Bekleyen",
        nokta: "bg-sky-500",
        kosul: (a) => a.surecDurumu === "mulakat_sonucu_bekleniyor" && !!a.mulakatPlanlananTarihi,
        altMetin: "Planlanmış akademi mülakatı",
      },
      {
        baslik: "Akademiye Giriş Bekleyen",
        nokta: "bg-emerald-500",
        // Mülakatı olumlu: davet bilgilerinin girilmesini (KM) ya da İK onayını bekleyenler;
        // yoklamada gelmeyip yeniden davet bekleyenler de dahil.
        kosul: (a) =>
          a.surecDurumu === "akademi_egitimine_hazir" ||
          a.surecDurumu === "akademi_daveti_onayi_bekliyor" ||
          a.surecDurumu === "akademiye_katilmadi",
        altMetin: "Davet bilgileri veya İK onayı bekleniyor",
      },
    ],
    kolonlar: [
      themisIdKolonu,
      adSoyadKolonu,
      kulupKolonu,
      {
        baslik: "Mülakatı Yapan",
        hucre: (a) => (
          <span className="text-zinc-600">
            {a.mulakatiYapan}
            <span className="ml-1 text-xs text-zinc-400">({a.mulakatiYapanRol})</span>
          </span>
        ),
      },
      {
        baslik: "Sisteme Eklenme Tarihi",
        hucre: (a) => <span className="text-zinc-500">{a.basvuruTarihi}</span>,
      },
      {
        baslik: "Akademi Mülakatı Sonucu",
        hucre: (a) =>
          a.gorusmeSonucu ? (
            <Badge
              label={a.gorusmeSonucu}
              tone={
                a.gorusmeSonucu === "Olumlu"
                  ? "green"
                  : a.gorusmeSonucu === "Olumsuz"
                    ? "red"
                    : "amber"
              }
            />
          ) : (
            bos
          ),
      },
      {
        baslik: "Akademi Mülakatı Sonuç Tarihi",
        hucre: (a) => <span className="text-zinc-500">{a.gorusmeSonucuTarihi ?? "—"}</span>,
      },
      surecDurumuKolonu,
    ],
  },
  {
    id: "akademi",
    label: "Akademi Eğitmenleri",
    kapsam: (a) => uyelikTipi(a.surecDurumu) === "Akademi Eğitmeni",
    kartlar: [
      {
        baslik: "Akademide",
        nokta: "bg-sky-500",
        kosul: (a, b) => b.akademiAsamasi(a).label === "Akademide",
        altMetin: "Eğitimi devam eden",
      },
      {
        baslik: "Akademi Sınav Sonucu Bekleyen",
        nokta: "bg-amber-500",
        kosul: (a, b) => b.akademiAsamasi(a).label === "Sınav Sonucu Bekleniyor",
        altMetin: "Akademisi biten, sonucu girilmeyen",
        vurgu: "amber",
      },
      {
        baslik: "Eğitmenliğe Geçişe Hazır",
        nokta: "bg-emerald-500",
        kosul: (a) => a.surecDurumu === "akademiyi_tamamladi",
        altMetin: "Sınavı geçen",
      },
    ],
    kolonlar: [
      themisIdKolonu,
      adSoyadKolonu,
      kulupKolonu,
      akademiKolonu,
      {
        baslik: "Akademi Başlangıç",
        hucre: (a) => (
          <span className="text-zinc-500">{a.yonlendirilecekAkademiTarihi ?? "—"}</span>
        ),
      },
      {
        baslik: "Akademiye Katılım",
        hucre: (a, b) => {
          const k = b.akademiKatilimi(a);
          return k ? <Badge label={k} tone={k === "Geldi" ? "green" : "red"} /> : bos;
        },
      },
      {
        baslik: "Akademi Sınav Sonucu",
        hucre: (a, b) => {
          const s = b.sinavSonucu(a);
          return s ? <Badge label={s} tone={s === "Geçti" ? "green" : "red"} /> : bos;
        },
      },
      {
        // Statü bu sekmede hep Akademi Eğitmeni olduğundan akademi içindeki aşama gösterilir.
        baslik: "Süreç Durumu",
        hucre: (a, b) => {
          const d = b.akademiAsamasi(a);
          return <Badge label={d.label} tone={d.tone} />;
        },
      },
    ],
  },
  {
    id: "egitmen",
    label: "Eğitmenler",
    kapsam: (a) => a.surecDurumu === "egitmen",
    kartlar: [
      {
        baslik: "Sertifika Vizesi 30 Gün İçinde Bitecek",
        nokta: "bg-amber-500",
        kosul: vizesiYaklasiyorMu,
        altMetin: "Vize yenilemesi yaklaşıyor",
        vurgu: "amber",
      },
      {
        baslik: "Sertifika Vizesi Geçmiş",
        nokta: "bg-rose-600",
        kosul: vizesiGecmisMi,
        altMetin: "En az bir sertifikanın vizesi doldu",
        vurgu: "red",
      },
      {
        baslik: "Onay Bekleyen Belge",
        nokta: "bg-violet-500",
        kosul: onayBekleyenSertifikaVarMi,
        altMetin: "Sertifika İK onayında",
      },
    ],
    kolonlar: [
      themisIdKolonu,
      adSoyadKolonu,
      kulupKolonu,
      sozlesmeTipiKolonu,
      {
        baslik: "Fitness",
        hucre: (a) => {
          const s = fitnessSertifikasi(a);
          return s ? (
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
              {s.kademe}. Kademe
            </span>
          ) : (
            <span className="text-xs text-rose-500">Belge yok</span>
          );
        },
      },
      {
        baslik: "Diğer Branşlar",
        hucre: (a) => {
          const liste = digerBransSertifikalari(a);
          return liste.length ? (
            <span className="text-zinc-600">
              {liste.map((s) => `${s.brans} ${s.kademe}. Kademe`).join(", ")}
            </span>
          ) : (
            bos
          );
        },
      },
      {
        baslik: "Vize Durumu",
        hucre: (a) => {
          const s = enAcilSertifika(a);
          if (!s) return bos;
          const durum = VIZE_DURUMU_BILGI[vizeDurumu(s)];
          return (
            <div className="flex flex-col items-start gap-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[durum.tone]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${durum.nokta}`} />
                {vizeRozetMetni(s)}
              </span>
              <span className="text-[11px] text-zinc-400">{vizeAciklamasi(s)}</span>
            </div>
          );
        },
      },
      iseGirisKolonu,
    ],
  },
  {
    id: "pasif",
    label: "Süreci Biten",
    // İşten çıkan eğitmenler ile süreci eğitmenliğe varmadan biten adaylar. Statü değişmez:
    // çıkanlar Pasif Eğitmen, diğerleri Aday Eğitmen olarak kalır (Statü kolonunda görünür).
    kapsam: (a) => a.surecDurumu === "pasif" || SURECI_BITEN.includes(a.surecDurumu),
    kartlar: [
      {
        baslik: "İşten Çıkan",
        nokta: "bg-zinc-500",
        kosul: (a) => a.surecDurumu === "pasif",
        altMetin: "Pasif eğitmenler",
      },
      {
        baslik: "Olumsuz",
        nokta: "bg-rose-500",
        kosul: (a) => a.surecDurumu === "reddedildi",
        altMetin: "Akademi mülakatı olumsuz",
      },
      {
        baslik: "Yeniden Değerlendirilebilir",
        nokta: "bg-pink-500",
        kosul: (a) => a.surecDurumu === "ileride_degerlendirilebilir",
        altMetin: "6 ay sonra tekrar başvurabilir",
      },
      {
        baslik: "Süreci Sonlandırılan",
        nokta: "bg-amber-500",
        kosul: (a) => a.surecDurumu === "surec_sonlandirildi",
        altMetin: "Akademiyi tamamlayamayan",
      },
    ],
    kolonlar: [
      themisIdKolonu,
      adSoyadKolonu,
      kulupKolonu,
      {
        baslik: "Statü",
        hucre: (a) => {
          const t = uyelikTipi(a.surecDurumu);
          return <Badge label={t} tone={uyelikTipiBilgi[t].tone} />;
        },
      },
      surecDurumuKolonu,
      // Çıkanlarda çıkış tarihiyle birlikte ne kadar çalıştığını gösterir.
      iseGirisKolonu,
      {
        baslik: "Bitiş Tarihi",
        hucre: (a) => <span className="text-zinc-500">{bitisBilgisi(a).tarih ?? "—"}</span>,
      },
      {
        baslik: "Bitiş Nedeni",
        hucre: (a) => {
          const b = bitisBilgisi(a);
          return (
            <span className="text-zinc-600">
              {b.neden ?? "—"}
              {b.detay && <div className="max-w-64 truncate text-xs text-zinc-400">{b.detay}</div>}
            </span>
          );
        },
      },
    ],
  },
];

// Tailwind sınıfları derleme anında tarandığı için kart sayısına göre sabit eşleme.
const KART_IZGARASI: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-3 xl:grid-cols-6",
};

const KART_VURGU: Record<NonNullable<OzetKart["vurgu"]>, { kutu: string; metin: string }> = {
  red: {
    kutu: "border-rose-200",
    metin: "text-rose-700",
  },
  amber: {
    kutu: "border-amber-200",
    metin: "text-amber-700",
  },
};

function OzetKartKutusu({
  kart,
  deger,
  secili,
  onSec,
}: {
  kart: OzetKart;
  deger: number;
  secili: boolean;
  onSec: () => void;
}) {
  const vurgu = kart.vurgu ? KART_VURGU[kart.vurgu] : null;
  return (
    <button
      type="button"
      onClick={onSec}
      disabled={kart.veriYok}
      aria-pressed={secili}
      className={`rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all enabled:hover:shadow-md disabled:cursor-default ${
        secili ? "shadow-md ring-1 ring-brand/30" : ""
      } ${vurgu?.kutu ?? "border-zinc-200"}`}
    >
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${vurgu?.metin ?? "text-zinc-800"}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${kart.nokta}`} />
        {kart.baslik}
      </div>
      <div className={`mt-2 text-3xl font-bold ${vurgu?.metin ?? "text-zinc-900"}`}>
        {kart.veriYok ? <span className="text-zinc-300">—</span> : deger.toLocaleString("tr-TR")}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{kart.altMetin}</div>
    </button>
  );
}

export default function AdaylarPage() {
  const { adaylar, setAdaylar, guncelleAday } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const hucreBaglami = useMemo<HucreBaglami>(() => {
    const donemi = (a: AdayEgitmen) => donemler.find((d) => d.id === a.akademiDonemiId);
    const sinavSonucu = (a: AdayEgitmen) =>
      sinavSonuclari.find(
        (s) =>
          s.egitmenId === a.id && (!s.akademiDonemiId || s.akademiDonemiId === a.akademiDonemiId)
      )?.genelSonuc;
    return {
      akademiAdi: (id) => donemler.find((d) => d.id === id)?.ad,
      akademiKatilimi: (a) => donemi(a)?.yoklama?.[a.id],
      sinavSonucu,
      akademiAsamasi: (a) => akademiAsamasi(a, donemi(a), sinavSonucu(a)),
    };
  }, [donemler, sinavSonuclari]);
  const [sekme, setSekme] = useState<Sekme>("aday");
  // Seçili özet kartının başlığı; null iken sekmedeki herkes listelenir.
  const [seciliKart, setSeciliKart] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [sonucBaslangic, setSonucBaslangic] = useState("");
  const [sonucBitis, setSonucBitis] = useState("");
  const [bransFiltresi, setBransFiltresi] = useState("");
  const [kademeFiltresi, setKademeFiltresi] = useState("");
  const filtreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtreAcik) return;
    const onClickOutside = (e: MouseEvent) => {
      if (filtreRef.current && !filtreRef.current.contains(e.target as Node)) {
        setFiltreAcik(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filtreAcik]);

  const aktifSekme = SEKMELER.find((s) => s.id === sekme)!;

  const sekmeListeleri = useMemo(() => {
    const sonuc = {} as Record<Sekme, AdayEgitmen[]>;
    for (const s of SEKMELER) {
      sonuc[s.id] = adaylar.filter(s.kapsam);
    }
    return sonuc;
  }, [adaylar]);

  const sekmeListesi = sekmeListeleri[sekme];
  const kartlar = aktifSekme.kartlar;

  const gorunenler = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Tüm roller (Kulüp Müdürü, İK, Sistem Yöneticisi) aynı havuzu görür; roller arasında
    // farklılaşan yalnızca işlem yetkileridir (bkz. ikYetkisiVarMi), görünürlük değil.
    const kartKosulu = SEKMELER.find((s) => s.id === sekme)!.kartlar.find(
      (k) => k.baslik === seciliKart
    )?.kosul;
    let list = kartKosulu ? sekmeListesi.filter((a) => kartKosulu(a, hucreBaglami)) : sekmeListesi;
    // PRD 12.2: eğitmenler branş ve kademeye göre filtrelenebilir.
    if (sekme === "egitmen" && (bransFiltresi || kademeFiltresi)) {
      list = list.filter((a) =>
        (a.sertifikalar ?? []).some(
          (s) =>
            s.onaylandi &&
            (!bransFiltresi || s.brans === bransFiltresi) &&
            (!kademeFiltresi || s.kademe === Number(kademeFiltresi))
        )
      );
    }
    if (sekme !== "egitmen" && (sonucBaslangic || sonucBitis)) {
      list = list.filter((a) => {
        if (!a.gorusmeSonucuTarihi) return false;
        const d = tarihiCoz(a.gorusmeSonucuTarihi);
        if (!d) return false;
        if (sonucBaslangic && d < new Date(sonucBaslangic)) return false;
        if (sonucBitis && d > new Date(sonucBitis)) return false;
        return true;
      });
    }
    if (q) {
      list = list.filter((a) =>
        `${a.themisId} ${a.ad} ${a.soyad} ${a.telefon} ${a.eposta ?? ""} ${a.kulup}`
          .toLowerCase()
          .includes(q)
      );
    }
    // Tüm sekmelerde varsayılan: üzerinde en son işlem yapılan kişi en üstte.
    list = [...list].sort((a, b) => sonIslemSirasi(b) - sonIslemSirasi(a));
    return list;
  }, [
    sekmeListesi,
    sekme,
    seciliKart,
    sonucBaslangic,
    sonucBitis,
    bransFiltresi,
    kademeFiltresi,
    search,
    hucreBaglami,
  ]);

  const selectedAday = adaylar.find((a) => a.id === selectedId);

  // Tablonun üstündeki etiket satırı: kart seçimi, Filtrele menüsü ve arama; × ile kaldırılır.
  const inputTarihiGoster = (t: string) => t.split("-").reverse().join(".");
  const aktifFiltreler: { etiket: string; kaldir: () => void }[] = [
    ...(seciliKart ? [{ etiket: seciliKart, kaldir: () => setSeciliKart(null) }] : []),
    ...(sekme === "egitmen"
      ? [
          ...(bransFiltresi
            ? [{ etiket: `Branş: ${bransFiltresi}`, kaldir: () => setBransFiltresi("") }]
            : []),
          ...(kademeFiltresi
            ? [{ etiket: `${kademeFiltresi}. Kademe`, kaldir: () => setKademeFiltresi("") }]
            : []),
        ]
      : sonucBaslangic || sonucBitis
        ? [
            {
              etiket: `Mülakat sonuç tarihi: ${sonucBaslangic ? inputTarihiGoster(sonucBaslangic) : "…"} – ${sonucBitis ? inputTarihiGoster(sonucBitis) : "…"}`,
              kaldir: () => {
                setSonucBaslangic("");
                setSonucBitis("");
              },
            },
          ]
        : []),
    ...(search.trim()
      ? [{ etiket: `Arama: "${search.trim()}"`, kaldir: () => setSearch("") }]
      : []),
  ];
  const aktifFiltreSayisi =
    sekme === "egitmen"
      ? (bransFiltresi ? 1 : 0) + (kademeFiltresi ? 1 : 0)
      : (sonucBaslangic ? 1 : 0) + (sonucBitis ? 1 : 0);

  return (
    <div className="flex h-full flex-col gap-5">
      <h1 className="shrink-0 text-2xl font-bold text-zinc-900">Tüm Eğitmenler</h1>

      <div className="flex shrink-0 items-end gap-2 border-b border-zinc-200">
        {SEKMELER.map((s) => {
          const aktif = s.id === sekme;
          return (
            <button
              key={s.id}
              onClick={() => {
                setSekme(s.id);
                setSeciliKart(null);
              }}
              className={`-mb-px border-b-2 px-4 pb-3 pt-1 text-[15px] transition-colors ${
                aktif
                  ? "border-brand font-semibold text-zinc-900"
                  : "border-transparent font-medium text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {s.label}
              <span className={`ml-1.5 ${aktif ? "text-brand" : "text-zinc-400"}`}>
                {sekmeListeleri[s.id].length.toLocaleString("tr-TR")}
              </span>
            </button>
          );
        })}
        {/* Sekmelerle aynı satırda, sağda. */}
        {sekme === "aday" && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mb-2 ml-auto flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            Aday Eğitmen Ekle
          </button>
        )}
      </div>

      <div
        className={`grid shrink-0 grid-cols-2 gap-4 ${KART_IZGARASI[kartlar.length] ?? "lg:grid-cols-4"}`}
      >
        {kartlar.map((k) => (
          <OzetKartKutusu
            key={k.baslik}
            kart={k}
            deger={
              k.kosul
                ? sekmeListesi.filter((a) => k.kosul!(a, hucreBaglami)).length
                : sekmeListesi.length
            }
            secili={seciliKart === k.baslik}
            // Seçili karta yeniden tıklamak filtreyi kaldırır; hiçbir kart seçili değilse
            // sekmedeki herkes listelenir.
            onSec={() => setSeciliKart(seciliKart === k.baslik ? null : k.baslik)}
          />
        ))}
      </div>

      {invited && (
        <div className="flex shrink-0 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>
            <strong>{invited}</strong> aday eğitmen olarak eklendi. Belge yükleme ve onay akışı
            Themis üzerinden başlatıldı.
          </span>
          <button
            onClick={() => setInvited(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="w-full outline-none placeholder:text-zinc-400"
            />
          </div>
          <div ref={filtreRef} className="relative">
            <button
              onClick={() => setFiltreAcik((a) => !a)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 ${
                aktifFiltreSayisi > 0 ? "border-brand text-brand" : "border-zinc-200 text-zinc-600"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtrele
              {aktifFiltreSayisi > 0 && (
                <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-brand">
                  {aktifFiltreSayisi}
                </span>
              )}
            </button>
            {filtreAcik && (
              <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                {sekme === "egitmen" ? (
                  <div className="flex flex-col gap-2 px-2 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500">Branş ve Kademe</span>
                      {(bransFiltresi || kademeFiltresi) && (
                        <button
                          onClick={() => {
                            setBransFiltresi("");
                            setKademeFiltresi("");
                          }}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <select
                      value={bransFiltresi}
                      onChange={(e) => setBransFiltresi(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand"
                    >
                      <option value="">Tüm branşlar</option>
                      {BRANS_TANIMLARI.map((b) => (
                        <option key={b.ad} value={b.ad}>
                          {b.ad}
                        </option>
                      ))}
                    </select>
                    <select
                      value={kademeFiltresi}
                      onChange={(e) => setKademeFiltresi(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand"
                    >
                      <option value="">Tüm kademeler</option>
                      {[1, 2, 3, 4, 5].map((k) => (
                        <option key={k} value={k}>
                          {k}. Kademe
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-xs font-semibold text-zinc-500">
                        Akademi Mülakatı Sonuç Tarihi
                      </span>
                      {(sonucBaslangic || sonucBitis) && (
                        <button
                          onClick={() => {
                            setSonucBaslangic("");
                            setSonucBitis("");
                          }}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 px-2">
                      <input
                        type="date"
                        value={sonucBaslangic}
                        onChange={(e) => setSonucBaslangic(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-brand"
                      />
                      <span className="text-xs text-zinc-400">–</span>
                      <input
                        type="date"
                        value={sonucBitis}
                        onChange={(e) => setSonucBitis(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pb-3 text-sm">
          {aktifFiltreler.map((f) => (
            <span
              key={f.etiket}
              className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1.5 text-xs font-medium text-zinc-700"
            >
              {f.etiket}
              <button
                onClick={f.kaldir}
                aria-label={`${f.etiket} filtresini kaldır`}
                className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <span className="text-xs text-zinc-500">
            {aktifFiltreler.length > 0 ? (
              <>
                {sekmeListesi.length.toLocaleString("tr-TR")} kişi içinden{" "}
                <strong className="text-zinc-800">
                  {gorunenler.length.toLocaleString("tr-TR")}
                </strong>{" "}
                kişi gösteriliyor
              </>
            ) : (
              <>
                Toplam{" "}
                <strong className="text-zinc-800">
                  {sekmeListesi.length.toLocaleString("tr-TR")}
                </strong>{" "}
                kişi gösteriliyor
              </>
            )}
          </span>
          {aktifFiltreler.length > 1 && (
            <button
              onClick={() => aktifFiltreler.forEach((f) => f.kaldir())}
              className="text-xs font-medium text-brand hover:underline"
            >
              Tümünü temizle
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-y border-zinc-100 bg-white text-xs font-medium text-zinc-400">
                {aktifSekme.kolonlar.map((k) => (
                  <th key={k.baslik} className="px-4 py-2.5">
                    {k.baslik}
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {gorunenler.map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`group cursor-pointer border-b border-zinc-50 last:border-0 hover:bg-zinc-50 ${
                    i % 2 === 1 ? "bg-zinc-50/50" : ""
                  }`}
                >
                  {aktifSekme.kolonlar.map((k) => (
                    <td key={k.baslik} className="px-4 py-3">
                      {k.hucre(a, hucreBaglami)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <span className="text-xs font-semibold text-brand group-hover:underline">
                      Detay
                    </span>
                  </td>
                </tr>
              ))}
              {gorunenler.length === 0 && (
                <tr>
                  <td
                    colSpan={aktifSekme.kolonlar.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Bu sekmede eşleşen kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <AdayDetayModal
          aday={selectedAday}
          onAdayGuncelle={guncelleAday}
          onClose={() => setSelectedId(null)}
        />
      )}

      {modalOpen && (
        <DavetModal
          onClose={() => setModalOpen(false)}
          onSubmit={({ ad, soyad, telefon, eposta, kulup }) => {
            // Sistem Yöneticisi bir mülakat rolü değil; şimdilik İK olarak kaydedilir —
            // bu rolün tam yetki modeli ayrıca ele alınacak.
            const mulakatRol = currentUser.rol === "Kulüp Müdürü" ? "Kulüp Müdürü" : "İK";
            const yeni: AdayEgitmen = {
              id: crypto.randomUUID(),
              themisId: yeniThemisId(),
              ad,
              soyad,
              telefon,
              eposta: eposta.trim() || undefined,
              kulup,
              mulakatiYapanRol: mulakatRol,
              mulakatiYapan: currentUser.ad,
              basvuruTarihi: bugununTarihi(),
              surecDurumu: "ilk_belge_seti_bekleniyor",
              ilkBelgeSeti: ilkBelgeSetiOlustur(mulakatRol),
              ikinciBelgeSeti: ikinciBelgeSetiOlustur(),
              aksiyonGecmisi: [
                {
                  tarih: bugununTarihi(),
                  aksiyon: "Aday eğitmen olarak eklendi",
                  yapan: `${currentUser.ad} (${currentUser.rol})`,
                },
              ],
            };
            setAdaylar((prev) => [yeni, ...prev]);
            setModalOpen(false);
            setSekme("aday");
            setSeciliKart(null);
            setInvited(`${ad} ${soyad}`);
          }}
        />
      )}
    </div>
  );
}

function DavetModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    ad: string;
    soyad: string;
    telefon: string;
    eposta: string;
    kulup: string;
  }) => void;
}) {
  const { currentUser } = useCurrentUser();
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [eposta, setEposta] = useState("");
  const [kulup, setKulup] = useState(currentUser.kulup);
  const { adaylar } = useAdaylar();

  // Aynı telefonla olumsuz sonuçlanmış bir kayıt varsa uyarı gösterilir; ekleme engellenmez.
  const anahtar = telefonAnahtari(telefon);
  const oncekiKayit =
    anahtar.length === 10
      ? adaylar.find((a) => telefonAnahtari(a.telefon) === anahtar && a.gorusmeSonucu === "Olumsuz")
      : undefined;
  const uyari = oncekiKayit ? tekrarBasvuruUyarisi(oncekiKayit) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Aday Eğitmen Ekle</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Ekleyen: {currentUser.ad} · {currentUser.rol}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ ad, soyad, telefon, eposta, kulup });
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Ad"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              required
              value={soyad}
              onChange={(e) => setSoyad(e.target.value)}
              placeholder="Soyad"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <input
            required
            type="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="Telefon"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {uyari && oncekiKayit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="font-semibold">{uyari}</div>
              <div className="mt-0.5 text-amber-700">
                Önceki kayıt: {oncekiKayit.ad} {oncekiKayit.soyad} · mülakat sonucu Olumsuz (
                {oncekiKayit.gorusmeSonucuTarihi}). Adayı yine de ekleyebilirsiniz.
              </div>
            </div>
          )}
          <select
            required
            value={kulup}
            onChange={(e) => setKulup(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              Eğitmenin çalışacağı potansiyel kulüp
            </option>
            {KULUPLER.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            required
            type="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            placeholder="E-posta (dijital üyelik hesabı)"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <p className="text-xs text-zinc-400">
            {currentUser.rol === "Kulüp Müdürü"
              ? "Mülakat Formu, Aday CV'si ve Bölge Müdürü Onayı yüklenmesi zorunlu olacak; dosyalar İK onayına gönderilecek."
              : "Mülakat Formu ve Aday CV'si yüklenmesi zorunlu olacak; dosyalar otonom onaylı sayılacak."}
          </p>
          <button
            type="submit"
            className="mt-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Aday Eğitmen Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
