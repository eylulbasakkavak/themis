"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { AlertTriangle, Check, FileText, History, Plus, Upload, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { bugun, inputTarihindenCevir, tarihCoz, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { sertifikaOnayla } from "@/lib/sertifikaOnay";
import {
  aktifSertifika,
  aktifSertifikalar,
  BRANS_TANIMLARI,
  bransTanimi,
  kademeGecmisi,
  kademeYolculugu,
  kaldigiDersSayisi,
  TEMEL_BRANS,
  TEMEL_EGITIM_DERSLERI,
  VIZE_DURUMU_BILGI,
  vizeDurumu,
  vizeKalanGun,
} from "@/lib/sertifika";
import type {
  AdayEgitmen,
  Belge,
  EgitmenSertifikasi,
  SertifikaVizesi,
  TemelEgitimSonucu,
  TemelEgitimSonucuTipi,
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

function VizeIsareti({ s }: { s: EgitmenSertifikasi }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-zinc-700">
      <span className={`h-2 w-2 shrink-0 rounded-full ${VIZE_DURUMU_BILGI[vizeDurumu(s)].nokta}`} />
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
          <h3 className="text-sm font-semibold text-zinc-900">{baslik}</h3>
          {aciklama && <p className="mt-0.5 text-xs text-zinc-400">{aciklama}</p>}
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
  children,
}: {
  baslik: string;
  altBaslik?: string;
  onClose: () => void;
  onKaydet: () => void;
  kaydedilebilir: boolean;
  kaydetMetni: string;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{baslik}</h2>
            {altBaslik && <p className="text-xs text-zinc-400">{altBaslik}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">{children}</div>
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

/** Belge dosyası seçimi; prototipte yalnızca dosya adı tutulur. */
function BelgeSecici({ belge, onChange }: { belge?: Belge; onChange: (b: Belge) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">
      {belge ? (
        <FileText className="h-4 w-4 text-zinc-400" />
      ) : (
        <Upload className="h-4 w-4 text-zinc-400" />
      )}
      <span className="truncate">{belge ? belge.ad : "Dosya seç (PDF, JPG)"}</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const dosya = e.target.files?.[0];
          if (dosya) onChange({ ad: dosya.name, durum: "yuklendi", tarih: tarihYaz(bugun()) });
        }}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Formlar                                                             */
/* ------------------------------------------------------------------ */

type Form =
  | { tur: "sertifika"; brans?: string }
  | { tur: "vize"; sertifika: EgitmenSertifikasi }
  | { tur: "temel" }
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
  onKaydet: (s: Omit<EgitmenSertifikasi, "id" | "onaylandi" | "yukleyen">) => void;
}) {
  const [brans, setBrans] = useState(sabitBrans ?? "");
  const mevcut = brans ? (aktifSertifika(aday, brans)?.kademe ?? 0) : 0;
  const enUst = bransTanimi(brans)?.kademeSayisi ?? 5;
  const [kademe, setKademe] = useState(sabitBrans ? Math.min(enUst, mevcut + 1) : 0);
  const [tarih, setTarih] = useState("");
  const [belge, setBelge] = useState<Belge>();
  return (
    <Pencere
      baslik={sabitBrans ? `${sabitBrans} kademe belgesi yükle` : "Sertifika ekle"}
      altBaslik="Belge İK onayına düşer; onaylandığında eğitmenin kademesi güncellenir."
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={!!brans && kademe > 0 && !!tarih && !!belge}
      onKaydet={() => onKaydet({ brans, kademe, belgeTarihi: inputTarihindenCevir(tarih), belge })}
    >
      {!sabitBrans && (
        <Etiketli label="Branş" zorunlu>
          <select
            value={brans}
            onChange={(e) => {
              setBrans(e.target.value);
              setKademe(0);
            }}
            className={girdi}
          >
            <option value="">Seçiniz</option>
            {BRANS_TANIMLARI.filter((b) => b.ad !== TEMEL_BRANS).map((b) => (
              <option key={b.ad} value={b.ad}>
                {b.ad} · {b.federasyon}
              </option>
            ))}
          </select>
        </Etiketli>
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
              {k}. Kademe{k === mevcut ? " (mevcut)" : ""}
            </option>
          ))}
        </select>
      </Etiketli>
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

function VizeFormu({
  sertifika,
  onClose,
  onKaydet,
}: {
  sertifika: EgitmenSertifikasi;
  onClose: () => void;
  onKaydet: (v: Pick<SertifikaVizesi, "donem" | "bitisTarihi" | "belge">) => void;
}) {
  const yil = bugun().getFullYear();
  const donemler = [
    `${yil - 1}-${yil} Sezonu`,
    `${yil}-${yil + 1} Sezonu`,
    `${yil + 1}-${yil + 2} Sezonu`,
  ];
  const [donem, setDonem] = useState(donemler[1]);
  const [bitis, setBitis] = useState("");
  const [belge, setBelge] = useState<Belge>();
  return (
    <Pencere
      baslik="Vize bilgisi gir"
      altBaslik={`${sertifika.brans} · ${sertifika.kademe}. Kademe — İK, geçerlilik tarihini vize belgesiyle karşılaştırıp onaylar.`}
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={!!donem && !!bitis && !!belge}
      onKaydet={() => onKaydet({ donem, bitisTarihi: inputTarihindenCevir(bitis), belge: belge! })}
    >
      <Etiketli label="Vize dönemi" zorunlu>
        <select value={donem} onChange={(e) => setDonem(e.target.value)} className={girdi}>
          {donemler.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </Etiketli>
      <Etiketli label="Vize geçerlilik bitiş tarihi" zorunlu>
        <input
          type="date"
          value={bitis}
          onChange={(e) => setBitis(e.target.value)}
          className={girdi}
        />
      </Etiketli>
      <Etiketli label="Vize belgesi" zorunlu>
        <BelgeSecici belge={belge} onChange={setBelge} />
        <span className="text-xs text-zinc-400">
          Federasyon / Spor Bilgi Sistemi vize belgesi ya da vize/gelişim semineri katılım belgesi.
        </span>
      </Etiketli>
    </Pencere>
  );
}

function TemelEgitimFormu({
  aday,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  onClose: () => void;
  onKaydet: (t: Omit<TemelEgitimSonucu, "id" | "onaylandi" | "yukleyen" | "tarih">) => void;
}) {
  const [brans, setBrans] = useState(TEMEL_BRANS);
  const [hedef, setHedef] = useState(kademeYolculugu(aday, TEMEL_BRANS).hedef ?? 0);
  const [tarih, setTarih] = useState("");
  const [sonuc, setSonuc] = useState<TemelEgitimSonucuTipi | "">("");
  const [dersler, setDersler] = useState<Record<string, "Geçti" | "Kaldı">>({});
  const [mazeret, setMazeret] = useState("");
  const katilmadi = sonuc === "Katılmadı";
  const derslerTamam = TEMEL_EGITIM_DERSLERI.every((d) => dersler[d]);
  const kalan = Object.values(dersler).filter((d) => d === "Kaldı").length;
  const enUst = bransTanimi(brans)?.kademeSayisi ?? 5;
  return (
    <Pencere
      baslik="Temel eğitim sonucu gir"
      altBaslik="Anadolu Üniversitesi temel eğitim sınavı; sonuç İK onayına düşer."
      onClose={onClose}
      kaydetMetni="Kaydet"
      kaydedilebilir={
        hedef > 0 && !!tarih && !!sonuc && (katilmadi ? !!mazeret.trim() : derslerTamam)
      }
      onKaydet={() =>
        sonuc &&
        onKaydet({
          brans,
          hedefKademe: hedef,
          sinavTarihi: inputTarihindenCevir(tarih),
          sonuc,
          dersler: katilmadi ? {} : dersler,
          mazeret: katilmadi ? mazeret.trim() : undefined,
        })
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Etiketli label="Branş" zorunlu>
          <select
            value={brans}
            onChange={(e) => {
              setBrans(e.target.value);
              setHedef(kademeYolculugu(aday, e.target.value).hedef ?? 0);
            }}
            className={girdi}
          >
            {BRANS_TANIMLARI.map((b) => (
              <option key={b.ad}>{b.ad}</option>
            ))}
          </select>
        </Etiketli>
        <Etiketli label="Hedef kademe" zorunlu>
          <select
            value={hedef || ""}
            onChange={(e) => setHedef(Number(e.target.value))}
            className={girdi}
          >
            <option value="">Seçiniz</option>
            {Array.from({ length: enUst }, (_, i) => i + 1).map((k) => (
              <option key={k} value={k}>
                {k}. Kademe
              </option>
            ))}
          </select>
        </Etiketli>
      </div>
      <Etiketli label="Sınav tarihi" zorunlu>
        <input
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          className={girdi}
        />
      </Etiketli>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-600">
          Sınav sonucu<span className="ml-0.5 text-rose-500">*</span>
        </span>
        <div className="flex gap-2">
          {(["Geçti", "Kaldı", "Katılmadı"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSonuc(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                sonuc === s
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {sonuc && !katilmadi && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-600">
            Ders bazında sonuçlar<span className="ml-0.5 text-rose-500">*</span>
          </span>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {TEMEL_EGITIM_DERSLERI.map((d) => (
              <div key={d} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-zinc-700">{d}</span>
                <div className="flex gap-1.5">
                  {(["Geçti", "Kaldı"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDersler({ ...dersler, [d]: v })}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        dersler[d] === v
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
          <span className="text-xs text-zinc-500">
            Kaldığı ders sayısı (otomatik): <strong className="text-zinc-800">{kalan}</strong>
          </span>
        </div>
      )}
      {katilmadi && (
        <Etiketli label="Mazeret" zorunlu>
          <textarea
            value={mazeret}
            onChange={(e) => setMazeret(e.target.value)}
            rows={2}
            className={girdi}
          />
        </Etiketli>
      )}
    </Pencere>
  );
}

/* ------------------------------------------------------------------ */
/* Ana bileşen                                                         */
/* ------------------------------------------------------------------ */

/**
 * Federasyon sertifikaları, vizeler ve temel eğitim (PRD 12). KM/KMY'nin girdiği kayıtlar İK
 * onayına düşer (Onay Talepleri); İK'nın girdiği kayıtlar doğrudan onaylı sayılır.
 */
export function SertifikaYonetimi({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [form, setForm] = useState<Form>(null);
  const [gecmisAcik, setGecmisAcik] = useState<string | null>(null);
  const ik = ikYetkisiVarMi(currentUser.rol);
  const yapan = `${currentUser.ad} (${currentUser.rol})`;
  const duzenlenebilir = !!onAdayGuncelle;
  const bugunStr = tarihYaz(bugun());

  const fitness = aktifSertifika(aday, TEMEL_BRANS);
  const fitnessYolu = kademeYolculugu(aday, TEMEL_BRANS);
  const fitnessGecmisi = kademeGecmisi(aday, TEMEL_BRANS);
  const aktifler = aktifSertifikalar(aday);
  const digerBranslar = [
    ...new Set(
      (aday.sertifikalar ?? []).filter((s) => s.brans !== TEMEL_BRANS).map((s) => s.brans)
    ),
  ];
  const [temelDetay, setTemelDetay] = useState<string | null>(null);
  // Fitness önce; her branşta en yüksek hedef kademe (en yeni) üstte, geçmiş kademeler altında.
  const temelEgitimler = [...(aday.temelEgitimSonuclari ?? [])].sort(
    (x, y) =>
      (x.brans === TEMEL_BRANS ? 0 : 1) - (y.brans === TEMEL_BRANS ? 0 : 1) ||
      x.brans.localeCompare(y.brans, "tr") ||
      y.hedefKademe - x.hedefKademe ||
      (tarihCoz(y.sinavTarihi)?.getTime() ?? 0) - (tarihCoz(x.sinavTarihi)?.getTime() ?? 0)
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

  const onayLinki = (talep: string) =>
    ik ? (
      <Link
        href={`/onay-bekleyenler?aday=${aday.id}&talep=${talep}`}
        className="text-xs font-semibold text-amber-700 underline hover:text-amber-800"
      >
        İncele
      </Link>
    ) : null;

  const bekleyenMi = (k: OnayDurumu) => !k.onaylandi && !k.redSebebi;

  return (
    <div className="flex flex-col gap-4">
      {/* 1 — Fitness kademesi */}
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
        {fitness ? (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:grid-cols-[auto_1fr_1fr_1fr] sm:items-center">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-zinc-900 text-white">
              <span className="text-2xl font-bold leading-none">{fitness.kademe}</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-300">Kademe</span>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Belge tarihi</div>
              <div className="text-sm font-semibold text-zinc-900">{fitness.belgeTarihi}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Vize ({fitness.vizeDonemi ?? "—"})</div>
              <VizeIsareti s={fitness} />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Kademe yolculuğu</div>
              <div
                className={`text-sm font-semibold ${
                  fitnessYolu.durum === "kurs_bekleniyor" ? "text-sky-700" : "text-zinc-700"
                }`}
              >
                {fitnessYolu.metin}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Onaylı Fitness kademe belgesi yok. Fitness 1. kademe belgesi olmayan aday eğitmen olarak
            işe alınamaz.
          </div>
        )}

        {fitnessYolu.hedef && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                ad: `${fitnessYolu.hedef}. Kademe temel eğitimi`,
                tamam: fitnessYolu.durum === "kurs_bekleniyor",
              },
              { ad: "Federasyon kademe kursu", tamam: false },
              { ad: `${fitnessYolu.hedef}. Kademe belgesi`, tamam: false },
            ].map((adim, i) => (
              <div
                key={adim.ad}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                  adim.tamam
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    adim.tamam ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {adim.tamam ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                {adim.ad}
              </div>
            ))}
          </div>
        )}

        {fitnessGecmisi.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <History className="h-3.5 w-3.5" />
              Kademe geçmişi
            </div>
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {fitnessGecmisi.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[7rem_7rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-zinc-800">{s.kademe}. Kademe</span>
                  <span className="text-zinc-500">{s.belgeTarihi}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-zinc-500">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate">{s.belge?.ad ?? "—"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {s.id === fitness?.id ? (
                      <Badge label="Aktif" tone="green" />
                    ) : s.onaylandi ? (
                      <Badge label="Önceki" tone="gray" />
                    ) : (
                      <OnayRozeti kayit={s} />
                    )}
                    {bekleyenMi(s) && onayLinki(`${aday.id}-sertifika-${s.id}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Bolum>

      {/* 2 — Vizeler */}
      <Bolum
        baslik="Vizeler"
        aciklama="Her sertifika her sezon vize yaptırılmalıdır. Uyarı, yeni vize bilgisi İK tarafından onaylandığında kalkar."
      >
        {aktifler.length === 0 ? (
          <p className="text-sm text-zinc-400">Vize takibi yapılacak onaylı sertifika yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="py-2 pr-4">Sertifika</th>
                  <th className="px-4 py-2">Vize Dönemi</th>
                  <th className="px-4 py-2">Geçerlilik Bitişi</th>
                  <th className="px-4 py-2">Durum</th>
                  <th className="py-2 pl-4" />
                </tr>
              </thead>
              <tbody>
                {aktifler.map((s) => {
                  const bekleyen = s.vizeler?.find(bekleyenMi);
                  const reddedilen = !bekleyen
                    ? s.vizeler?.findLast((v) => !!v.redSebebi)
                    : undefined;
                  const gecmis = (s.vizeler ?? []).filter((v) => v.onaylandi);
                  return (
                    <tr key={s.id} className="border-b border-zinc-50 align-top last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-zinc-800">{s.brans}</div>
                        <div className="text-xs text-zinc-400">{s.kademe}. Kademe</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {s.vizeDonemi ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {s.vizeBitisTarihi ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <VizeIsareti s={s} />
                        {bekleyen && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-amber-700">
                            Yeni vize ({bekleyen.donem}, {bekleyen.bitisTarihi}) İK onayında
                            {onayLinki(`${aday.id}-vize-${s.id}-${bekleyen.id}`)}
                          </div>
                        )}
                        {reddedilen && (
                          <div className="mt-1 text-xs text-rose-600">
                            Son girilen vize reddedildi: {reddedilen.redSebebi}
                          </div>
                        )}
                        {gecmisAcik === s.id && (
                          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                            {gecmis.map((v) => (
                              <li key={v.id}>
                                {v.donem} · {v.bitisTarihi} · {v.belge.ad}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {gecmis.length > 0 && (
                            <button
                              onClick={() => setGecmisAcik(gecmisAcik === s.id ? null : s.id)}
                              className="text-xs font-medium text-zinc-500 hover:underline"
                            >
                              Geçmiş ({gecmis.length})
                            </button>
                          )}
                          {duzenlenebilir && !bekleyen && (
                            <button
                              onClick={() => setForm({ tur: "vize", sertifika: s })}
                              className={ikincilButon}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Vize gir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Bolum>

      {/* 3 — Temel eğitimler */}
      <Bolum
        baslik="Temel Eğitimler"
        aciklama="Bir üst kademe için önce Anadolu Üniversitesi temel eğitim sınavı, ardından federasyonun kademe kursu tamamlanır."
        aksiyon={
          duzenlenebilir && (
            <button onClick={() => setForm({ tur: "temel" })} className={ikincilButon}>
              <Plus className="h-3.5 w-3.5" />
              Sonuç gir
            </button>
          )
        }
      >
        {temelEgitimler.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
            Temel eğitim sonucu girilmedi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="py-2 pr-4">Temel Eğitim</th>
                  <th className="px-4 py-2">Sınav Tarihi</th>
                  <th className="px-4 py-2">Sonuç</th>
                  <th className="px-4 py-2">Kaldığı Ders</th>
                  <th className="px-4 py-2">Durum</th>
                  <th className="py-2 pl-4" />
                </tr>
              </thead>
              <tbody>
                {temelEgitimler.map((t) => {
                  const acik = temelDetay === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr className="border-b border-zinc-50">
                        <td className="py-2.5 pr-4">
                          <span className="font-medium text-zinc-800">{t.brans}</span>
                          <span className="ml-1.5 text-zinc-500">{t.hedefKademe}. Kademe</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">
                          {t.sinavTarihi}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            label={t.sonuc}
                            tone={
                              t.sonuc === "Geçti" ? "green" : t.sonuc === "Kaldı" ? "red" : "amber"
                            }
                          />
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600">
                          {t.sonuc === "Katılmadı" ? "—" : kaldigiDersSayisi(t)}
                        </td>
                        <td className="px-4 py-2.5">
                          {t.onaylandi ? (
                            <span className="text-xs text-zinc-400">Onaylı</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <OnayRozeti kayit={t} />
                              {bekleyenMi(t) && onayLinki(`${aday.id}-temel-${t.id}`)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          <button
                            onClick={() => setTemelDetay(acik ? null : t.id)}
                            className="text-xs font-medium text-zinc-500 hover:underline"
                          >
                            {acik ? "Gizle" : "Dersler"}
                          </button>
                        </td>
                      </tr>
                      {acik && (
                        <tr className="border-b border-zinc-50 bg-zinc-50/50">
                          <td colSpan={6} className="px-3 py-3">
                            {t.sonuc === "Katılmadı" ? (
                              <p className="text-sm text-zinc-600">Mazeret: {t.mazeret || "—"}</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {TEMEL_EGITIM_DERSLERI.map((d) => (
                                  <span
                                    key={d}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                      t.dersler[d] === "Kaldı"
                                        ? "bg-rose-50 text-rose-700"
                                        : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {d}: {t.dersler[d] ?? "—"}
                                  </span>
                                ))}
                              </div>
                            )}
                            {t.redSebebi && (
                              <p className="mt-2 text-xs text-rose-600">
                                Ret nedeni: {t.redSebebi}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-zinc-400">
                              Giren: {t.yukleyen} · {t.tarih}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Bolum>

      {/* 4 — Diğer sertifikalar */}
      <Bolum
        baslik="Diğer Sertifikalar"
        aciklama="Fitness dışındaki branşlar (Pilates, Yoga, Boks…) ve kademeleri."
        aksiyon={
          duzenlenebilir && (
            <button onClick={() => setForm({ tur: "sertifika" })} className={ikincilButon}>
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
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
            {digerBranslar.map((brans) => {
              const aktif = aktifSertifika(aday, brans);
              const gecmis = kademeGecmisi(aday, brans);
              const yol = kademeYolculugu(aday, brans);
              return (
                <div key={brans} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {brans}
                        {aktif && (
                          <span className="ml-2 font-medium text-zinc-500">
                            {aktif.kademe}. Kademe
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{bransTanimi(brans)?.federasyon}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {aktif && <VizeIsareti s={aktif} />}
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
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {aktif && <span className="font-medium text-zinc-600">{yol.metin}</span>}
                    {gecmis.map((s) => (
                      <span
                        key={s.id}
                        className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2 py-0.5"
                      >
                        {s.kademe}. Kademe · {s.belgeTarihi}
                        {!s.onaylandi && <OnayRozeti kayit={s} />}
                        {bekleyenMi(s) && onayLinki(`${aday.id}-sertifika-${s.id}`)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Bolum>

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
              `${aday.id}-sertifika-${id}`
            );
          }}
        />
      )}
      {form?.tur === "vize" && (
        <VizeFormu
          sertifika={form.sertifika}
          onClose={() => setForm(null)}
          onKaydet={(v) => {
            const vize: SertifikaVizesi = {
              ...v,
              id: `v${Date.now()}`,
              onaylandi: ik,
              yukleyen: yapan,
              tarih: bugunStr,
            };
            const sid = form.sertifika.id;
            kaydet(
              {
                ...aday,
                sertifikalar: (aday.sertifikalar ?? []).map((s) =>
                  s.id !== sid
                    ? s
                    : {
                        ...s,
                        vizeler: [...(s.vizeler ?? []), vize],
                        ...(ik
                          ? { vizeDonemi: vize.donem, vizeBitisTarihi: vize.bitisTarihi }
                          : {}),
                      }
                ),
              },
              `${form.sertifika.brans} vize bilgisi onay bekliyor`,
              `${aday.id}-vize-${sid}-${vize.id}`
            );
          }}
        />
      )}
      {form?.tur === "temel" && (
        <TemelEgitimFormu
          aday={aday}
          onClose={() => setForm(null)}
          onKaydet={(v) => {
            const id = `t${Date.now()}`;
            kaydet(
              {
                ...aday,
                temelEgitimSonuclari: [
                  ...(aday.temelEgitimSonuclari ?? []),
                  { ...v, id, onaylandi: ik, yukleyen: yapan, tarih: bugunStr },
                ],
              },
              `${v.hedefKademe}. kademe temel eğitim sonucu onay bekliyor`,
              `${aday.id}-temel-${id}`
            );
          }}
        />
      )}
    </div>
  );
}
