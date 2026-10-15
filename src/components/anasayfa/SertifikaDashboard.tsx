"use client";

import { useAdaylar } from "@/lib/AdaylarContext";
import {
  aktifSertifika,
  bransTanimi,
  digerBransSertifikalari,
  fitnessSertifikasi,
} from "@/lib/sertifika";
import type { AdayEgitmen } from "@/lib/types";

const yuzde = (n: number, toplam: number) =>
  `%${(toplam ? (n / toplam) * 100 : 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
  })}`;

/** Kırmızı ağırlıklı palet: vurgulu kutu ve kademe tonları (1. açık → üst kademeler koyu). */
const VURGU = "bg-[#b83a33]";
const KADEME_TONU = ["bg-[#f3c4c1]", "bg-[#d9605a]", "bg-[#8f2a24]"];

/** Diğer federasyon kutuları: Excel'deki sıra. */
const DIGER_FEDERASYONLAR = [
  {
    brans: "Pilates",
    ad: "TCF Pilates",
  },
  {
    brans: "Step-Aerobik",
    ad: "TCF Step Aerobik",
  },
  { brans: "Yoga", ad: "HİS Yoga" },
  {
    brans: "Kick Boks",
    ad: "Kick Boks Fed.",
  },
  { brans: "Boks", ad: "Boks Fed." },
  {
    brans: "Dans Sporları",
    ad: "TDSF Dans",
  },
];

const denklikteMi = (a: AdayEgitmen) =>
  !!a.federasyonKademeDurumu?.startsWith("Denklik");

/**
 * Ana sayfa: "Aktif Eğitmenler" sertifika paneli (Excel'deki sheet'in karşılığı). Aktif eğitmenler
 * Fitness federasyonu kademe belgesine göre sayılır; denklik bekleyenler ayrı kategoridir.
 */
export function SertifikaDashboard() {
  const { adaylar } = useAdaylar();
  const aktifler = adaylar.filter((a) => a.surecDurumu === "egitmen");
  const toplam = aktifler.length;
  const kademe = (a: AdayEgitmen) => fitnessSertifikasi(a)?.kademe ?? 0;
  const sayi = (f: (a: AdayEgitmen) => boolean) => aktifler.filter(f).length;

  const sertifikali = sayi((a) => kademe(a) > 0);
  const sertifikasiz = sayi((a) => kademe(a) === 0 && !denklikteMi(a));

  const ozet: {
    baslik: string;
    deger: number;
    pay?: string;
    vurgu?: boolean;
    cubuk?: string;
  }[] = [
    {
      baslik: "Toplam Eğitmen",
      deger: toplam,
      vurgu: true,
    },
    {
      baslik: "Sertifikalı Eğitmen",
      deger: sertifikali,
      pay: yuzde(sertifikali, toplam),
    },
    {
      baslik: "Sertifikasız Eğitmen",
      deger: sertifikasiz,
      pay: yuzde(sertifikasiz, toplam),
    },
    {
      baslik: "1. Kademe Sertifikalı",
      deger: sayi((a) => kademe(a) === 1),
      pay: yuzde(
        sayi((a) => kademe(a) === 1),
        toplam,
      ),
      cubuk: KADEME_TONU[0],
    },
    {
      baslik: "2. Kademe ve Üzeri Sertifikalı",
      deger: sayi((a) => kademe(a) >= 2),
      pay: yuzde(
        sayi((a) => kademe(a) >= 2),
        toplam,
      ),
      cubuk: KADEME_TONU[1],
    },
  ];

  // Diğer federasyonlar: branşta aktif (İK onaylı en yüksek) belgesi olanlar, kademe kırılımıyla.
  const digerSertifikali = sayi((a) => digerBransSertifikalari(a).length > 0);
  const digerler = DIGER_FEDERASYONLAR.map((f) => {
    const kademeler = aktifler
      .map((a) => aktifSertifika(a, f.brans)?.kademe ?? 0)
      .filter((k) => k > 0);
    const kademeSayisi = bransTanimi(f.brans)?.kademeSayisi ?? 2;
    return {
      ...f,
      deger: kademeler.length,
      kirilim: Array.from({ length: kademeSayisi }, (_, i) => ({
        kademe: i + 1,
        n: kademeler.filter((k) => k === i + 1).length,
      })).filter((k) => k.kademe <= 2 || k.n > 0),
    };
  });

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Aktif Eğitmenler</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {ozet.map((k) => (
          <div
            key={k.baslik}
            className={`flex flex-col items-center justify-center rounded-2xl px-4 py-4 text-center ${
              k.vurgu
                ? `${VURGU} text-white shadow-sm`
                : "border border-zinc-200 bg-zinc-50 text-zinc-900"
            }`}
          >
            <div
              className={`text-xs font-bold uppercase tracking-wide ${k.vurgu ? "text-white/90" : "text-zinc-500"}`}
            >
              {k.baslik}
            </div>
            <div className="mt-1.5 text-4xl font-bold tabular-nums">
              {k.deger.toLocaleString("tr-TR")}
            </div>
            <div
              className={`mt-2 h-5 text-sm font-semibold ${k.vurgu ? "text-white/75" : "text-zinc-500"}`}
            >
              {k.pay}
            </div>
            {k.cubuk && (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-full rounded-full ${k.cubuk}`}
                  style={{ width: `${toplam ? (k.deger / toplam) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="mt-2 text-lg font-semibold text-zinc-900">
        Diğer Federasyonlar
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <div
          className={`col-span-2 flex flex-col items-center justify-center rounded-2xl ${VURGU} px-4 py-4 text-center text-white shadow-sm md:col-span-1`}
        >
          <div className="text-xs font-bold uppercase tracking-wide text-white/90">
            Diğer Federasyonlardan Sertifikalı
          </div>
          <div className="mt-1.5 text-3xl font-bold tabular-nums">
            {digerSertifikali.toLocaleString("tr-TR")}
          </div>
          <div className="mt-2 text-sm font-semibold text-white/75">
            {yuzde(digerSertifikali, toplam)}
          </div>
        </div>
        {digerler.map((f) => (
          <div
            key={f.brans}
            className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-center"
          >
            <div className="text-sm font-semibold text-zinc-800">{f.ad}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
              {f.deger.toLocaleString("tr-TR")}
            </div>
            <div className="text-xs font-medium text-zinc-500">
              {yuzde(f.deger, toplam)}
            </div>
            {/* Kademe kırılımı: açık → koyu kırmızı yığılı çubuk. */}
            <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              {f.kirilim.map((k) => (
                <div
                  key={k.kademe}
                  className={KADEME_TONU[Math.min(k.kademe, 3) - 1]}
                  style={{ width: `${f.deger ? (k.n / f.deger) * 100 : 0}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-0.5 text-xs text-zinc-600">
              {f.kirilim.map((k) => (
                <span key={k.kademe} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-sm ${KADEME_TONU[Math.min(k.kademe, 3) - 1]}`}
                  />
                  {k.kademe}. Kademe:{" "}
                  <span className="font-semibold text-zinc-800">{k.n}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
