"use client";

import { ClipboardList, Download } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { basliklariGrupla, GECME_PUANI } from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import type { AdayEgitmen, AkademiSinavSonucu } from "@/lib/types";

/** Puan hücresi: 70'in altındaki puanlar "kaldı" olarak kırmızı işaretlenir (PRD 9.1). */
export function SinavPuani({ puan }: { puan: number | null }) {
  if (puan === null) return <span className="text-zinc-300">—</span>;
  const kaldi = puan < GECME_PUANI;
  return (
    <span
      className={`inline-flex min-w-9 flex-col items-center rounded-md px-1.5 py-0.5 text-sm font-semibold ${
        kaldi ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
      title={kaldi ? `${GECME_PUANI} altı — kaldı` : undefined}
    >
      {puan}
      {kaldi && <span className="text-[9px] font-medium uppercase leading-none">kaldı</span>}
    </span>
  );
}

export function GenelSonucRozeti({ sonuc }: { sonuc: AkademiSinavSonucu["genelSonuc"] }) {
  return <Badge label={sonuc} tone={sonuc === "Geçti" ? "green" : "red"} />;
}

function raporIndir(aday: AdayEgitmen, sonuc: AkademiSinavSonucu, akademiAdi: string) {
  const basliklar = [
    "Eğitmen ID",
    "Ad Soyad",
    "Kulüp",
    "Akademi",
    ...sonuc.basliklar.map((b) => `${b.grup} - ${b.ad}`),
    `GENEL SONUÇ - ${sonuc.genelSonucBasligi}`,
  ];
  const satir = [
    aday.themisId,
    `${aday.ad} ${aday.soyad}`,
    aday.kulup,
    akademiAdi,
    ...sonuc.puanlar.map((p) => (p === null ? "" : String(p))),
    sonuc.genelSonuc,
  ];
  const csv = [basliklar, satir]
    .map((s) => s.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sinav-sonucu-${aday.themisId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Eğitmen profilindeki Akademi Sınav Sonuçları — Excel'deki başlık ve puanlarla (PRD 9.1). */
export function AkademiSinavSonuclari({ aday }: { aday: AdayEgitmen }) {
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const sonuclar = sinavSonuclari.filter((s) => s.egitmenId === aday.id);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">Akademi Sınav Sonuçları</h3>

      {sonuclar.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-400">
          <ClipboardList className="h-4 w-4 shrink-0" />
          Henüz sınav sonucu yüklenmedi. Sonuçlar Toplu İşlemler → Toplu Akademi Sınav Sonucu
          Yükleme ekranından Excel ile yüklenir.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sonuclar.map((sonuc) => {
            const akademi = donemler.find((d) => d.id === sonuc.akademiDonemiId);
            const akademiAdi = akademi
              ? `${akademi.ad} (${akademi.baslangicTarihi} – ${akademi.bitisTarihi})`
              : "Akademi";
            return (
              <div key={sonuc.id} className="rounded-xl border border-zinc-100">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-800">{akademiAdi}</div>
                    <div className="text-xs text-zinc-400">
                      Yüklendi: {sonuc.yuklemeTarihi} · {sonuc.yukleyen}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-zinc-400">
                        Genel Sonuç ({sonuc.genelSonucBasligi})
                      </div>
                      <GenelSonucRozeti sonuc={sonuc.genelSonuc} />
                    </div>
                    <button
                      onClick={() => raporIndir(aday, sonuc, akademiAdi)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Rapor
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-sm">
                    <thead>
                      <tr className="text-[11px] font-semibold text-zinc-500">
                        {basliklariGrupla(sonuc.basliklar).map((g, i) => (
                          <th
                            key={`${g.grup}-${i}`}
                            colSpan={g.adet}
                            className="border-b border-l border-zinc-100 px-2 py-1.5 first:border-l-0"
                          >
                            {g.grup}
                          </th>
                        ))}
                      </tr>
                      <tr className="text-[10px] font-medium text-zinc-400">
                        {sonuc.basliklar.map((b, i) => (
                          <th
                            key={i}
                            className="border-l border-zinc-100 px-2 py-1.5 first:border-l-0"
                          >
                            {b.ad}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {sonuc.puanlar.map((p, i) => (
                          <td
                            key={i}
                            className="border-l border-zinc-100 px-2 py-2 first:border-l-0"
                          >
                            <SinavPuani puan={p} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
