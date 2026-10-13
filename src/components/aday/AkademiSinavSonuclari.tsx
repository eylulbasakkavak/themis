"use client";

import { ClipboardList, Download } from "lucide-react";
import { Badge } from "@/components/Badge";
import { puanRengi, SonucMetni } from "@/components/aday/BilgiTablosu";
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

/** Eğitmen profilindeki Akademi Sınav Sonuçları — Excel'deki başlık ve puanlarla (PRD 9.1).
 * Her akademinin puanları profilde doğrudan Grup / Ders / Puan tablosu olarak görünür. */
export function AkademiSinavSonuclari({ aday }: { aday: AdayEgitmen }) {
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const sonuclar = sinavSonuclari.filter((s) => s.egitmenId === aday.id);
  const akademiAdi = (sonuc: AkademiSinavSonucu) => {
    const akademi = donemler.find((d) => d.id === sonuc.akademiDonemiId);
    return akademi
      ? `${akademi.ad} (${akademi.baslangicTarihi} – ${akademi.bitisTarihi})`
      : "Akademi";
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">Akademi Sınav Sonuçları</h3>

      {sonuclar.length === 0 ? (
        <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
          <ClipboardList className="h-4 w-4 shrink-0" />
          Henüz sınav sonucu yüklenmedi. Sonuçlar Toplu İşlemler → Toplu Akademi Sınav Sonucu Gir
          ekranından Excel ile yüklenir.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sonuclar.map((sonuc) => {
            // Grup adı yalnızca grubun ilk satırında yazılır (rowSpan).
            let indeks = 0;
            const gruplar = basliklariGrupla(sonuc.basliklar).map((g) => {
              const baslangic = indeks;
              indeks += g.adet;
              return { ...g, baslangic };
            });
            return (
              <div key={sonuc.id}>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{akademiAdi(sonuc)}</div>
                    <div className="mt-0.5 text-xs text-zinc-400">
                      Yüklendi: {sonuc.yuklemeTarihi} · {sonuc.yukleyen}
                    </div>
                  </div>
                  <button
                    onClick={() => raporIndir(aday, sonuc, akademiAdi(sonuc))}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Rapor
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                      <th className="w-56 py-2 pr-4 font-medium">Grup</th>
                      <th className="px-3 py-2 font-medium">Ders</th>
                      <th className="w-24 px-3 py-2 text-right font-medium">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruplar.flatMap((g) =>
                      sonuc.basliklar.slice(g.baslangic, g.baslangic + g.adet).map((b, j) => {
                        const p = sonuc.puanlar[g.baslangic + j];
                        const kaldi = p !== null && p < GECME_PUANI;
                        const renk = puanRengi(p === null ? null : !kaldi);
                        return (
                          <tr
                            key={g.baslangic + j}
                            className={j === g.adet - 1 ? "border-b border-zinc-200" : ""}
                          >
                            {j === 0 && (
                              <td
                                rowSpan={g.adet}
                                className="py-2 pr-4 align-top text-xs font-medium uppercase tracking-wide text-zinc-500"
                              >
                                {g.grup}
                              </td>
                            )}
                            <td className={`border-b-2 border-white px-3 py-2 ${renk}`}>{b.ad}</td>
                            <td
                              className={`border-b-2 border-white px-3 py-2 text-right font-semibold tabular-nums ${renk}`}
                              title={kaldi ? `${GECME_PUANI} altı — kaldı` : undefined}
                            >
                              {p === null ? <span className="text-zinc-300">—</span> : p}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    <tr>
                      <td className="py-2.5 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Genel Sonuç
                      </td>
                      <td className={`px-3 py-2.5 ${puanRengi(sonuc.genelSonuc === "Geçti")}`}>
                        {sonuc.genelSonucBasligi}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right ${puanRengi(sonuc.genelSonuc === "Geçti")}`}
                      >
                        <SonucMetni
                          label={sonuc.genelSonuc}
                          olumlu={sonuc.genelSonuc === "Geçti"}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
