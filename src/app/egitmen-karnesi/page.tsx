"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarCheck, FileSpreadsheet, Info, Lock } from "lucide-react";
import { AdayDetayTabs } from "@/components/aday/AdayDetayTabs";
import { KarneDetayModal } from "@/components/karne/KarneDetayModal";
import { useAdaylar } from "@/lib/AdaylarContext";
import { ISTIHDAM_TIPLERI } from "@/lib/egitmenSecenekleri";
import {
  donemEtiketi,
  donemSecenekleriUret,
  efektifLig,
  guncelDonemMi,
  karneyeDahilMi,
  LIG_SIRASI,
  LIG_TONU,
  ligSabitliMi,
  ornekFinalPuanHesapla,
  ornekKarneAlanlariUret,
  sonrakiDonem,
} from "@/lib/karne";
import { useKarneler } from "@/lib/KarnelerContext";
import { toneClasses, type Tone } from "@/lib/status";
import type { AdayEgitmen, EgitmenKarnesi, EgitmenLig } from "@/lib/types";

type KarneSatiri = {
  egitmen: AdayEgitmen;
  karne: EgitmenKarnesi | null;
  lig: EgitmenLig | null;
  sabit: boolean;
};

function ligMetinRengi(tone: Tone): string {
  return toneClasses[tone].split(" ").find((c) => c.startsWith("text-")) ?? "";
}

function KarneTablosu({ satirlar }: { satirlar: KarneSatiri[] }) {
  const [detaySatiri, setDetaySatiri] = useState<KarneSatiri | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-sm font-medium text-zinc-400">
              <th className="px-4 py-2.5">Eğitmen</th>
              <th className="px-4 py-2.5">Kulüp</th>
              <th className="px-4 py-2.5">Dönem</th>
              <th className="px-4 py-2.5">Lig</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {satirlar.map((satir, i) => {
              const { egitmen, karne, lig, sabit } = satir;
              return (
                <tr
                  key={egitmen.id}
                  className={`border-b border-zinc-50 last:border-0 ${
                    i % 2 === 1 ? "bg-zinc-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-base font-medium text-zinc-900">
                    {egitmen.ad} {egitmen.soyad}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{egitmen.kulup}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {karne ? donemEtiketi(karne.donem) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lig ? (
                      <span className={`text-sm font-semibold ${ligMetinRengi(LIG_TONU[lig])}`}>
                        {sabit ? `${lig} (sabitlenmiş)` : lig}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {karne && (
                      <button
                        onClick={() => setDetaySatiri(satir)}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Detay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {satirlar.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  Bu istihdam tipinde eğitmen bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detaySatiri?.karne && detaySatiri.lig && (
        <KarneDetayModal
          egitmen={detaySatiri.egitmen}
          karne={detaySatiri.karne}
          lig={detaySatiri.lig}
          sabit={detaySatiri.sabit}
          onClose={() => setDetaySatiri(null)}
        />
      )}
    </>
  );
}

export default function EgitmenKarnesiPage() {
  const { adaylar } = useAdaylar();
  const {
    karneler,
    karneleriYukle,
    haricKayitlari,
    sabitlemeKayitlari,
    aktifDonem,
    donemiSonlandir,
  } = useKarneler();
  const [donem, setDonem] = useState(aktifDonem);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonMesaj, setSonMesaj] = useState<string | null>(null);
  const [sonlandirmaOnayi, setSonlandirmaOnayi] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const saltOkunur = !guncelDonemMi(donem, aktifDonem);
  const donemSecenekleri = useMemo(() => donemSecenekleriUret(aktifDonem), [aktifDonem]);

  const egitmenler = useMemo(
    () => adaylar.filter((a) => a.surecDurumu === "egitmen" && karneyeDahilMi(a, haricKayitlari)),
    [adaylar, haricKayitlari]
  );

  const satirlar = useMemo(() => {
    return egitmenler
      .map((egitmen) => {
        const donemKarnesi =
          karneler.find((k) => k.egitmenId === egitmen.id && k.donem === donem) ?? null;
        const lig = donemKarnesi
          ? efektifLig(egitmen.id, donemKarnesi.finalPuan, haricKayitlari, sabitlemeKayitlari)
          : null;
        const sabit = ligSabitliMi(egitmen.id, haricKayitlari, sabitlemeKayitlari);
        return { egitmen, karne: donemKarnesi, lig, sabit };
      })
      .sort((a, b) => {
        const aSira = a.lig ? LIG_SIRASI.indexOf(a.lig) : -1;
        const bSira = b.lig ? LIG_SIRASI.indexOf(b.lig) : -1;
        if (bSira !== aSira) return bSira - aSira;
        return (b.karne?.finalPuan ?? -1) - (a.karne?.finalPuan ?? -1);
      });
  }, [egitmenler, karneler, donem, haricKayitlari, sabitlemeKayitlari]);

  const istihdamTipineGoreGruplar = useMemo(
    () =>
      ISTIHDAM_TIPLERI.map((tip) => ({
        tip,
        satirlar: satirlar.filter(({ egitmen }) => (egitmen.istihdamTipi ?? "Tam Zamanlı") === tip),
      })),
    [satirlar]
  );

  const excelYukle = () => {
    if (saltOkunur) return;
    setYukleniyor(true);
    setTimeout(() => {
      const yeniKarneler: EgitmenKarnesi[] = egitmenler.map((egitmen) => {
        const alanlar = ornekKarneAlanlariUret();
        return {
          id: `${egitmen.id}-${aktifDonem}`,
          egitmenId: egitmen.id,
          donem: aktifDonem,
          alanlar,
          finalPuan: ornekFinalPuanHesapla(alanlar),
          yuklemeTarihi: "Bugün",
        };
      });
      karneleriYukle(yeniKarneler);
      setYukleniyor(false);
      setSonMesaj(
        `${yeniKarneler.length} eğitmen için ${donemEtiketi(aktifDonem)} dönemi karne puanları yüklendi.`
      );
    }, 500);
  };

  const donemiSonlandirOnayla = () => {
    const eskiDonem = aktifDonem;
    const yeniDonem = sonrakiDonem(aktifDonem);
    donemiSonlandir();
    setDonem(yeniDonem);
    setSonlandirmaOnayi(false);
    setSonMesaj(
      `${donemEtiketi(eskiDonem)} sonlandırıldı; yeni kayıtlar artık ${donemEtiketi(yeniDonem)} dönemine giriliyor.`
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
        <p className="text-sm text-zinc-500">
          Karne puanları Themis içinde hesaplanmaz; data ekibinin aylık script/analiz çalışmasıyla
          üretilir ve Excel dosyasından buraya yüklenir. Yükleme tamamlandıktan sonra puanlar
          veritabanında saklanır — kaynak olarak Excel dosyasına bağımlı kalınmaz. Lig ise ayrıca
          girilmez; her yüklemede final puana göre Themis tarafından otomatik
          belirlenir/güncellenir, manuel bir işlem gerekmez.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Eğitmen Karne</h1>
          <p className="text-xs text-zinc-400">Seçili döneme ait karne puanı gösterilir.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={donem}
            onChange={(e) => setDonem(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {donemSecenekleri.map((d) => (
              <option key={d} value={d}>
                {donemEtiketi(d)}
                {guncelDonemMi(d, aktifDonem) ? " (güncel)" : ""}
              </option>
            ))}
          </select>
          {!saltOkunur && (
            <>
              <button
                onClick={() => setSonlandirmaOnayi(true)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Dönemi Sonlandır
              </button>
              <input
                ref={dosyaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) excelYukle();
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => dosyaInputRef.current?.click()}
                disabled={yukleniyor}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {yukleniyor ? "Yükleniyor..." : "Excel'den Yükle"}
              </button>
            </>
          )}
        </div>
      </div>

      {sonlandirmaOnayi && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            {donemEtiketi(aktifDonem)} sonlandırılsın mı? Bu dönem salt görüntülenebilir olur, yeni
            kayıtlar {donemEtiketi(sonrakiDonem(aktifDonem))} dönemine girilmeye başlanır.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={donemiSonlandirOnayla}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Evet, Sonlandır
            </button>
            <button
              onClick={() => setSonlandirmaOnayi(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {saltOkunur && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
          <Lock className="h-3.5 w-3.5" />
          Bu dönem geçmişte kaldığı için salt görüntülenebilir; yeni karne yükleme yalnızca güncel
          dönemde ({donemEtiketi(aktifDonem)}) yapılabilir.
        </div>
      )}

      {sonMesaj && (
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {sonMesaj}
        </div>
      )}

      <AdayDetayTabs
        tabs={istihdamTipineGoreGruplar.map((grup) => ({
          id: grup.tip,
          label: `${grup.tip} (${grup.satirlar.length})`,
          content: <KarneTablosu satirlar={grup.satirlar} />,
        }))}
      />
    </div>
  );
}
