"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  History,
  Info,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { BelgeIndirButonu } from "@/components/BelgeIndirButonu";
import { bugun, inputTarihindenCevir, tarihCoz, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import {
  ikYetkisiVarMi,
  KULLANICILAR,
  useCurrentUser,
} from "@/lib/CurrentUserContext";
import { sertifikaOnayla } from "@/lib/sertifikaOnay";
import {
  type AdimDurumu,
  aktifSertifika,
  aktifSertifikalar,
  BRANS_TANIMLARI,
  bransTanimi,
  FEDERASYONLAR,
  gecisSarti,
  kademeAdi,
  kademeGecmisi,
  kademeOnKosullari,
  kademeYolculugu,
  kaldigiDersSayisi,
  seminerVizeleriniGuncelle,
  type OnKosul,
  TEMEL_BRANS,
  TEMEL_EGITIM_DERSLERI,
  temelEgitimSonucuHesapla,
  VIZE_DURUMU_BILGI,
  vizeDurumu,
  vizeKalanGun,
} from "@/lib/sertifika";
import {
  type Muafiyet,
  muafiyetSuresi,
  sinavBransi,
  TEMEL_EGITIM_SEVIYE_SAYISI,
  temelEgitimSeviyesi,
  temelSeviyeDurumu,
} from "@/lib/temelEgitim";
import type {
  AdayEgitmen,
  Belge,
  EgitmenSertifikasi,
  GelisimSemineri,
  TemelEgitimSonucu,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Küçük yardımcılar                                                   */
/* ------------------------------------------------------------------ */

type OnayDurumu = { onaylandi: boolean; redSebebi?: string };

function OnayRozeti({ kayit }: { kayit: OnayDurumu }) {
  if (kayit.onaylandi) return null;
  return kayit.redSebebi ? (
    <span title={kayit.redSebebi}>
      <Badge label="Reddedildi" tone="red" />
    </span>
  ) : (
    <Badge label="İK onayı bekliyor" tone="orange" />
  );
}

type OnayTuru = "sertifika" | "seminer" | "temel";
type OnayKaydi = OnayDurumu & { id: string };

/**
 * Onay bekleyen kaydın durum rozeti. Onay / ret profilden yapılmaz; İK, Sonraki Aksiyon
 * alanındaki bekleyen kayıtlar kartından Onay Talepleri'ndeki pencereye gider.
 */
function OnayDurumAlani({ kayit }: { tur: OnayTuru; kayit: OnayKaydi }) {
  return <OnayRozeti kayit={kayit} />;
}

function vizeMetni(s: EgitmenSertifikasi): string {
  const kalan = vizeKalanGun(s);
  switch (vizeDurumu(s)) {
    case "gecmis":
      return `Vizesi geçmiş · ${-(kalan ?? 0)} gün önce doldu`;
    case "yaklasiyor":
      return kalan === 0 ? "Vize bugün bitiyor" : `Vize bitimine ${kalan} gün`;
    case "gecerli":
      return "Geçerli";
    default:
      return "Vize girilmedi";
  }
}

function VizeIsareti({ s, buyuk }: { s: EgitmenSertifikasi; buyuk?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 whitespace-nowrap ${
        buyuk
          ? "text-base font-semibold text-zinc-900"
          : "text-sm font-medium text-zinc-700"
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${VIZE_DURUMU_BILGI[vizeDurumu(s)].nokta}`}
      />
      {vizeMetni(s)}
    </span>
  );
}

function Bolum({
  baslik,
  aciklama,
  aksiyon,
  children,
}: {
  baslik: string;
  aciklama?: string;
  aksiyon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{baslik}</h3>
          {aciklama && (
            <p className="mt-0.5 text-xs text-zinc-400">{aciklama}</p>
          )}
        </div>
        {aksiyon}
      </div>
      {children}
    </section>
  );
}

const ikincilButon =
  "flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50";
const girdi =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

function Pencere({
  baslik,
  altBaslik,
  onClose,
  onKaydet,
  kaydedilebilir,
  kaydetMetni,
  genis,
  children,
}: {
  baslik: string;
  altBaslik?: string;
  onClose: () => void;
  onKaydet: () => void;
  kaydedilebilir: boolean;
  kaydetMetni: string;
  genis?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-2xl bg-white shadow-xl ${genis ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{baslik}</h2>
            {altBaslik && <p className="text-xs text-zinc-400">{altBaslik}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={onKaydet}
            disabled={!kaydedilebilir}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {kaydetMetni}
          </button>
        </div>
      </div>
    </div>
  );
}

function Etiketli({
  label,
  zorunlu,
  children,
}: {
  label: string;
  zorunlu?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-600">
        {label}
        {zorunlu && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

/** Kademe yolculuğu adımlarının görünümü. */
const ADIM_STILI: Record<
  AdimDurumu,
  { kutu: string; daire: string; etiket?: string }
> = {
  tamam: {
    kutu: "border-emerald-200 bg-emerald-50 text-emerald-700",
    daire: "bg-emerald-600 text-white",
  },
  onayda: {
    kutu: "border-amber-200 bg-amber-50 text-amber-800",
    daire: "bg-amber-500 text-white",
    etiket: "İK onayında",
  },
  basarisiz: {
    kutu: "border-rose-200 bg-rose-50 text-rose-700",
    daire: "bg-rose-600 text-white",
    etiket: "Başarısız",
  },
  bekleniyor: {
    kutu: "border-sky-200 bg-sky-50 text-sky-700",
    daire: "bg-sky-600 text-white",
    etiket: "Bekleniyor",
  },
  yok: {
    kutu: "border-zinc-200 text-zinc-500",
    daire: "bg-zinc-100 text-zinc-500",
  },
};

/** Belge dosyası seçimi; prototipte yalnızca dosya adı tutulur. */
function BelgeSecici({
  belge,
  onChange,
}: {
  belge?: Belge;
  onChange: (b: Belge) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">
      {belge ? (
        <FileText className="h-4 w-4 text-zinc-400" />
      ) : (
        <Upload className="h-4 w-4 text-zinc-400" />
      )}
      <span className="truncate">
        {belge ? belge.ad : "Dosya seç (PDF, JPG)"}
      </span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const dosya = e.target.files?.[0];
          if (dosya)
            onChange({
              ad: dosya.name,
              durum: "yuklendi",
              tarih: tarihYaz(bugun()),
            });
        }}
      />
    </label>
  );
}

const ON_KOSUL_IKONU: Record<OnKosul["anahtar"], typeof Clock> = {
  bekleme: Clock,
  seminer: GraduationCap,
  temel: BookOpen,
};

function OnKosulListesi({ kosullar }: { kosullar: OnKosul[] }) {
  return (
    <div
      className={`grid gap-2 ${kosullar.length > 1 ? "sm:grid-cols-3" : ""}`}
    >
      {kosullar.map((k) => {
        const stil = ADIM_STILI[k.durum];
        const Ikon = ON_KOSUL_IKONU[k.anahtar];
        return (
          <div
            key={k.anahtar}
            className={`rounded-lg border px-3 py-2 ${stil.kutu}`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${stil.daire}`}
              >
                {k.durum === "tamam" ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <Ikon className="h-3 w-3" />
                )}
              </span>
              {k.ad}
            </div>
            <div className="mt-1 text-[11px] leading-snug opacity-80">
              {k.detay}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Branşın kademe merdiveni: 1 Yardımcı → 2 Temel → 3 Kıdemli…; mevcut kademe dolu. */
function KademeMerdiveni({ brans, mevcut }: { brans: string; mevcut: number }) {
  const tanim = bransTanimi(brans);
  if (!tanim) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tanim.kademeler.map((unvan, i) => {
        const k = i + 1;
        return (
          <span key={k} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                k === mevcut
                  ? "bg-zinc-900 text-white"
                  : k < mevcut
                    ? "bg-zinc-200 text-zinc-700"
                    : "border border-dashed border-zinc-300 text-zinc-400"
              }`}
            >
              {k} {unvan}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formlar                                                             */
/* ------------------------------------------------------------------ */

type Form =
  | { tur: "sertifika"; brans?: string }
  | { tur: "temel"; brans?: string }
  | { tur: "seminer"; brans?: string }
  | null;

function SertifikaFormu({
  aday,
  sabitBrans,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  sabitBrans?: string;
  onClose: () => void;
  onKaydet: (
    s: Omit<EgitmenSertifikasi, "id" | "onaylandi" | "yukleyen">,
  ) => void;
}) {
  const [federasyon, setFederasyon] = useState(
    sabitBrans ? (bransTanimi(sabitBrans)?.federasyon ?? "") : "",
  );
  const [brans, setBrans] = useState(sabitBrans ?? "");
  const tanim = bransTanimi(brans);
  const mevcut = brans ? (aktifSertifika(aday, brans)?.kademe ?? 0) : 0;
  const enUst = tanim?.kademeSayisi ?? 5;
  const [kademe, setKademe] = useState(
    sabitBrans
      ? Math.min(enUst, kademeYolculugu(aday, sabitBrans).hedef ?? mevcut)
      : 0,
  );
  const [tarih, setTarih] = useState("");
  const [belge, setBelge] = useState<Belge>();
  const federasyonBranslari = BRANS_TANIMLARI.filter(
    (b) => b.federasyon === federasyon,
  );
  // Yeni (üst) kademe için ön koşullar; eski bir kademe belgesi girilirken aranmaz.
  const yeniKademe = !!brans && kademe > mevcut;
  const kosullar = yeniKademe ? kademeOnKosullari(aday, brans, kademe) : [];
  const sart = yeniKademe ? gecisSarti(brans, kademe) : undefined;
  const eksik = kosullar.some((k) => k.durum !== "tamam");

  return (
    <Pencere
      baslik={
        sabitBrans ? `${sabitBrans} kademe belgesi yükle` : "Sertifika ekle"
      }
      altBaslik="Belge İK onayına düşer; onaylandığında eğitmenin kademesi güncellenir."
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={!!brans && kademe > 0 && !!tarih && !!belge}
      onKaydet={() =>
        onKaydet({
          brans,
          kademe,
          belgeTarihi: inputTarihindenCevir(tarih),
          belge,
        })
      }
    >
      {sabitBrans ? (
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <div className="text-sm font-semibold text-zinc-900">
            {sabitBrans}
          </div>
          <div className="text-xs text-zinc-400">{tanim?.federasyon}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Etiketli label="Federasyon" zorunlu>
            <select
              value={federasyon}
              onChange={(e) => {
                const f = e.target.value;
                const branslar = BRANS_TANIMLARI.filter(
                  (b) => b.federasyon === f,
                );
                setFederasyon(f);
                setBrans(branslar.length === 1 ? branslar[0].ad : "");
                setKademe(0);
              }}
              className={girdi}
            >
              <option value="">Seçiniz</option>
              {FEDERASYONLAR.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Etiketli>
          <Etiketli label="Branş" zorunlu>
            <select
              value={brans}
              onChange={(e) => {
                setBrans(e.target.value);
                setKademe(0);
              }}
              disabled={!federasyon}
              className={girdi}
            >
              <option value="">Seçiniz</option>
              {federasyonBranslari.map((b) => (
                <option key={b.ad} value={b.ad}>
                  {b.ad}
                </option>
              ))}
            </select>
          </Etiketli>
        </div>
      )}

      {tanim && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-400">
            Kademe yapısı · {tanim.kademeSayisi} kademe
          </span>
          <KademeMerdiveni brans={brans} mevcut={mevcut} />
        </div>
      )}

      <Etiketli label="Kademe" zorunlu>
        <select
          value={kademe || ""}
          onChange={(e) => setKademe(Number(e.target.value))}
          disabled={!brans}
          className={girdi}
        >
          <option value="">Seçiniz</option>
          {Array.from({ length: enUst }, (_, i) => i + 1).map((k) => (
            <option key={k} value={k}>
              {kademeAdi(brans, k)}
              {k === mevcut ? " (mevcut)" : ""}
            </option>
          ))}
        </select>
      </Etiketli>

      {yeniKademe && (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
          <div className="text-xs font-semibold text-zinc-600">
            {kademe}. kademe ön koşulları
            {sart && (
              <span className="ml-1 font-normal text-zinc-400">
                · geçiş şartı {sart.yil} yıl
                {sart.seminer > 0 ? ` + ${sart.seminer} gelişim semineri` : ""}
              </span>
            )}
          </div>
          <OnKosulListesi kosullar={kosullar} />
          {eksik && (
            <div className="flex items-start gap-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ön koşullar sistemde tamamlanmış görünmüyor. Kayıt yine de İK
              onayına gider; İK belgeyi bu bilgiyle değerlendirir.
            </div>
          )}
        </div>
      )}

      <Etiketli label="Belge tarihi" zorunlu>
        <input
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          className={girdi}
        />
      </Etiketli>
      <Etiketli label="Belge dosyası" zorunlu>
        <BelgeSecici belge={belge} onChange={setBelge} />
      </Etiketli>
    </Pencere>
  );
}

function TemelEgitimFormu({
  aday,
  sabitBrans,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  sabitBrans?: string;
  onClose: () => void;
  onKaydet: (
    t: Omit<TemelEgitimSonucu, "id" | "onaylandi" | "yukleyen" | "tarih">,
  ) => void;
}) {
  const [brans, setBrans] = useState(sabitBrans ?? TEMEL_BRANS);
  const enUst = bransTanimi(brans)?.kademeSayisi ?? TEMEL_EGITIM_SEVIYE_SAYISI;
  const ilkEksikSeviye = (b: string) => {
    const k = temelEgitimSeviyesi(aday, b) + 1;
    return k <= (bransTanimi(b)?.kademeSayisi ?? TEMEL_EGITIM_SEVIYE_SAYISI)
      ? k
      : 0;
  };
  const [hedef, setHedef] = useState(ilkEksikSeviye(brans));
  const [tarih, setTarih] = useState("");
  const [katilmadi, setKatilmadi] = useState(false);
  const [dersler, setDersler] = useState<Record<string, "Geçti" | "Kaldı">>({});
  const [mazeret, setMazeret] = useState("");
  // Sınav sonuç belgesi; yüklenince ders sonuçları belgeden okunur (kontrol edilip düzeltilebilir).
  const [belge, setBelge] = useState<Belge>();
  const belgeYukle = (b: Belge) => {
    setBelge(b);
    setDersler(
      Object.fromEntries(
        TEMEL_EGITIM_DERSLERI.map((d) => [d, "Geçti" as const]),
      ),
    );
  };
  // Sınav sonucu ve kaldığı ders sayısı ders sonuçlarından otomatik hesaplanır (PRD 12.3).
  const sonuc = temelEgitimSonucuHesapla(katilmadi, dersler);
  const kalan = katilmadi
    ? 0
    : Object.values(dersler).filter((d) => d === "Kaldı").length;
  const hedefDurumu = hedef ? temelSeviyeDurumu(aday, hedef, brans) : null;
  return (
    <Pencere
      baslik="Temel eğitim ekle"
      altBaslik="Sınav sonuç belgesi yüklenir, ders sonuçları belgeden okunur; sonuç İK onayına düşer. Eğitmen bu belgeyi MAC+ üzerinden de yükleyebilir."
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={
        hedef > 0 &&
        !!tarih &&
        !!sonuc &&
        (katilmadi ? !!mazeret.trim() : !!belge)
      }
      onKaydet={() =>
        sonuc &&
        onKaydet({
          brans,
          hedefKademe: hedef,
          sinavTarihi: inputTarihindenCevir(tarih),
          sonuc,
          dersler: katilmadi ? {} : dersler,
          mazeret: mazeret.trim() || undefined,
          belge: katilmadi ? undefined : belge,
          kaynak: "Themis",
        })
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <Etiketli label="Branş" zorunlu>
          <select
            value={brans}
            onChange={(e) => {
              setBrans(e.target.value);
              setHedef(ilkEksikSeviye(e.target.value));
            }}
            className={girdi}
          >
            {BRANS_TANIMLARI.map((b) => (
              <option key={b.ad} value={b.ad}>
                {b.ad}
              </option>
            ))}
          </select>
        </Etiketli>
        <Etiketli label="Temel eğitim seviyesi" zorunlu>
          <select
            value={hedef || ""}
            onChange={(e) => setHedef(Number(e.target.value))}
            className={girdi}
          >
            <option value="">Seçiniz</option>
            {Array.from({ length: enUst }, (_, i) => i + 1).map((k) => {
              const d = temelSeviyeDurumu(aday, k, brans).durum;
              return (
                <option key={k} value={k}>
                  {k}. Kademe temel eğitimi
                  {d === "sinav"
                    ? " (tamamlandı)"
                    : d === "muaf"
                      ? " (muaf)"
                      : ""}
                </option>
              );
            })}
          </select>
        </Etiketli>
        <Etiketli label="Sınav tarihi" zorunlu>
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className={girdi}
          />
        </Etiketli>
      </div>
      {hedefDurumu?.durum === "muaf" && (
        <div className="flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Eğitmen bu seviyeden muaf ({hedefDurumu.muafiyet.kural}). Sonuç yine
          de kaydedilebilir.
        </div>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={katilmadi}
          onChange={(e) => setKatilmadi(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Sınava katılmadı
      </label>

      {!katilmadi && (
        <Etiketli label="Sınav sonuç belgesi" zorunlu>
          <BelgeSecici belge={belge} onChange={belgeYukle} />
        </Etiketli>
      )}

      <div
        className={`flex flex-col gap-2 ${!katilmadi && !belge ? "hidden" : ""}`}
      >
        <span className="text-sm font-medium text-zinc-600">
          Ders bazında sonuçlar
          {!katilmadi && (
            <span className="ml-1.5 text-xs font-normal text-zinc-400">
              belgeden okundu · kontrol edin
            </span>
          )}
        </span>
        <div
          className={`divide-y divide-zinc-100 rounded-xl border border-zinc-200 ${katilmadi ? "opacity-40" : ""}`}
        >
          {TEMEL_EGITIM_DERSLERI.map((d) => (
            <div
              key={d}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="text-sm text-zinc-700">{d}</span>
              <div className="flex gap-1.5">
                {(["Geçti", "Kaldı"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={katilmadi}
                    onClick={() => setDersler({ ...dersler, [d]: v })}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed ${
                      dersler[d] === v && !katilmadi
                        ? v === "Geçti"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                        : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 px-4 py-3">
        <div>
          <div className="text-xs text-zinc-400">Sınav sonucu (otomatik)</div>
          <div className="mt-1">
            {sonuc ? (
              <Badge
                label={sonuc.toLocaleUpperCase("tr-TR")}
                tone={
                  sonuc === "Geçti"
                    ? "green"
                    : sonuc === "Kaldı"
                      ? "red"
                      : "amber"
                }
              />
            ) : (
              <span className="text-sm text-zinc-400">
                Tüm dersler girilince
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">
            Kaldığı ders sayısı (otomatik)
          </div>
          <div className="mt-1 text-base font-bold text-zinc-900">
            {katilmadi ? "—" : kalan}
          </div>
        </div>
      </div>

      <Etiketli label="Mazeret" zorunlu={katilmadi}>
        <textarea
          value={mazeret}
          onChange={(e) => setMazeret(e.target.value)}
          rows={2}
          placeholder={katilmadi ? "Sınava katılmama nedeni" : "Varsa açıklama"}
          className={girdi}
        />
      </Etiketli>
    </Pencere>
  );
}

function SeminerFormu({
  aday,
  sabitBrans,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  sabitBrans?: string;
  onClose: () => void;
  onKaydet: (
    s: Pick<GelisimSemineri, "brans" | "ad" | "seminerTarihi" | "belge">,
  ) => void;
}) {
  const branslar = aktifSertifikalar(aday).map((s) => s.brans);
  const [brans, setBrans] = useState(sabitBrans ?? branslar[0] ?? "");
  const [ad, setAd] = useState("");
  const [tarih, setTarih] = useState("");
  const [belge, setBelge] = useState<Belge>();
  return (
    <Pencere
      baslik="Gelişim semineri ekle"
      altBaslik="Kademe geçişinde sayılır; yalnızca aktif kademe belgesinden sonraki seminerler geçerlidir."
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={!!brans && !!ad.trim() && !!tarih && !!belge}
      onKaydet={() =>
        onKaydet({
          brans,
          ad: ad.trim(),
          seminerTarihi: inputTarihindenCevir(tarih),
          belge: belge!,
        })
      }
    >
      <Etiketli label="Branş" zorunlu>
        <select
          value={brans}
          onChange={(e) => setBrans(e.target.value)}
          className={girdi}
        >
          {branslar.map((b) => (
            <option key={b} value={b}>
              {b} · {bransTanimi(b)?.federasyonKisa}
            </option>
          ))}
        </select>
      </Etiketli>
      <Etiketli label="Seminer adı" zorunlu>
        <input
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Ör. 2026 Antrenör Gelişim Semineri"
          className={girdi}
        />
      </Etiketli>
      <Etiketli label="Seminer tarihi" zorunlu>
        <input
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          className={girdi}
        />
      </Etiketli>
      <Etiketli label="Katılım belgesi" zorunlu>
        <BelgeSecici belge={belge} onChange={setBelge} />
      </Etiketli>
    </Pencere>
  );
}

/* ------------------------------------------------------------------ */
/* Branş kademe kartı                                                  */
/* ------------------------------------------------------------------ */

/** Kademe / temel eğitim seviyesi: kalın "4. Kademe", yanında soluk unvan "(Başantrenör)". */
function SeviyeGostergesi({
  etiket,
  seviye,
  unvan,
  ek = "",
}: {
  etiket: string;
  seviye: number;
  unvan?: string;
  // Kademe adının sonuna eklenir: "4. Kademe Temel Eğitimi".
  ek?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-zinc-500">{etiket}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-zinc-900">
          {seviye ? `${seviye}. Kademe${ek}` : "Yok"}
        </span>
        {unvan && (
          <span className="truncate text-sm text-zinc-500">({unvan})</span>
        )}
      </div>
    </div>
  );
}

/**
 * Yüklenen belge kutusu (belge setlerindeki gibi): dosya simgesi, adı ve hemen yanında görüntüle /
 * indir. Belge yoksa soluk bir boş durum metni gösterilir.
 */
function BelgeKutusu({
  belge,
  aday,
  bosMetin,
  onGoruntule,
}: {
  belge?: Belge;
  aday: AdayEgitmen;
  bosMetin: string;
  onGoruntule: (b: Belge) => void;
}) {
  if (!belge) {
    return (
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
        <FileText className="h-3.5 w-3.5 shrink-0" />
        {bosMetin}
      </span>
    );
  }
  return (
    <span className="flex w-fit min-w-0 max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-1.5 pr-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-zinc-600 shadow-sm">
        <FileText className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-zinc-800">
          {belge.ad}
        </span>
        <span className="block text-[11px] text-zinc-400">
          Yüklendi{belge.tarih ? ` · ${belge.tarih}` : ""}
        </span>
      </span>
      <span className="ml-1 flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onGoruntule(belge)}
          title="Görüntüle"
          aria-label={`${belge.ad} görüntüle`}
          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <BelgeIndirButonu belge={belge} aday={aday} />
      </span>
    </span>
  );
}

/**
 * Bir branşın temel eğitimi: en son tamamlanan seviye ve geçmiş (o branş için girilen sınavlar ve
 * o branşta geçerli muafiyetler). Eski seviyeler kapalı gelir. Başka branş için alınmış, 4 yıllık
 * süresi geçmemiş sınav bu branşta da sayılır; bu durumda hangi branşın sınavı olduğu yazar.
 */
function BransTemelEgitimi({
  aday,
  brans,
  onSinavGir,
  onDetay,
  onGoruntule,
}: {
  aday: AdayEgitmen;
  brans: string;
  onSinavGir?: (brans: string) => void;
  onDetay: (t: TemelEgitimSonucu) => void;
  onGoruntule: (b: Belge) => void;
}) {
  const [oncekilerAcik, setOncekilerAcik] = useState(false);
  const seviye = temelEgitimSeviyesi(aday, brans);
  const son = seviye ? temelSeviyeDurumu(aday, seviye, brans) : undefined;
  const gecerlilikBitisi =
    son?.durum === "sinav"
      ? son.gecerlilikBitisi
      : son?.durum === "muaf"
        ? son.muafiyet.bitis
        : null;
  // Seviye başına tek satır: o seviyeyi bu branşta tamamlayan kayıt (bu branşın sınavı ya da
  // muafiyet). Bunlara bu branşın onay bekleyen, kalınan ve süresi dolan denemeleri eklenir.
  const enUst = bransTanimi(brans)?.kademeSayisi ?? TEMEL_EGITIM_SEVIYE_SAYISI;
  const satirlar: (
    | { tur: "muaf"; anahtar: string; seviye: number; muafiyet: Muafiyet }
    | {
        tur: "sinav";
        anahtar: string;
        seviye: number;
        sonuc: TemelEgitimSonucu;
        suresiDoldu: boolean;
      }
  )[] = [];
  for (let k = 1; k <= enUst; k++) {
    const d = temelSeviyeDurumu(aday, k, brans);
    if (d.durum === "muaf") {
      satirlar.push({
        tur: "muaf",
        anahtar: `muaf-${k}`,
        seviye: k,
        muafiyet: d.muafiyet,
      });
    } else if (d.durum === "sinav" || d.durum === "suresi_doldu") {
      satirlar.push({
        tur: "sinav",
        anahtar: d.sonuc.id,
        seviye: k,
        sonuc: d.sonuc,
        suresiDoldu: d.durum === "suresi_doldu",
      });
    }
  }
  for (const t of aday.temelEgitimSonuclari ?? []) {
    // Onay bekleyen / reddedilen kayıtlar profilde görünmez; İK onaylayınca sayfaya düşer.
    const denemeMi = t.onaylandi && t.sonuc !== "Geçti";
    if (
      sinavBransi(t) === brans &&
      denemeMi &&
      !satirlar.some((g) => g.anahtar === t.id)
    ) {
      satirlar.push({
        tur: "sinav",
        anahtar: t.id,
        seviye: t.hedefKademe,
        sonuc: t,
        suresiDoldu: false,
      });
    }
  }
  satirlar.sort(
    (x, y) =>
      y.seviye - x.seviye ||
      (x.tur === "sinav" && y.tur === "sinav"
        ? (tarihCoz(y.sonuc.sinavTarihi)?.getTime() ?? 0) -
          (tarihCoz(x.sonuc.sinavTarihi)?.getTime() ?? 0)
        : 0),
  );
  // Mevcut seviye ve üstü (onay bekleyen / kalınan) görünür; alt seviyeler kapalı.
  const onceki = satirlar.filter((g) => g.seviye < seviye);
  const gorunen = oncekilerAcik
    ? satirlar
    : satirlar.filter((g) => g.seviye >= seviye);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <BookOpen className="h-3.5 w-3.5" />
          Temel eğitim
        </div>
        {onSinavGir && (
          <button onClick={() => onSinavGir(brans)} className={ikincilButon}>
            <Plus className="h-3.5 w-3.5" />
            Temel eğitim ekle
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center">
        <SeviyeGostergesi
          etiket="En son tamamlanan temel eğitim"
          seviye={seviye}
          ek=" Temel Eğitimi"
        />
        <div>
          <div className="text-sm text-zinc-500">Tamamlanma</div>
          <div className="mt-0.5 text-base font-semibold text-zinc-900">
            {son?.durum === "sinav" ? (
              <>{son.sonuc.sinavTarihi}</>
            ) : son?.durum === "muaf" ? (
              `Muaf · ${son.muafiyet.kural.split(" · ")[0]}`
            ) : (
              "—"
            )}
          </div>
        </div>
        <div>
          {/* Sınavdan 4 yıl; muafiyette mezuniyetten 4 yıl ya da süresiz. */}
          <div className="text-sm text-zinc-500">Geçerlilik bitişi</div>
          <div className="mt-0.5 text-base font-semibold text-zinc-900">
            {gecerlilikBitisi ? (
              <>
                {tarihYaz(gecerlilikBitisi)}
                {gecerlilikBitisi.getTime() < bugun().getTime() && (
                  <span className="ml-1.5 text-sm font-medium text-zinc-400">
                    doldu
                  </span>
                )}
              </>
            ) : son?.durum === "muaf" ? (
              "Süresiz"
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>

      {satirlar.length > 0 && (
        <div className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {gorunen.map((g) =>
            g.tur === "muaf" ? (
              <div
                key={g.anahtar}
                className="grid grid-cols-[minmax(0,15rem)_6rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-zinc-800">
                  {g.muafiyet.seviye}. Kademe Temel Eğitimi
                </span>
                <span className="text-zinc-500">—</span>
                <span className="truncate text-zinc-500">
                  {g.muafiyet.kural.split(" · ")[0]} ·{" "}
                  {muafiyetSuresi(g.muafiyet)}
                </span>
                <span className="flex items-center justify-end">
                  <Badge label="MUAF" tone="gray" />
                </span>
              </div>
            ) : (
              <div
                key={g.anahtar}
                className="grid w-full grid-cols-[minmax(0,15rem)_6rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left text-sm"
              >
                <span className="truncate font-medium text-zinc-800">
                  {g.sonuc.hedefKademe}. Kademe Temel Eğitimi
                </span>
                <span className="text-zinc-500">{g.sonuc.sinavTarihi}</span>
                {/* Sınav sonuç belgesi: belge kutusu, görüntüle / indir yanında. */}
                <BelgeKutusu
                  belge={g.sonuc.belge}
                  aday={aday}
                  onGoruntule={onGoruntule}
                  bosMetin={
                    g.sonuc.sonuc === "Katılmadı"
                      ? "Sınava katılmadı"
                      : "Belge yüklenmedi"
                  }
                />
                {/* Onay · sonuç · belge görüntüle / indir · en sağda dersler için Detay. */}
                <span className="flex items-center justify-end gap-2">
                  {!g.sonuc.onaylandi && (
                    <OnayDurumAlani tur="temel" kayit={g.sonuc} />
                  )}
                  {g.suresiDoldu ? (
                    <Badge label="SÜRESİ DOLDU" tone="red" />
                  ) : (
                    <Badge
                      label={g.sonuc.sonuc.toLocaleUpperCase("tr-TR")}
                      tone={
                        g.sonuc.sonuc === "Geçti"
                          ? "green"
                          : g.sonuc.sonuc === "Kaldı"
                            ? "red"
                            : "amber"
                      }
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onDetay(g.sonuc)}
                    title="Ders bazında sonuçlar"
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Detay
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ),
          )}
          {onceki.length > 0 && (
            <button
              type="button"
              onClick={() => setOncekilerAcik(!oncekilerAcik)}
              className="flex w-full items-center gap-1.5 px-4 py-2 text-left text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${oncekilerAcik ? "rotate-180" : ""}`}
              />
              {oncekilerAcik
                ? "Önceki seviyeleri gizle"
                : `Önceki seviyeler (${onceki.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Bir branştaki kademe: aktif belge ve kademe belgeleri. Bir üst kademenin takibi ayrı
 * "Kademe Takibi" bölümündedir. Fitness ve diğer branşlar aynı kartı kullanır.
 */
function BransKademeKarti({
  aday,
  brans,
  onGoruntule,
  onSinavGir,
  onTemelDetay,
}: {
  aday: AdayEgitmen;
  brans: string;
  onGoruntule: (b: Belge) => void;
  onSinavGir?: (brans: string) => void;
  onTemelDetay: (t: TemelEgitimSonucu) => void;
}) {
  const aktif = aktifSertifika(aday, brans);
  const tanim = bransTanimi(brans);
  // Yalnızca İK onaylı belgeler; bekleyenler Onay Talepleri'nde.
  const gecmis = kademeGecmisi(aday, brans).filter((s) => s.onaylandi);
  const [oncekilerAcik, setOncekilerAcik] = useState(false);
  // Aktif belge ve onay bekleyen/reddedilen belgeler her zaman görünür; eski onaylı belgeler kapalı.
  const oncekiMi = (s: EgitmenSertifikasi) => s.onaylandi && s.id !== aktif?.id;
  const onceki = gecmis.filter(oncekiMi);
  const gorunen = oncekilerAcik ? gecmis : gecmis.filter((s) => !oncekiMi(s));

  return (
    <div className="flex flex-col gap-4">
      {aktif ? (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center">
          <SeviyeGostergesi
            etiket="Kademe"
            seviye={aktif.kademe}
            unvan={tanim?.kademeler[aktif.kademe - 1]}
          />
          <div>
            <div className="text-sm text-zinc-500">Belge tarihi</div>
            <div className="mt-0.5 text-base font-semibold text-zinc-900">
              {aktif.belgeTarihi}
            </div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Vize</div>
            <VizeIsareti s={aktif} buyuk />
            <div className="mt-0.5 text-sm text-zinc-500">
              {aktif.vizeDonemi
                ? `Gelişim semineri ${aktif.vizeDonemi}`
                : "Gelişim semineri yok"}
            </div>
          </div>
        </div>
      ) : brans === TEMEL_BRANS ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Onaylı Fitness kademe belgesi yok. Fitness 1. kademe belgesi olmayan
          aday eğitmen olarak işe alınamaz.
        </div>
      ) : null}

      {gecmis.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <History className="h-3.5 w-3.5" />
            Kademe belgeleri
          </div>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
            {gorunen.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[minmax(0,15rem)_6rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-zinc-800">
                  {kademeAdi(brans, s.kademe)}
                </span>
                <span className="text-zinc-500">{s.belgeTarihi}</span>
                <BelgeKutusu
                  belge={s.belge}
                  aday={aday}
                  onGoruntule={onGoruntule}
                  bosMetin="Belge yüklenmedi"
                />
                <span className="flex items-center justify-end gap-2">
                  {s.id === aktif?.id ? (
                    <Badge label="Aktif" tone="green" />
                  ) : s.onaylandi ? (
                    <Badge label="Önceki" tone="gray" />
                  ) : (
                    <OnayDurumAlani tur="sertifika" kayit={s} />
                  )}
                </span>
              </div>
            ))}
            {onceki.length > 0 && (
              <button
                type="button"
                onClick={() => setOncekilerAcik(!oncekilerAcik)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${oncekilerAcik ? "rotate-180" : ""}`}
                />
                {oncekilerAcik
                  ? "Önceki belgeleri gizle"
                  : `Önceki belgeler (${onceki.length})`}
              </button>
            )}
          </div>
        </div>
      )}
      <BransTemelEgitimi
        aday={aday}
        brans={brans}
        onSinavGir={onSinavGir}
        onDetay={onTemelDetay}
        onGoruntule={onGoruntule}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kademe takibi                                                       */
/* ------------------------------------------------------------------ */

type TakipDurumu = "tamam" | "simdi" | "sonra";

/** Takip çizgisi: siyah tamamlanan, soluk kırmızı bulunulan adım, gri sonraki adımlar. */
const TAKIP_STILI: Record<TakipDurumu, { daire: string; baslik: string }> = {
  tamam: { daire: "bg-zinc-900 text-white", baslik: "text-zinc-900" },
  simdi: {
    daire: "bg-rose-100 text-rose-500 ring-4 ring-rose-50",
    baslik: "text-rose-500",
  },
  sonra: {
    daire: "border-2 border-dashed border-zinc-300 bg-white text-zinc-400",
    baslik: "text-zinc-400",
  },
};

type TakipAksiyonu = "sertifika" | "seminer" | "temel";

type TakipAdimi = {
  ad: string;
  durum: TakipDurumu;
  // Üzerine gelince / tıklayınca açılan ayrıntı.
  detay: string;
  aksiyon?: { etiket: string; tur: TakipAksiyonu };
  ikon?: typeof Clock;
  no?: number;
};

const ON_KOSUL_AKSIYONU: Partial<
  Record<OnKosul["anahtar"], TakipAdimi["aksiyon"]>
> = {
  seminer: { etiket: "Gelişim semineri ekle", tur: "seminer" },
  temel: { etiket: "Temel eğitim ekle", tur: "temel" },
};

/**
 * Takip çizgisinin sabit sütunları. Her branşta aynı sütunlar kullanılır ki alt alta duran
 * çizgiler hizalı olsun; şartı olmayan sütun (ör. 1→2'de seminer) boş geçilir.
 */
const TAKIP_SUTUNLARI = [
  "kademe",
  "bekleme",
  "seminer",
  "temel",
  "kurs",
] as const;

/**
 * Bir branşta mevcut kademeden bir üst kademeye giden yolun adımları (sütun sırasıyla, olmayan
 * adım null): mevcut kademe → bekleme → gelişim semineri → temel eğitim (muafsa tamamlanmış
 * sayılır) → kademe kursu (belge). Yalnızca bulunulan adım (tamamlanmamış ilk adım) vurgulanır.
 */
function takipAdimlari(
  aday: AdayEgitmen,
  brans: string,
): (TakipAdimi | null)[] | null {
  const yol = kademeYolculugu(aday, brans);
  const aktif = aktifSertifika(aday, brans);
  if (!yol.hedef) return null;
  const kosul = (anahtar: OnKosul["anahtar"]) =>
    yol.onKosullar.find((k) => k.anahtar === anahtar);

  const ham: ((Omit<TakipAdimi, "durum"> & { tamam: boolean }) | null)[] =
    TAKIP_SUTUNLARI.map((sutun) => {
      if (sutun === "kademe") {
        return {
          ad: aktif ? `${aktif.kademe}. Kademe` : "Belge yok",
          tamam: !!aktif,
          no: aktif?.kademe,
          detay: aktif
            ? `${kademeAdi(brans, aktif.kademe)} · belge ${aktif.belgeTarihi}`
            : "Bu branşta onaylı kademe belgesi yok.",
        };
      }
      if (sutun === "kurs") {
        // Kademe kursu = federasyonun kademe belgesi; ayrı bir uygulamalı eğitim takibi yoktur.
        return {
          ad: `${yol.hedef}. Kademe kursu`,
          tamam: false,
          no: yol.hedef!,
          detay:
            yol.durum === "belge_onayda"
              ? `${yol.hedef}. kademe belgesi yüklendi, İK onayında.`
              : `${kademeAdi(brans, yol.hedef!)}. Kurs belgesi yüklenip İK onaylayınca kademe güncellenir.${
                  yol.hakKurali
                    ? ` Mezuniyetle doğrudan başvuru: ${yol.hakKurali}.`
                    : ""
                }`,
          aksiyon:
            yol.durum === "belge_onayda"
              ? undefined
              : { etiket: "Kademe belgesi yükle", tur: "sertifika" as const },
        };
      }
      const k = kosul(sutun);
      if (!k) return null;
      return {
        // Şartın kendisi: "2 yıl bekleme", "2 gelişim semineri", "3. Kademe temel eğitim".
        ad: k.ad,
        tamam: k.durum === "tamam",
        ikon: ON_KOSUL_IKONU[k.anahtar],
        detay: k.detay,
        aksiyon: k.durum === "tamam" ? undefined : ON_KOSUL_AKSIYONU[k.anahtar],
      };
    });
  const simdi = ham.findIndex((x, i) => i > 0 && !!x && !x.tamam);
  return ham.map((x, i) =>
    x
      ? (({ tamam, ...adim }) => ({
          ...adim,
          durum: (tamam
            ? "tamam"
            : i === simdi
              ? "simdi"
              : "sonra") as TakipDurumu,
        }))(x)
      : null,
  );
}

/** İki sütun arasındaki çizginin rengi: boş sütunlar atlanarak komşu adımlara göre. */
function baglantiRengi(adimlar: (TakipAdimi | null)[], i: number): string {
  const sol = adimlar.slice(0, i + 1).findLast((x) => !!x);
  const sagIndeks = adimlar.findIndex((x, j) => j > i && !!x);
  const sag = adimlar[sagIndeks];
  if (sol?.durum === "tamam" && sag?.durum === "tamam") return "bg-zinc-900";
  if (sol?.durum === "tamam" && sag?.durum === "simdi") {
    return sagIndeks === i + 1
      ? "bg-gradient-to-r from-zinc-900 to-rose-200"
      : "bg-zinc-900";
  }
  return "bg-zinc-200";
}

function KademeTakipCizgisi({
  adimlar,
  brans,
  onAksiyon,
}: {
  adimlar: (TakipAdimi | null)[];
  brans: string;
  onAksiyon?: (tur: TakipAksiyonu, brans: string) => void;
}) {
  const [acik, setAcik] = useState<number | null>(null);
  return (
    <ol className="grid grid-cols-5">
      {adimlar.map((adim, i) => {
        const cizgi =
          i < adimlar.length - 1 ? (
            <span
              className={`absolute left-1/2 top-[15px] h-0.5 w-full ${baglantiRengi(adimlar, i)}`}
            />
          ) : null;
        // Şartı olmayan sütun: yalnızca çizgi geçer (önceki sütunun çizgisi buraya kadar uzanır).
        if (!adim) {
          return (
            <li key={i} className="relative">
              {cizgi}
            </li>
          );
        }
        const stil = TAKIP_STILI[adim.durum];
        const Ikon = adim.ikon;
        const hiza =
          i === 0
            ? "left-0"
            : i === adimlar.length - 1
              ? "right-0"
              : "left-1/2 -translate-x-1/2";
        return (
          <li
            key={i}
            className="group relative flex flex-col items-center px-1 text-center"
            onMouseLeave={() => acik === i && setAcik(null)}
          >
            {cizgi}
            <button
              type="button"
              onClick={() => setAcik(acik === i ? null : i)}
              className="relative z-10 flex flex-col items-center rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110 ${stil.daire}`}
              >
                {adim.no ? (
                  adim.no
                ) : adim.durum === "tamam" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : Ikon ? (
                  <Ikon className="h-4 w-4" />
                ) : null}
              </span>
              <span
                className={`mt-2 text-xs font-semibold leading-tight ${stil.baslik}`}
              >
                {adim.ad}
              </span>
            </button>

            {/* pt-2: adım ile kutu arasındaki boşlukta hover kaybolmasın. */}
            <div
              className={`absolute top-full z-30 w-60 pt-2 text-left ${hiza} ${
                acik === i ? "block" : "hidden group-hover:block"
              }`}
            >
              <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
                <div className="text-sm font-semibold text-zinc-900">
                  {adim.ad}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-zinc-600">
                  {adim.detay}
                </div>
                {adim.aksiyon && onAksiyon && (
                  <button
                    type="button"
                    onClick={() => {
                      setAcik(null);
                      onAksiyon(adim.aksiyon!.tur, brans);
                    }}
                    className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {adim.aksiyon.etiket}
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Kademe takibi: Fitness açık; diğer federasyonlar tek satır olarak kapalı gelir, okla açılır.
 * Kapalı satırda bulunulan adım yazar.
 */
function KademeTakibi({
  aday,
  branslar,
  onAksiyon,
}: {
  aday: AdayEgitmen;
  branslar: string[];
  onAksiyon?: (tur: TakipAksiyonu, brans: string) => void;
}) {
  const [aciklar, setAciklar] = useState<string[]>([TEMEL_BRANS]);
  return (
    <div className="flex flex-col divide-y divide-zinc-100">
      {branslar.map((b) => {
        const adimlar = takipAdimlari(aday, b);
        if (!adimlar) return null;
        const acik = aciklar.includes(b);
        const mevcut = aktifSertifika(aday, b)?.kademe ?? 0;
        return (
          <div key={b} className="py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() =>
                setAciklar(
                  acik ? aciklar.filter((x) => x !== b) : [...aciklar, b],
                )
              }
              className="flex w-full items-baseline gap-2 rounded-lg py-1 text-left"
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 self-center text-zinc-400 transition-transform ${acik ? "" : "-rotate-90"}`}
              />
              <span className="text-sm font-semibold text-zinc-900">{b}</span>
              <span className="text-xs text-zinc-400">
                {mevcut ? `${mevcut}. Kademe` : "Belge yok"} →{" "}
                {kademeYolculugu(aday, b).hedef}. Kademe
              </span>
            </button>
            {acik && (
              <div className="pb-2 pt-4">
                <KademeTakipCizgisi
                  adimlar={adimlar}
                  brans={b}
                  onAksiyon={onAksiyon}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ana bileşen                                                         */
/* ------------------------------------------------------------------ */

/**
 * Federasyon sertifikaları, temel eğitim seviyesi, gelişim seminerleri, vizeler ve spor eğitimi
 * muafiyetleri (PRD 12). KM/KMY'nin girdiği kayıtlar İK onayına düşer (Onay Talepleri); İK'nın
 * girdiği kayıtlar doğrudan onaylı sayılır.
 */
export function SertifikaYonetimi({
  aday: kayit,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  // Vize her zaman gelişim seminerlerinden hesaplanır; kayıttaki eski vize tarihine güvenilmez.
  const aday = seminerVizeleriniGuncelle(kayit);
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [form, setForm] = useState<Form>(null);
  const [temelDetay, setTemelDetay] = useState<TemelEgitimSonucu | null>(null);
  const [onizleme, setOnizleme] = useState<Belge | null>(null);
  const ik = ikYetkisiVarMi(currentUser.rol);
  const yapan = `${currentUser.ad} (${currentUser.rol})`;
  const duzenlenebilir = !!onAdayGuncelle;
  const bugunStr = tarihYaz(bugun());

  const aktifler = aktifSertifikalar(aday);
  const digerBranslar = [
    ...new Set(
      (aday.sertifikalar ?? [])
        .filter((s) => s.brans !== TEMEL_BRANS)
        .map((s) => s.brans),
    ),
  ];
  // Takip: en üst kademede olmayan branşlar, Fitness önce.
  const takipBranslari = [TEMEL_BRANS, ...digerBranslar].filter(
    (b) => kademeYolculugu(aday, b).hedef !== null,
  );
  // Vizesi geçmiş ya da 30 günden az kalan aktif sertifikalar.
  const vizeUyarilari = aktifler.filter((s) => {
    const d = vizeDurumu(s);
    return d === "gecmis" || d === "yaklasiyor";
  });
  // Yalnızca İK onaylı seminerler; bekleyenler Onay Talepleri'nde.
  const seminerler = (aday.gelisimSeminerleri ?? [])
    .filter((g) => g.onaylandi)
    .sort(
      (x, y) =>
        (tarihCoz(y.seminerTarihi)?.getTime() ?? 0) -
        (tarihCoz(x.seminerTarihi)?.getTime() ?? 0),
    );

  /** KM kaydı İK onayına düşer ve İK'ya bildirim gider; İK kaydı doğrudan onaylıdır. */
  const kaydet = (yeni: AdayEgitmen, baslik: string, talep: string) => {
    onAdayGuncelle?.(yeni);
    if (!ik) {
      bildirimEkle({
        aliciRol: "İK",
        aliciAd: KULLANICILAR["İK"].ad,
        baslik: `${aday.ad} ${aday.soyad}: ${baslik}`,
        mesaj: "Onayınızı bekliyor.",
        planlayan: yapan,
        tarih: bugunStr,
        adayId: aday.id,
        link: `/onay-bekleyenler?aday=${aday.id}&talep=${talep}`,
      });
    }
    setForm(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1 — Kademe takibi: bir üst kademe için kademe + temel eğitim tek çizgide */}
      {takipBranslari.length > 0 && (
        <Bolum baslik="Kademe Takibi">
          <KademeTakibi
            aday={aday}
            branslar={takipBranslari}
            onAksiyon={
              duzenlenebilir
                ? (tur, brans) =>
                    setForm(tur === "temel" ? { tur: "temel" } : { tur, brans })
                : undefined
            }
          />
        </Bolum>
      )}

      {/* 2 — Fitness kademesi */}
      <Bolum
        baslik="Fitness Kademesi"
        aciklama={bransTanimi(TEMEL_BRANS)?.federasyon}
        aksiyon={
          duzenlenebilir && (
            <button
              onClick={() => setForm({ tur: "sertifika", brans: TEMEL_BRANS })}
              className={ikincilButon}
            >
              <Upload className="h-3.5 w-3.5" />
              Kademe belgesi yükle
            </button>
          )
        }
      >
        <BransKademeKarti
          aday={aday}
          brans={TEMEL_BRANS}
          onGoruntule={setOnizleme}
          onSinavGir={
            duzenlenebilir
              ? (b) => setForm({ tur: "temel", brans: b })
              : undefined
          }
          onTemelDetay={setTemelDetay}
        />
      </Bolum>

      {/* 3 — Gelişim seminerleri */}
      <Bolum
        baslik="Gelişim Seminerleri"
        aciklama="Aktif kademe belgesinden sonraki seminerler kademe geçişinde sayılır; son 1 yıl içindeki onaylı seminer sertifikanın vizesini yeniler."
        aksiyon={
          duzenlenebilir &&
          aktifler.length > 0 && (
            <button
              onClick={() => setForm({ tur: "seminer" })}
              className={ikincilButon}
            >
              <Plus className="h-3.5 w-3.5" />
              Gelişim semineri ekle
            </button>
          )
        }
      >
        {vizeUyarilari.length > 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {vizeUyarilari.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-semibold">{s.brans}:</span>{" "}
                  {vizeDurumu(s) === "gecmis"
                    ? `son 1 yılda gelişim semineri yok, vize ${s.vizeBitisTarihi} tarihinde doldu.`
                    : `vize ${s.vizeBitisTarihi} tarihinde doluyor; yeni gelişim semineri gerekli.`}
                </span>
              </div>
            ))}
          </div>
        )}
        {seminerler.length === 0 ? (
          <p className="text-sm text-zinc-400">Gelişim semineri girilmedi.</p>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
            {seminerler.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[7rem_minmax(0,1fr)_6rem_auto] items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-800">{s.brans}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-zinc-600">
                  <span className="truncate">{s.ad}</span>
                  <button
                    type="button"
                    onClick={() => setOnizleme(s.belge)}
                    title="Görüntüle"
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <BelgeIndirButonu belge={s.belge} aday={aday} />
                </span>
                <span className="text-zinc-500">{s.seminerTarihi}</span>
                <span className="flex items-center gap-2">
                  {/* Onaylı seminerde rozet yok; yalnızca onay bekleyen / reddedilen işaretlenir. */}
                  <OnayDurumAlani tur="seminer" kayit={s} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Bolum>

      {/* 4 — Diğer branşlar */}
      <Bolum
        baslik="Diğer Branşlar"
        aciklama="Fitness dışındaki federasyon sertifikaları ve kademeleri."
        aksiyon={
          duzenlenebilir && (
            <button
              onClick={() => setForm({ tur: "sertifika" })}
              className={ikincilButon}
            >
              <Plus className="h-3.5 w-3.5" />
              Sertifika ekle
            </button>
          )
        }
      >
        {digerBranslar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
            Fitness dışında sertifika eklenmedi.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {digerBranslar.map((brans) => (
              <div
                key={brans}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {brans}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {bransTanimi(brans)?.federasyon}
                    </div>
                  </div>
                  {duzenlenebilir && (
                    <button
                      onClick={() => setForm({ tur: "sertifika", brans })}
                      className={ikincilButon}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Kademe belgesi
                    </button>
                  )}
                </div>
                <BransKademeKarti
                  aday={aday}
                  brans={brans}
                  onGoruntule={setOnizleme}
                  onSinavGir={
                    duzenlenebilir
                      ? (b) => setForm({ tur: "temel", brans: b })
                      : undefined
                  }
                  onTemelDetay={setTemelDetay}
                />
              </div>
            ))}
          </div>
        )}
      </Bolum>

      {onizleme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOnizleme(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-zinc-900">
                {onizleme.ad}
              </h3>
              <button
                onClick={() => setOnizleme(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 py-10 text-zinc-400">
              <FileText className="h-10 w-10" />
              <p className="text-xs">{onizleme.tarih} tarihinde yüklendi</p>
            </div>
            <div className="mt-4 flex justify-end">
              <BelgeIndirButonu belge={onizleme} aday={aday} etiket="İndir" />
            </div>
          </div>
        </div>
      )}
      {temelDetay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTemelDetay(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  {temelDetay.hedefKademe}. Kademe Temel Eğitimi
                </h2>
                <p className="text-xs text-zinc-400">
                  Anadolu Üniversitesi temel eğitim sınavı ·{" "}
                  {temelDetay.sinavTarihi}
                </p>
              </div>
              <button
                onClick={() => setTemelDetay(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              {temelDetay.belge ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {temelDetay.belge.ad}
                      </span>
                      <span className="block text-xs text-zinc-400">
                        Sınav sonuç belgesi
                        {temelDetay.kaynak === "MAC+" &&
                          " · eğitmen MAC+'tan yükledi"}
                        {" · "}ders sonuçları belgeden okundu
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOnizleme(temelDetay.belge!)}
                      title="Görüntüle"
                      className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <BelgeIndirButonu belge={temelDetay.belge} aday={aday} />
                  </span>
                </div>
              ) : (
                temelDetay.sonuc !== "Katılmadı" && (
                  <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-400">
                    Sınav sonuç belgesi yüklenmedi.
                  </div>
                )
              )}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 px-4 py-3">
                <div>
                  <div className="text-xs text-zinc-400">Sınav sonucu</div>
                  <div className="mt-1">
                    <Badge
                      label={temelDetay.sonuc.toLocaleUpperCase("tr-TR")}
                      tone={
                        temelDetay.sonuc === "Geçti"
                          ? "green"
                          : temelDetay.sonuc === "Kaldı"
                            ? "red"
                            : "amber"
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">
                    Kaldığı ders sayısı
                  </div>
                  <div className="mt-1 text-base font-bold text-zinc-900">
                    {temelDetay.sonuc === "Katılmadı"
                      ? "—"
                      : kaldigiDersSayisi(temelDetay)}
                  </div>
                </div>
              </div>
              {temelDetay.sonuc !== "Katılmadı" && (
                <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                  {TEMEL_EGITIM_DERSLERI.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <span className="text-sm text-zinc-700">{d}</span>
                      {temelDetay.dersler[d] ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            temelDetay.dersler[d] === "Kaldı"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {temelDetay.dersler[d]!.toLocaleUpperCase("tr-TR")}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="text-xs text-zinc-400">Mazeret</div>
                <div className="mt-1 text-sm text-zinc-700">
                  {temelDetay.mazeret || "—"}
                </div>
              </div>
              {temelDetay.redSebebi && (
                <div className="text-sm text-rose-600">
                  Ret nedeni: {temelDetay.redSebebi}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                <span>
                  Giren: {temelDetay.yukleyen} · {temelDetay.tarih}
                </span>
                {temelDetay.onaylandi ? (
                  <span>Onaylı</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <OnayDurumAlani tur="temel" kayit={temelDetay} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {form?.tur === "sertifika" && (
        <SertifikaFormu
          aday={aday}
          sabitBrans={form.brans}
          onClose={() => setForm(null)}
          onKaydet={(v) => {
            const id = `s${Date.now()}`;
            const eklenmis: AdayEgitmen = {
              ...aday,
              sertifikalar: [
                ...(aday.sertifikalar ?? []),
                { ...v, id, onaylandi: false, yukleyen: yapan, vizeler: [] },
              ],
            };
            kaydet(
              ik ? sertifikaOnayla(eklenmis, id) : eklenmis,
              `${v.brans} ${v.kademe}. kademe belgesi onay bekliyor`,
              `${aday.id}-sertifika-${id}`,
            );
          }}
        />
      )}
      {form?.tur === "temel" && (
        <TemelEgitimFormu
          aday={aday}
          sabitBrans={form.brans}
          onClose={() => setForm(null)}
          onKaydet={(v) => {
            const id = `t${Date.now()}`;
            kaydet(
              {
                ...aday,
                temelEgitimSonuclari: [
                  ...(aday.temelEgitimSonuclari ?? []),
                  {
                    ...v,
                    id,
                    onaylandi: ik,
                    yukleyen: yapan,
                    tarih: bugunStr,
                  },
                ],
              },
              `${v.hedefKademe}. kademe temel eğitim sonucu onay bekliyor`,
              `${aday.id}-temel-${id}`,
            );
          }}
        />
      )}
      {form?.tur === "seminer" && (
        <SeminerFormu
          aday={aday}
          sabitBrans={form.brans}
          onClose={() => setForm(null)}
          onKaydet={(v) => {
            const id = `gs${Date.now()}`;
            kaydet(
              // İK'nın girdiği seminer onaylıdır ve vizeyi hemen yeniler.
              seminerVizeleriniGuncelle({
                ...aday,
                gelisimSeminerleri: [
                  ...(aday.gelisimSeminerleri ?? []),
                  {
                    ...v,
                    id,
                    onaylandi: ik,
                    yukleyen: yapan,
                    tarih: bugunStr,
                  },
                ],
              }),
              `${v.brans} gelişim semineri onay bekliyor`,
              `${aday.id}-seminer-${id}`,
            );
          }}
        />
      )}
    </div>
  );
}
