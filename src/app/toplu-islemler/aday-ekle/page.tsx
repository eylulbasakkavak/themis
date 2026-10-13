"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { ikinciBelgeSetiOlustur, ilkBelgeSetiOlustur } from "@/lib/belgeKurallari";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { yeniThemisId } from "@/lib/egitmenUret";
import {
  adayExceliniOku,
  adaySablonuIndir,
  type AdayYuklemeHatasi,
  type OkunanAday,
} from "@/lib/topluAdayExcel";
import type { AdayEgitmen } from "@/lib/types";

function bugununTarihi() {
  const d = new Date();
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  return `${gun}.${ay}.${d.getFullYear()}`;
}

function GeriDon() {
  return (
    <Link
      href="/toplu-islemler"
      className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Toplu İşlemler
    </Link>
  );
}

type YuklemeSonucu = { eklenenler: OkunanAday[]; hatalar: AdayYuklemeHatasi[] };

/** Toplu Aday Ekle: şablon indir → doldur → yükle (Toplu Akademi Sınav Sonucu ile aynı akış). */
export default function TopluAdayEklePage() {
  const { adaylar, setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<YuklemeSonucu | null>(null);
  const [genelHata, setGenelHata] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const yetkiVar = ikYetkisiVarMi(currentUser.rol);

  const dosyayiYukle = async (dosya: File) => {
    setYukleniyor(true);
    setSonuc(null);
    setGenelHata(null);
    try {
      const okunan = await adayExceliniOku(dosya, adaylar);
      if (okunan.genelHata) {
        setGenelHata(okunan.genelHata);
        return;
      }
      const yapan = `${currentUser.ad} (${currentUser.rol})`;
      const yeniler: AdayEgitmen[] = okunan.adaylar.map((a) => ({
        id: crypto.randomUUID(),
        themisId: yeniThemisId(),
        ad: a.ad,
        soyad: a.soyad,
        telefon: a.telefon,
        kulup: a.kulup,
        mulakatiYapanRol: "İK",
        mulakatiYapan: currentUser.ad,
        basvuruTarihi: bugununTarihi(),
        surecDurumu: "ilk_belge_seti_bekleniyor",
        ilkBelgeSeti: ilkBelgeSetiOlustur("İK"),
        ikinciBelgeSeti: ikinciBelgeSetiOlustur(),
        aksiyonGecmisi: [
          {
            tarih: bugununTarihi(),
            aksiyon: "Akademi eğitimine davet edildi — Excel toplu işlem",
            yapan,
          },
        ],
      }));
      setAdaylar((prev) => [...yeniler, ...prev]);
      setSonuc({ eklenenler: okunan.adaylar, hatalar: okunan.hatalar });
    } catch {
      setGenelHata("Dosya okunamadı. Lütfen .xlsx formatında bir Excel dosyası yükleyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  if (!yetkiVar) {
    return (
      <div className="flex flex-col gap-5">
        <GeriDon />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
          Bu işlem yalnızca İK tarafından yapılabilir. Şu anki rolün: {currentUser.rol}.
        </div>
      </div>
    );
  }

  const uyarililar = sonuc?.eklenenler.filter((a) => a.uyari) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Aday Ekle</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Şablonu indirin, adayların bilgilerini doldurun ve aynı ekrandan yükleyin. Her satır bir
          aday olarak eklenir ve akademi eğitimine davet edilir.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              1
            </span>
            <h2 className="text-base font-semibold text-zinc-900">Şablonu indir</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Şablonda Telefon No, Ad, Soyad ve Potansiyel Kulüp kolonları bulunur; tüm
            alanlar zorunludur. Kulüp, hücredeki açılır listeden seçilir.
          </p>
          <button
            onClick={() => adaySablonuIndir()}
            className="flex w-fit items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            <Download className="h-4 w-4" />
            Şablonu İndir (.xlsx)
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              2
            </span>
            <h2 className="text-base font-semibold text-zinc-900">Doldurulan Excel&apos;i yükle</h2>
          </div>
          <input
            ref={dosyaInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const dosya = e.target.files?.[0];
              if (dosya) dosyayiYukle(dosya);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => dosyaInputRef.current?.click()}
            disabled={yukleniyor}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-zinc-800">
              {yukleniyor ? "Okunuyor..." : "Excel dosyasını seçmek için tıklayın"}
            </span>
            <span className="text-xs text-zinc-400">.xlsx</span>
          </button>
        </div>
      </div>

      {genelHata && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {genelHata}
        </div>
      )}

      {sonuc && (
        <div className="flex flex-col gap-4">
          {sonuc.eklenenler.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong>{sonuc.eklenenler.length} aday</strong> akademi eğitimine davet edildi.
                Belge yükleme ve onay akışı Themis üzerinden başlatıldı.{" "}
                <Link href="/adaylar" className="font-semibold underline">
                  Eğitmenler listesinde görüntüle
                </Link>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Hiçbir aday eklenmedi. Şablonun doldurulduğundan emin olun.
            </div>
          )}

          {uyarililar.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="font-semibold">
                {uyarililar.length} aday daha önce olumsuz sonuçlanmış bir kayıtla aynı telefona
                sahip (eklendi):
              </div>
              <ul className="mt-1 list-disc pl-5 text-amber-700">
                {uyarililar.map((a) => (
                  <li key={a.telefon}>
                    {a.ad} {a.soyad} · {a.telefon} — {a.uyari}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sonuc.hatalar.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-rose-100 px-5 py-3 text-sm font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                {sonuc.hatalar.length} satır eklenmedi
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                    <th className="px-5 py-2.5">Excel Satırı</th>
                    <th className="px-4 py-2.5">Ad Soyad</th>
                    <th className="px-4 py-2.5">Sebep</th>
                  </tr>
                </thead>
                <tbody>
                  {sonuc.hatalar.map((h) => (
                    <tr key={h.satir} className="border-b border-zinc-50 last:border-0">
                      <td className="px-5 py-2.5 text-zinc-500">{h.satir}</td>
                      <td className="px-4 py-2.5 text-zinc-700">{h.adSoyad || "—"}</td>
                      <td className="px-4 py-2.5 text-rose-600">{h.sebep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
