"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { bugun, tarihYaz } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import {
  sablonIndir,
  sinavaGirecekler,
  sinavExceliniOku,
  type YuklemeHatasi,
} from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";

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

type YuklemeSonucu = { kaydedilen: number; gecti: number; kaldi: number; hatalar: YuklemeHatasi[] };

/** Toplu Akademi Sınav Sonucu Yükleme (PRD 9.1): şablon indir → doldur → yükle. */
export default function TopluAkademiSinavSonucuPage() {
  const { currentUser } = useCurrentUser();
  const { adaylar, setAdaylar } = useAdaylar();
  const { donemler } = useAkademiDonemleri();
  const { topluYukle } = useAkademiSinavSonuclari();
  const [akademiId, setAkademiId] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<YuklemeSonucu | null>(null);
  const [genelHata, setGenelHata] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  // Akademi Yöneticisi rolü henüz yok; yükleme İK ve Sistem Yöneticisi'nde.
  const yetkiVar = ikYetkisiVarMi(currentUser.rol);

  // Sınav sonucu, kayıtlı adayı olan ve başlamış (iptal edilmemiş) akademiler için girilir.
  const akademiler = donemler.filter((d) => !d.iptal && d.kayitlilar.length > 0);
  const akademi = donemler.find((d) => d.id === akademiId);
  const katilanlar = akademi ? sinavaGirecekler(akademi, adaylar) : [];

  const dosyayiYukle = async (dosya: File) => {
    if (!akademi) return;
    setYukleniyor(true);
    setSonuc(null);
    setGenelHata(null);
    try {
      const yukleyen = `${currentUser.ad} (${currentUser.rol})`;
      const tarih = tarihYaz(bugun());
      const okunan = await sinavExceliniOku(dosya, akademi, adaylar, yukleyen, tarih);
      if (okunan.genelHata) {
        setGenelHata(okunan.genelHata);
        return;
      }
      topluYukle(okunan.sonuclar);
      const sonucByAday = new Map(okunan.sonuclar.map((s) => [s.egitmenId, s.genelSonuc]));
      // Sınavı geçen akademi eğitmeni "Eğitmenliğe Geçişe Hazır" olur; kalan aday akademi
      // eğitmeni olarak kalır ve süreci İK tarafından sonlandırılabilir (PRD 10.1).
      setAdaylar((prev) =>
        prev.map((a) => {
          const genel = sonucByAday.get(a.id);
          if (!genel) return a;
          const gecti = genel === "Geçti" && a.surecDurumu === "akademi_egitmeni";
          return {
            ...a,
            surecDurumu: gecti ? "akademiyi_tamamladi" : a.surecDurumu,
            aksiyonGecmisi: [
              ...a.aksiyonGecmisi,
              {
                tarih,
                aksiyon: `Akademi sınav sonucu Excel'den yüklendi: ${genel}`,
                yapan: yukleyen,
              },
            ],
          };
        })
      );
      setSonuc({
        kaydedilen: okunan.sonuclar.length,
        gecti: okunan.sonuclar.filter((s) => s.genelSonuc === "Geçti").length,
        kaldi: okunan.sonuclar.filter((s) => s.genelSonuc === "Kaldı").length,
        hatalar: okunan.hatalar,
      });
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
          Bu işlem yalnızca akademi yöneticisi / İK tarafından yapılabilir. Şu anki rolün:{" "}
          {currentUser.rol}.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Akademi Sınav Sonucu Gir</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Şablonu indirin, akademi ekibine doldurtun ve aynı ekrandan yükleyin. Her satır Eğitmen ID
          ile eşleştirilir; puanlar Excel&apos;deki başlıklarla olduğu gibi kaydedilir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-semibold text-zinc-800" htmlFor="akademiSecimi">
          Akademi Dönemi<span className="ml-0.5 text-rose-500">*</span>
        </label>
        <select
          id="akademiSecimi"
          value={akademiId}
          onChange={(e) => {
            setAkademiId(e.target.value);
            setSonuc(null);
            setGenelHata(null);
          }}
          className="min-w-[320px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Akademi dönemi seçin</option>
          {akademiler.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ad} · {d.baslangicTarihi} – {d.bitisTarihi}
            </option>
          ))}
        </select>
        {akademi && (
          <span className="text-sm text-zinc-500">
            Sınava girecek <strong className="text-zinc-800">{katilanlar.length}</strong> eğitmen
            {akademi.kayitlilar.length > katilanlar.length &&
              ` (${akademi.kayitlilar.length - katilanlar.length} kişi akademiye katılmadı)`}
          </span>
        )}
      </div>

      <div
        className={`grid gap-4 lg:grid-cols-2 ${akademi ? "" : "pointer-events-none opacity-50"}`}
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              1
            </span>
            <h2 className="text-base font-semibold text-zinc-900">Şablonu indir</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Şablon, seçilen akademiye katılan eğitmenlerin Eğitmen ID, ad soyad ve kulüp
            bilgileriyle otomatik dolu iner; akademi ekibi yalnızca puanları ve genel sonucu girer.
          </p>
          <button
            onClick={() => akademi && sablonIndir(akademi, adaylar)}
            disabled={!akademi || katilanlar.length === 0}
            className="flex w-fit items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
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
            disabled={yukleniyor || !akademi}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
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
          {sonuc.kaydedilen > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {sonuc.kaydedilen} eğitmenin sınav sonucu kaydedildi ({sonuc.gecti} geçti,{" "}
              {sonuc.kaldi} kaldı). Sonuçlar eğitmen profillerindeki &quot;Akademi &amp; Sınav
              Sonuçları&quot; sekmesinde görünür.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Hiçbir satır kaydedilmedi. Dosyanın seçilen akademiye ait olduğundan ve puanların
              doldurulduğundan emin olun.
            </div>
          )}

          {sonuc.hatalar.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-rose-100 px-5 py-3 text-sm font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                {sonuc.hatalar.length} satır kaydedilmedi
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                    <th className="px-5 py-2.5">Excel Satırı</th>
                    <th className="px-4 py-2.5">Eğitmen ID</th>
                    <th className="px-4 py-2.5">Ad Soyad</th>
                    <th className="px-4 py-2.5">Sebep</th>
                  </tr>
                </thead>
                <tbody>
                  {sonuc.hatalar.map((h) => (
                    <tr key={h.satir} className="border-b border-zinc-50 last:border-0">
                      <td className="px-5 py-2.5 text-zinc-500">{h.satir}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">
                        {h.egitmenId || "—"}
                      </td>
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
