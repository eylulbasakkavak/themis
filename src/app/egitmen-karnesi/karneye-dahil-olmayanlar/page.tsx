"use client";

import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Pencil, Pin, RotateCcw, Trash2, UserMinus } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EgitmenCikarModal } from "@/components/karne/EgitmenCikarModal";
import { LigSabitleModal } from "@/components/karne/LigSabitleModal";
import { useAdaylar } from "@/lib/AdaylarContext";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import {
  aktifSabitlemeKaydi,
  donemEtiketi,
  efektifLig,
  IZIN_SEBEPLERI,
  karneyeDahilMi,
  LIG_TONU,
} from "@/lib/karne";
import { useKarneler } from "@/lib/KarnelerContext";
import { toneTextClasses } from "@/lib/status";
import type { EgitmenLig, KarneHaricKaydi, KarneSabitlemeKaydi } from "@/lib/types";

const OTOMATIK_ATANACAK_SEBEPLER = IZIN_SEBEPLERI.filter((s) => s !== "Diğer");

function bugununTarihi() {
  const d = new Date();
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  return `${gun}.${ay}.${d.getFullYear()}`;
}

export default function KarneyeDahilOlmayanlarPage() {
  const { adaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const {
    karneler,
    haricKayitlari,
    haricEkle,
    haricGuncelle,
    haricSil,
    haricAktifligiDegistir,
    sabitlemeKayitlari,
    sabitlemeEkle,
    sabitlemeGuncelle,
    sabitlemeSil,
    sabitlemeAktifligiDegistir,
    aktifDonem,
  } = useKarneler();

  const [cikarModalAcik, setCikarModalAcik] = useState(false);
  const [duzenlenenHaricKayit, setDuzenlenenHaricKayit] = useState<KarneHaricKaydi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [excelMesaj, setExcelMesaj] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [sabitleModalAcik, setSabitleModalAcik] = useState(false);
  const [duzenlenenSabitlemeKayit, setDuzenlenenSabitlemeKayit] =
    useState<KarneSabitlemeKaydi | null>(null);
  const [sabitleYukleniyor, setSabitleYukleniyor] = useState(false);
  const [sabitleExcelMesaj, setSabitleExcelMesaj] = useState<string | null>(null);
  const sabitleDosyaInputRef = useRef<HTMLInputElement>(null);

  const egitmenler = useMemo(() => adaylar.filter((a) => a.surecDurumu === "egitmen"), [adaylar]);
  const dahilOlanlar = egitmenler.filter((a) => karneyeDahilMi(a, haricKayitlari));

  const sonFinalPuan = (egitmenId: string): number | null => {
    const sonKarne = karneler
      .filter((k) => k.egitmenId === egitmenId)
      .sort((a, b) => (a.donem > b.donem ? -1 : 1))[0];
    return sonKarne?.finalPuan ?? null;
  };

  const ligHesapla = (egitmenId: string): EgitmenLig | null => {
    const puan = sonFinalPuan(egitmenId);
    if (puan === null) return null;
    return efektifLig(egitmenId, puan, haricKayitlari, sabitlemeKayitlari);
  };

  const aktifKayitlar = useMemo(
    () => haricKayitlari.filter((k) => k.aktif).sort((a, b) => b.donem.localeCompare(a.donem)),
    [haricKayitlari]
  );

  const aktifSabitlemeler = useMemo(
    () => sabitlemeKayitlari.filter((k) => k.aktif).sort((a, b) => b.donem.localeCompare(a.donem)),
    [sabitlemeKayitlari]
  );

  const sabitlenebilirEgitmenler = dahilOlanlar.filter(
    (a) => !aktifSabitlemeKaydi(a.id, sabitlemeKayitlari)
  );

  const cikarAdaylari = useMemo(() => {
    if (!duzenlenenHaricKayit) return dahilOlanlar;
    const ekstra = adaylar.find((a) => a.id === duzenlenenHaricKayit.egitmenId);
    if (!ekstra || dahilOlanlar.some((a) => a.id === ekstra.id)) return dahilOlanlar;
    return [...dahilOlanlar, ekstra];
  }, [dahilOlanlar, duzenlenenHaricKayit, adaylar]);

  const sabitleAdaylari = useMemo(() => {
    if (!duzenlenenSabitlemeKayit) return sabitlenebilirEgitmenler;
    const ekstra = adaylar.find((a) => a.id === duzenlenenSabitlemeKayit.egitmenId);
    if (!ekstra || sabitlenebilirEgitmenler.some((a) => a.id === ekstra.id)) {
      return sabitlenebilirEgitmenler;
    }
    return [...sabitlenebilirEgitmenler, ekstra];
  }, [sabitlenebilirEgitmenler, duzenlenenSabitlemeKayit, adaylar]);

  const haricKaydet = (veri: {
    egitmenId: string;
    sebep: string;
    suresiz: boolean;
    hedefDonem: string;
  }) => {
    if (duzenlenenHaricKayit) {
      haricGuncelle({
        ...duzenlenenHaricKayit,
        egitmenId: veri.egitmenId,
        sebep: veri.sebep,
        suresiz: veri.suresiz,
        donem: veri.hedefDonem,
      });
    } else {
      haricEkle({
        id: `h-${veri.egitmenId}-${aktifDonem}-${haricKayitlari.length + 1}`,
        egitmenId: veri.egitmenId,
        donem: veri.hedefDonem,
        sebep: veri.sebep,
        oncekiLig: ligHesapla(veri.egitmenId) ?? undefined,
        suresiz: veri.suresiz,
        aktif: true,
        girisTarihi: bugununTarihi(),
        giren: `${currentUser.ad} (${currentUser.rol})`,
      });
    }
    setCikarModalAcik(false);
    setDuzenlenenHaricKayit(null);
  };

  const exceldenTopluCikar = () => {
    setYukleniyor(true);
    setTimeout(() => {
      if (dahilOlanlar.length === 0) {
        setExcelMesaj("Çıkarılabilecek eğitmen bulunmuyor.");
        setYukleniyor(false);
        return;
      }
      const adet = Math.min(3, dahilOlanlar.length);
      const secilenler = [...dahilOlanlar].sort(() => Math.random() - 0.5).slice(0, adet);
      secilenler.forEach((aday, i) => {
        const sebepMetni = OTOMATIK_ATANACAK_SEBEPLER[i % OTOMATIK_ATANACAK_SEBEPLER.length];
        haricEkle({
          id: `h-${aday.id}-${aktifDonem}-excel-${i}`,
          egitmenId: aday.id,
          donem: aktifDonem,
          sebep: sebepMetni,
          oncekiLig: ligHesapla(aday.id) ?? undefined,
          suresiz: true,
          aktif: true,
          girisTarihi: bugununTarihi(),
          giren: `${currentUser.ad} (${currentUser.rol}) — Excel toplu işlem`,
        });
      });
      setYukleniyor(false);
      setExcelMesaj(`${secilenler.length} eğitmen Excel'den karneden çıkarıldı.`);
    }, 500);
  };

  const sabitlemeKaydet = (veri: { egitmenId: string; lig: EgitmenLig; sebep: string }) => {
    if (duzenlenenSabitlemeKayit) {
      sabitlemeGuncelle({
        ...duzenlenenSabitlemeKayit,
        egitmenId: veri.egitmenId,
        lig: veri.lig,
        sebep: veri.sebep,
      });
    } else {
      sabitlemeEkle({
        id: `s-${veri.egitmenId}-${aktifDonem}-${sabitlemeKayitlari.length + 1}`,
        egitmenId: veri.egitmenId,
        donem: aktifDonem,
        lig: veri.lig,
        sebep: veri.sebep,
        aktif: true,
        girisTarihi: bugununTarihi(),
        giren: `${currentUser.ad} (${currentUser.rol})`,
      });
    }
    setSabitleModalAcik(false);
    setDuzenlenenSabitlemeKayit(null);
  };

  const exceldenTopluSabitle = () => {
    setSabitleYukleniyor(true);
    setTimeout(() => {
      if (sabitlenebilirEgitmenler.length === 0) {
        setSabitleExcelMesaj("Ligi sabitlenebilecek eğitmen bulunmuyor.");
        setSabitleYukleniyor(false);
        return;
      }
      const adet = Math.min(3, sabitlenebilirEgitmenler.length);
      const secilenler = [...sabitlenebilirEgitmenler]
        .sort(() => Math.random() - 0.5)
        .slice(0, adet);
      secilenler.forEach((aday, i) => {
        sabitlemeEkle({
          id: `s-${aday.id}-${aktifDonem}-excel-${i}`,
          egitmenId: aday.id,
          donem: aktifDonem,
          lig: ligHesapla(aday.id) ?? "Silver",
          sebep: "Diğer",
          aktif: true,
          girisTarihi: bugununTarihi(),
          giren: `${currentUser.ad} (${currentUser.rol}) — Excel toplu işlem`,
        });
      });
      setSabitleYukleniyor(false);
      setSabitleExcelMesaj(`${secilenler.length} eğitmenin ligi Excel'den sabitlendi.`);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Karneye Dahil Olmayan Eğitmenler</h1>
        <p className="text-xs text-zinc-400">
          Eğitmen karnesinden çıkarma ve ligi sabitleme, birbirinden bağımsız iki ayrı işlemdir.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-900">Eğitmen Karneden Çıkarılanlar</h2>

        {excelMesaj && (
          <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {excelMesaj}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
            <p className="min-w-0 flex-1 text-xs text-zinc-400">
              Sağlık durumu, doğum izni, askerlik, tadilattaki kulüp vb. — ayrıldığı andaki ligi
              kaydedilir, geri dahil edildiğinde bu değerde sabit kalır.
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <input
                ref={dosyaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) exceldenTopluCikar();
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => dosyaInputRef.current?.click()}
                disabled={yukleniyor}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {yukleniyor ? "Yükleniyor..." : "Excel'den Yükle"}
              </button>
              <button
                onClick={() => {
                  setDuzenlenenHaricKayit(null);
                  setCikarModalAcik(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <UserMinus className="h-4 w-4" />
                Eğitmen Çıkar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="px-4 py-2.5">Ad Soyad</th>
                  <th className="px-4 py-2.5">Kulüp</th>
                  <th className="px-4 py-2.5">Sebep</th>
                  <th className="px-4 py-2.5">Çıkış</th>
                  <th className="px-4 py-2.5">Dönüş</th>
                  <th className="px-4 py-2.5">Çıkarma Dönemi</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {aktifKayitlar.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-400">
                      Şu an karneden çıkarılmış eğitmen bulunmuyor.
                    </td>
                  </tr>
                )}
                {aktifKayitlar.map((kayit, i) => {
                  const aday = adaylar.find((a) => a.id === kayit.egitmenId);
                  return (
                    <tr
                      key={kayit.id}
                      className={`border-b border-zinc-50 last:border-0 ${
                        i % 2 === 1 ? "bg-zinc-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {aday ? `${aday.ad} ${aday.soyad}` : "Bilinmeyen eğitmen"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{aday?.kulup ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{kayit.sebep}</td>
                      <td className="px-4 py-3 text-zinc-500">{kayit.girisTarihi}</td>
                      <td className="px-4 py-3 text-zinc-500">—</td>
                      <td className="px-4 py-3">
                        {kayit.suresiz ? (
                          <Badge label="Süresiz" tone="gray" />
                        ) : (
                          <Badge label={donemEtiketi(kayit.donem)} tone="amber" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => haricAktifligiDegistir(kayit.id, false)}
                            title="Geri Dahil Et"
                            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Geri Dahil Et
                          </button>
                          <button
                            onClick={() => {
                              setDuzenlenenHaricKayit(kayit);
                              setCikarModalAcik(true);
                            }}
                            title="Düzenle"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => haricSil(kayit.id)}
                            title="Sil"
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-900">
          Eğitmen Karnede Ligi Sabitlenenler
        </h2>

        {sabitleExcelMesaj && (
          <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {sabitleExcelMesaj}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
            <p className="min-w-0 flex-1 text-xs text-zinc-400">
              Eğitmen karneden çıkarılmaz, görünmeye devam eder — sadece ligi burada seçilen değerde
              sabitlenir, yeni final puanlarına göre değişmez. Fraud da dahil olmak üzere tüm
              sabitleme sebepleri burada tek listeden yönetilir.
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <input
                ref={sabitleDosyaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) exceldenTopluSabitle();
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => sabitleDosyaInputRef.current?.click()}
                disabled={sabitleYukleniyor}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {sabitleYukleniyor ? "Yükleniyor..." : "Excel'den Yükle"}
              </button>
              <button
                onClick={() => {
                  setDuzenlenenSabitlemeKayit(null);
                  setSabitleModalAcik(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Pin className="h-4 w-4" />
                Ligi Sabitle
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="px-4 py-2.5">Ad Soyad</th>
                  <th className="px-4 py-2.5">Kulüp</th>
                  <th className="px-4 py-2.5">Sebep</th>
                  <th className="px-4 py-2.5">Giriş</th>
                  <th className="px-4 py-2.5">Sabitlenen Lig</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {aktifSabitlemeler.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                      Şu an karnede ligi sabitlenmiş eğitmen bulunmuyor.
                    </td>
                  </tr>
                )}
                {aktifSabitlemeler.map((kayit, i) => {
                  const aday = adaylar.find((a) => a.id === kayit.egitmenId);
                  return (
                    <tr
                      key={kayit.id}
                      className={`border-b border-zinc-50 last:border-0 ${
                        i % 2 === 1 ? "bg-zinc-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {aday ? `${aday.ad} ${aday.soyad}` : "Bilinmeyen eğitmen"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{aday?.kulup ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{kayit.sebep}</td>
                      <td className="px-4 py-3 text-zinc-500">{kayit.girisTarihi}</td>
                      <td
                        className={`px-4 py-3 font-medium ${toneTextClasses[LIG_TONU[kayit.lig]]}`}
                      >
                        {kayit.lig}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => sabitlemeAktifligiDegistir(kayit.id, false)}
                            title="Sabitlemeyi Kaldır"
                            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Kaldır
                          </button>
                          <button
                            onClick={() => {
                              setDuzenlenenSabitlemeKayit(kayit);
                              setSabitleModalAcik(true);
                            }}
                            title="Düzenle"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => sabitlemeSil(kayit.id)}
                            title="Sil"
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {cikarModalAcik && (
        <EgitmenCikarModal
          adaylar={cikarAdaylari}
          mevcutKayit={duzenlenenHaricKayit ?? undefined}
          aktifDonem={aktifDonem}
          onKaydet={haricKaydet}
          onClose={() => {
            setCikarModalAcik(false);
            setDuzenlenenHaricKayit(null);
          }}
        />
      )}

      {sabitleModalAcik && (
        <LigSabitleModal
          adaylar={sabitleAdaylari}
          mevcutKayit={duzenlenenSabitlemeKayit ?? undefined}
          ligHesapla={ligHesapla}
          onKaydet={sabitlemeKaydet}
          onClose={() => {
            setSabitleModalAcik(false);
            setDuzenlenenSabitlemeKayit(null);
          }}
        />
      )}
    </div>
  );
}
