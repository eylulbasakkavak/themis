"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, FileSpreadsheet, X } from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { ikinciBelgeSetiOlustur, ilkBelgeSetiOlustur } from "@/lib/belgeKurallari";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { ADLAR, SOYADLAR, yeniThemisId } from "@/lib/egitmenUret";
import { KULUPLER } from "@/lib/kulupler";
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

export default function TopluAdayEklePage() {
  const { setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const yetkiVar = ikYetkisiVarMi(currentUser.rol);

  const exceldenTopluEkle = () => {
    setYukleniyor(true);
    setTimeout(() => {
      const adet = 2 + Math.floor(Math.random() * 3);
      const yeniler: AdayEgitmen[] = Array.from({ length: adet }, () => {
        const ad = ADLAR[Math.floor(Math.random() * ADLAR.length)];
        const soyad = SOYADLAR[Math.floor(Math.random() * SOYADLAR.length)];
        const kulup = KULUPLER[Math.floor(Math.random() * KULUPLER.length)];
        const telefon = `05${30 + Math.floor(Math.random() * 9)} ${String(
          100 + Math.floor(Math.random() * 900)
        )} ${String(10 + Math.floor(Math.random() * 80)).padStart(2, "0")} ${String(
          10 + Math.floor(Math.random() * 80)
        ).padStart(2, "0")}`;
        return {
          id: crypto.randomUUID(),
          themisId: yeniThemisId(),
          ad,
          soyad,
          telefon,
          kulup,
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
              yapan: `${currentUser.ad} (${currentUser.rol})`,
            },
          ],
        };
      });
      setAdaylar((prev) => [...yeniler, ...prev]);
      setYukleniyor(false);
      setSonuc(`${yeniler.length} aday`);
    }, 500);
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

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Aday Ekle</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Excel şablonundaki adayları tek işlemle Themis&apos;e aktarın.
        </p>
      </div>

      {sonuc && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>
            <strong>{sonuc}</strong> akademi eğitimine davet edildi. Belge yükleme ve onay akışı
            Themis üzerinden başlatıldı.{" "}
            <Link href="/adaylar" className="font-semibold underline">
              Eğitmenler listesinde görüntüle
            </Link>
          </span>
          <button
            onClick={() => setSonuc(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <input
          ref={dosyaInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) exceldenTopluEkle();
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => dosyaInputRef.current?.click()}
          disabled={yukleniyor}
          className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <FileSpreadsheet className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-zinc-800">
            {yukleniyor ? "Yükleniyor..." : "Excel dosyasını seçmek için tıklayın"}
          </span>
          <span className="text-xs text-zinc-400">.xlsx, .xls veya .csv</span>
        </button>
      </div>
    </div>
  );
}
