"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  Table2,
  Upload,
  X,
} from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { bugun, inputTarihindenCevir, inputTarihine, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { KULUPLER } from "@/lib/kulupler";
import {
  aktifSertifika,
  TEMEL_BRANS,
  TEMEL_EGITIM_DERS_KISA,
  TEMEL_EGITIM_DERSLERI,
  temelEgitimSonucuHesapla,
} from "@/lib/sertifika";
import {
  temelEgitimExceliniOku,
  temelEgitimSablonuIndir,
  type TemelEgitimExcelHatasi,
  type TemelEgitimSatiri,
} from "@/lib/temelEgitimExcel";
import type { AdayEgitmen, TemelEgitimSonucu } from "@/lib/types";

type Satir = TemelEgitimSatiri;

const SONUC_HUCRE = {
  Geçti: "bg-emerald-50 text-emerald-700",
  Kaldı: "bg-rose-50 text-rose-700",
  Katılmadı: "bg-amber-100 text-amber-800",
} as const;

const hucre = "border border-zinc-200 px-2 py-1.5";
const baslikHucre = "border border-zinc-700 px-2 py-2 align-top";

/** Satırda bir değer girildiyse kaydedilecek sayılır. */
const dokunulduMu = (s: Satir) =>
  s.katilmadi || Object.keys(s.dersler).length > 0 || !!s.mazeret.trim();

/**
 * Toplu temel eğitim sonucu girişi (PRD 12.3): Anadolu Üniversitesi temel eğitim sınavı
 * sonuçları, Excel'deki kolonlarla aynı tablo üzerinde girilir. Sınav sonucu ve kaldığı ders
 * sayısı otomatik hesaplanır; KM/KMY'nin girdiği sonuçlar İK onayına düşer.
 */
export default function TopluTemelEgitimSonucuPage() {
  const { adaylar, setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const ik = ikYetkisiVarMi(currentUser.rol);
  const [sinavTarihi, setSinavTarihi] = useState(inputTarihine(tarihYaz(bugun())));
  const [kulup, setKulup] = useState("");
  const [arama, setArama] = useState("");
  const [satirlar, setSatirlar] = useState<Record<string, Satir>>({});
  const [mesaj, setMesaj] = useState<string | null>(null);
  // İki giriş yolu: tablo üzerinde elle ya da Excel şablonuyla (yüklenen Excel tabloyu doldurur).
  const [mod, setMod] = useState<"tablo" | "excel">("tablo");
  const [excelHatalari, setExcelHatalari] = useState<TemelEgitimExcelHatasi[]>([]);
  const [excelHatasi, setExcelHatasi] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  // Üst kademeye geçebilecek aktif eğitmenler (Fitness kademesi en üstte olmayanlar).
  const egitmenler = useMemo(
    () =>
      adaylar.filter(
        (a) => a.surecDurumu === "egitmen" && (aktifSertifika(a, TEMEL_BRANS)?.kademe ?? 0) < 5
      ),
    [adaylar]
  );
  const gorunenler = egitmenler.filter((a) => {
    if (kulup && a.kulup !== kulup) return false;
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return !q || `${a.ad} ${a.soyad} ${a.themisId}`.toLocaleLowerCase("tr-TR").includes(q);
  });

  const varsayilan = (a: AdayEgitmen): Satir => ({
    hedef: (aktifSertifika(a, TEMEL_BRANS)?.kademe ?? 0) + 1,
    katilmadi: false,
    dersler: {},
    mazeret: "",
  });
  const satir = (a: AdayEgitmen) => satirlar[a.id] ?? varsayilan(a);
  const guncelle = (a: AdayEgitmen, degisiklik: Partial<Satir>) =>
    setSatirlar((prev) => ({
      ...prev,
      [a.id]: { ...(prev[a.id] ?? varsayilan(a)), ...degisiklik },
    }));

  const eksik = (s: Satir): string | null => {
    const sonuc = temelEgitimSonucuHesapla(s.katilmadi, s.dersler);
    if (!sonuc) return "Tüm dersler girilmeli";
    if (s.katilmadi && !s.mazeret.trim()) return "Mazeret zorunlu";
    return null;
  };
  const dokunulanlar = egitmenler.filter((a) => dokunulduMu(satir(a)));
  const hazirlar = dokunulanlar.filter((a) => !eksik(satir(a)));

  const tumunuKaydet = () => {
    if (hazirlar.length === 0 || !sinavTarihi) return;
    const tarih = tarihYaz(bugun());
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    const kayitlar = new Map<string, TemelEgitimSonucu>(
      hazirlar.map((a) => {
        const s = satir(a);
        return [
          a.id,
          {
            id: `t-toplu-${a.id}-${Date.now()}`,
            brans: TEMEL_BRANS,
            hedefKademe: s.hedef,
            sinavTarihi: inputTarihindenCevir(sinavTarihi),
            sonuc: temelEgitimSonucuHesapla(s.katilmadi, s.dersler)!,
            dersler: s.katilmadi ? {} : s.dersler,
            mazeret: s.mazeret.trim() || undefined,
            onaylandi: ik,
            yukleyen: `${yapan} — toplu giriş`,
            tarih,
          },
        ];
      })
    );
    setAdaylar((prev) =>
      prev.map((a) => {
        const k = kayitlar.get(a.id);
        return k ? { ...a, temelEgitimSonuclari: [...(a.temelEgitimSonuclari ?? []), k] } : a;
      })
    );
    if (!ik) {
      bildirimEkle({
        aliciRol: "İK",
        aliciAd: KULLANICILAR["İK"].ad,
        baslik: `${kayitlar.size} temel eğitim sonucu onay bekliyor (toplu giriş)`,
        mesaj: `${inputTarihindenCevir(sinavTarihi)} tarihli Anadolu Üniversitesi temel eğitim sınavı sonuçları.`,
        planlayan: yapan,
        tarih,
        link: "/onay-bekleyenler",
      });
    }
    setSatirlar((prev) => {
      const kalan = { ...prev };
      for (const id of kayitlar.keys()) delete kalan[id];
      return kalan;
    });
    const sayac = { Geçti: 0, Kaldı: 0, Katılmadı: 0 };
    for (const k of kayitlar.values()) sayac[k.sonuc] += 1;
    setMesaj(
      `${kayitlar.size} eğitmenin temel eğitim sonucu kaydedildi${ik ? "" : " ve İK onayına gönderildi"}: ${sayac.Geçti} geçti, ${sayac.Kaldı} kaldı, ${sayac.Katılmadı} katılmadı.`
    );
  };

  const sablonIndir = () =>
    temelEgitimSablonuIndir(gorunenler, inputTarihindenCevir(sinavTarihi) || tarihYaz(bugun()));

  const exceliYukle = async (dosya: File) => {
    setYukleniyor(true);
    setExcelHatasi(null);
    const sonuc = await temelEgitimExceliniOku(dosya, egitmenler);
    setYukleniyor(false);
    setExcelHatalari(sonuc.hatalar);
    if (sonuc.genelHata) return setExcelHatasi(sonuc.genelHata);
    const adet = Object.keys(sonuc.satirlar).length;
    if (adet === 0) return setExcelHatasi("Excel'de doldurulmuş satır bulunamadı.");
    setSatirlar((prev) => ({ ...prev, ...sonuc.satirlar }));
    setKulup("");
    setArama("");
    setMod("tablo");
    setMesaj(
      `${dosya.name}: ${adet} eğitmenin sonucu tabloya aktarıldı. Kontrol edip "Tümünü Kaydet" ile kaydedin.`
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/toplu-islemler"
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Toplu İşlemler
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Temel Eğitim Sonucu Gir</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Anadolu Üniversitesi temel eğitim sınavı sonuçlarını Excel&apos;deki gibi girin: her ders
          için Geçti / Kaldı seçin; sınav sonucu ve kaldığı ders sayısı otomatik hesaplanır.
          {!ik && " Girilen sonuçlar İK onayına düşer."}
        </p>
      </div>

      {mesaj && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {mesaj}
          </span>
          <button
            onClick={() => setMesaj(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex w-fit rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        {(
          [
            { deger: "tablo", label: "Tabloda Gir", ikon: Table2 },
            { deger: "excel", label: "Excel ile Gir", ikon: FileSpreadsheet },
          ] as const
        ).map((m) => (
          <button
            key={m.deger}
            onClick={() => setMod(m.deger)}
            aria-pressed={mod === m.deger}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              mod === m.deger ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <m.ikon className="h-4 w-4" />
            {m.label}
          </button>
        ))}
      </div>

      {excelHatalari.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Excel&apos;de {excelHatalari.length} satırda sorun var
          </div>
          <ul className="ml-6 list-disc space-y-0.5 text-xs">
            {excelHatalari.slice(0, 8).map((h) => (
              <li key={`${h.satir}-${h.mesaj}`}>
                Satır {h.satir} · {h.kimlik}: {h.mesaj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mod === "excel" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">1. Şablonu indirin</div>
            <p className="text-sm text-zinc-500">
              Eğitmen ID, ad soyad, kulüp, mevcut ve hedef kademe dolu gelir. Sınav sonucu ve
              dersler açılır listeden (GEÇTİ / KALDI / KATILMADI) seçilir; kaldığı ders sayısı
              Excel&apos;de otomatik hesaplanır.
            </p>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              Sınav tarihi
              <input
                type="date"
                value={sinavTarihi}
                onChange={(e) => setSinavTarihi(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
              />
            </label>
            <button
              onClick={sablonIndir}
              className="flex w-fit items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="h-4 w-4" />
              Şablonu İndir ({gorunenler.length} eğitmen)
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">
              2. Doldurulan Excel&apos;i yükleyin
            </div>
            <p className="text-sm text-zinc-500">
              Satırlar Eğitmen ID ile eşleştirilir ve tabloya aktarılır; boş bırakılan satırlar
              atlanır. Kaydetmeden önce sonuçları tabloda kontrol edebilirsiniz.
            </p>
            <input
              ref={dosyaRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) exceliYukle(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => dosyaRef.current?.click()}
              disabled={yukleniyor}
              className="flex w-fit items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
            >
              <Upload className="h-4 w-4" />
              {yukleniyor ? "Okunuyor..." : "Excel Yükle"}
            </button>
            {excelHatasi && <p className="text-sm text-rose-600">{excelHatasi}</p>}
          </div>
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-3 ${mod === "excel" ? "hidden" : ""}`}>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-600">
          Sınav tarihi
          <input
            type="date"
            value={sinavTarihi}
            onChange={(e) => setSinavTarihi(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <select
          value={kulup}
          onChange={(e) => setKulup(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="">Tüm kulüpler</option>
          {KULUPLER.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Eğitmen adı veya ID"
            className="w-full outline-none placeholder:text-zinc-400"
          />
        </div>
        <span className="text-sm text-zinc-500">{gorunenler.length} eğitmen</span>
      </div>

      <div
        className={`overflow-x-auto rounded-xl border border-zinc-300 bg-white shadow-sm ${mod === "excel" ? "hidden" : ""}`}
      >
        <table className="w-full min-w-[1600px] border-collapse text-sm">
          <thead className="bg-zinc-900 text-white">
            <tr>
              <th
                className={`${baslikHucre} sticky left-0 z-10 w-52 min-w-52 bg-zinc-900 text-left`}
              >
                Ad-Soyad
              </th>
              <th className={`${baslikHucre} w-28 min-w-28`}>Kulüp</th>
              <th className={`${baslikHucre} w-20`}>Mevcut Kademe</th>
              <th className={`${baslikHucre} w-24`}>Hedef Kademe</th>
              <th className={`${baslikHucre} w-20`}>Katılmadı</th>
              <th className={`${baslikHucre} w-24`}>Sınav Sonucu</th>
              <th className={`${baslikHucre} w-20`}>Kaldığı Ders Sayısı</th>
              {TEMEL_EGITIM_DERSLERI.map((d) => (
                <th key={d} className={`${baslikHucre} w-28`} title={d}>
                  {TEMEL_EGITIM_DERS_KISA[d]}
                </th>
              ))}
              <th className={`${baslikHucre} w-56 text-left`}>Mazeret</th>
            </tr>
          </thead>
          <tbody>
            {gorunenler.map((a) => {
              const s = satir(a);
              const sonuc = temelEgitimSonucuHesapla(s.katilmadi, s.dersler);
              const kalan = Object.values(s.dersler).filter((d) => d === "Kaldı").length;
              const sorun = dokunulduMu(s) ? eksik(s) : null;
              const mevcut = aktifSertifika(a, TEMEL_BRANS)?.kademe ?? 0;
              return (
                <tr key={a.id} className={sorun ? "bg-rose-50/30" : ""} title={sorun ?? undefined}>
                  <td className={`${hucre} sticky left-0 z-[1] min-w-52 bg-white`}>
                    <div className="font-medium text-zinc-900">
                      {a.ad} {a.soyad}
                    </div>
                    <div className="font-mono text-xs text-zinc-400">{a.themisId}</div>
                  </td>
                  <td className={`${hucre} text-xs text-zinc-600`}>{a.kulup}</td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>{mevcut}. Kademe</td>
                  <td className={`${hucre} text-center`}>
                    <select
                      value={s.hedef}
                      onChange={(e) => guncelle(a, { hedef: Number(e.target.value) })}
                      className="w-full rounded border border-zinc-200 bg-white px-1 py-1 text-xs outline-none"
                    >
                      {[1, 2, 3, 4, 5]
                        .filter((k) => k > mevcut)
                        .map((k) => (
                          <option key={k} value={k}>
                            {k}. Kademe
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className={`${hucre} text-center`}>
                    <input
                      type="checkbox"
                      aria-label={`${a.ad} ${a.soyad} sınava katılmadı`}
                      checked={s.katilmadi}
                      onChange={(e) => guncelle(a, { katilmadi: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </td>
                  <td
                    className={`${hucre} text-center text-xs font-bold ${sonuc ? SONUC_HUCRE[sonuc] : "text-zinc-300"}`}
                  >
                    {sonuc ? sonuc.toLocaleUpperCase("tr-TR") : "—"}
                  </td>
                  <td className={`${hucre} text-center text-base font-bold text-zinc-800`}>
                    {s.katilmadi || !sonuc ? "" : kalan || ""}
                  </td>
                  {TEMEL_EGITIM_DERSLERI.map((d) => {
                    const v = s.dersler[d];
                    return (
                      <td key={d} className="border border-zinc-200 p-0">
                        <select
                          aria-label={`${a.ad} ${a.soyad} – ${d}`}
                          disabled={s.katilmadi}
                          value={v ?? ""}
                          onChange={(e) => {
                            const yeni = { ...s.dersler };
                            if (e.target.value) yeni[d] = e.target.value as "Geçti" | "Kaldı";
                            else delete yeni[d];
                            guncelle(a, { dersler: yeni });
                          }}
                          className={`h-11 w-full cursor-pointer bg-transparent text-center text-xs font-semibold outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-transparent ${
                            v === "Geçti"
                              ? "bg-emerald-50/70 text-emerald-700"
                              : v === "Kaldı"
                                ? "bg-rose-50/70 text-rose-700"
                                : "text-zinc-300"
                          }`}
                        >
                          <option value="">–</option>
                          <option value="Geçti">GEÇTİ</option>
                          <option value="Kaldı">KALDI</option>
                        </select>
                      </td>
                    );
                  })}
                  <td
                    className={`${hucre} ${s.katilmadi && !s.mazeret.trim() ? "bg-rose-50" : ""}`}
                  >
                    <input
                      value={s.mazeret}
                      onChange={(e) => guncelle(a, { mazeret: e.target.value })}
                      placeholder={s.katilmadi ? "Katılmadıysa zorunlu" : ""}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-rose-400"
                    />
                  </td>
                </tr>
              );
            })}
            {gorunenler.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-12 text-center text-sm text-zinc-400">
                  Eşleşen eğitmen yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className={`sticky bottom-0 z-20 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm ${mod === "excel" ? "hidden" : ""}`}
      >
        <span className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-800">{hazirlar.length}</span> satır kaydedilmeye
          hazır
          {dokunulanlar.length > hazirlar.length && (
            <span className="ml-2 text-rose-600">
              · {dokunulanlar.length - hazirlar.length} satırda eksik var
            </span>
          )}
        </span>
        <button
          onClick={tumunuKaydet}
          disabled={hazirlar.length === 0 || !sinavTarihi}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tümünü Kaydet
        </button>
      </div>
    </div>
  );
}
