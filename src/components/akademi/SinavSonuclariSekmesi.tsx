"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { GenelSonucRozeti, SinavPuani } from "@/components/aday/AkademiSinavSonuclari";
import { useAdaylar } from "@/lib/AdaylarContext";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { basliklariGrupla, VARSAYILAN_SINAV_BASLIKLARI } from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen } from "@/lib/types";

/** Akademi bazında sınav sonuçları listesi ve raporu (PRD 9.1). */
export function SinavSonuclariSekmesi() {
  const { currentUser } = useCurrentUser();
  const { adaylar } = useAdaylar();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const akademiler = donemler.filter((d) => !d.iptal && d.kayitlilar.length > 0);
  const [akademiId, setAkademiId] = useState(akademiler[0]?.id ?? "");
  const [arama, setArama] = useState("");

  const akademi = donemler.find((d) => d.id === akademiId);
  const kayitlilar = (akademi?.kayitlilar ?? [])
    .map((id) => adaylar.find((a) => a.id === id))
    .filter((a): a is AdayEgitmen => !!a)
    .filter((a) =>
      `${a.ad} ${a.soyad}`.toLocaleLowerCase("tr").includes(arama.trim().toLocaleLowerCase("tr"))
    );
  const sonucBul = (a: AdayEgitmen) =>
    sinavSonuclari.find((s) => s.egitmenId === a.id && s.akademiDonemiId === akademiId);
  // Kolonlar Excel'den gelen başlıklardır; henüz yükleme yoksa varsayılan şablon başlıkları.
  const basliklar =
    kayitlilar.map(sonucBul).find((s) => s)?.basliklar ?? VARSAYILAN_SINAV_BASLIKLARI;
  const genelBaslik =
    kayitlilar.map(sonucBul).find((s) => s)?.genelSonucBasligi ?? "PERSONAL TRAINING";

  const raporIndir = () => {
    const satirlar = [
      [
        "Eğitmen ID",
        "Ad Soyad",
        "Kulüp",
        ...basliklar.map((b) => `${b.grup} - ${b.ad}`),
        `GENEL SONUÇ - ${genelBaslik}`,
      ],
      ...kayitlilar.map((a) => {
        const s = sonucBul(a);
        return [
          a.themisId,
          `${a.ad} ${a.soyad}`,
          a.kulup,
          ...basliklar.map((_, i) => (s?.puanlar[i] ?? "") + ""),
          s?.genelSonuc ?? "",
        ];
      }),
    ];
    const csv = satirlar
      .map((s) => s.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sinav-sonuclari-${(akademi?.ad ?? "akademi").replace(/[\s/]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <select
          value={akademiId}
          onChange={(e) => setAkademiId(e.target.value)}
          className="min-w-[260px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {akademiler.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ad} · {d.baslangicTarihi}
            </option>
          ))}
        </select>
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ad soyad ara..."
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <div className="ml-auto flex items-center gap-2">
          {ikYetkisiVarMi(currentUser.rol) && (
            <Link
              href="/toplu-islemler/akademi-sinav-sonucu"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <Upload className="h-4 w-4" />
              Excel ile Sonuç Yükle
            </Link>
          )}
          <button
            onClick={raporIndir}
            disabled={kayitlilar.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Rapor İndir
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-center text-sm">
          <thead>
            <tr className="text-[11px] font-semibold text-zinc-500">
              <th rowSpan={2} className="border-b border-zinc-100 px-4 py-2 text-left">
                Ad Soyad
              </th>
              <th rowSpan={2} className="border-b border-zinc-100 px-3 py-2 text-left">
                Kulüp
              </th>
              {basliklariGrupla(basliklar).map((g, i) => (
                <th
                  key={`${g.grup}-${i}`}
                  colSpan={g.adet}
                  className="border-b border-l border-zinc-100 px-2 py-1.5"
                >
                  {g.grup}
                </th>
              ))}
              <th className="border-b border-l border-zinc-100 px-3 py-1.5">GENEL SONUÇ</th>
            </tr>
            <tr className="text-[10px] font-medium text-zinc-400">
              {basliklar.map((b, i) => (
                <th key={i} className="border-b border-l border-zinc-100 px-2 py-1.5">
                  {b.ad}
                </th>
              ))}
              <th className="border-b border-l border-zinc-100 px-3 py-1.5">{genelBaslik}</th>
            </tr>
          </thead>
          <tbody>
            {kayitlilar.map((a) => {
              const s = sonucBul(a);
              return (
                <tr key={a.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-4 py-2 text-left">
                    <Link
                      href={`/adaylar/${a.id}`}
                      className="font-medium text-zinc-900 hover:text-brand"
                    >
                      {a.ad} {a.soyad}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-left text-zinc-600">{a.kulup}</td>
                  {basliklar.map((_, i) => (
                    <td key={i} className="border-l border-zinc-100 px-2 py-2">
                      <SinavPuani puan={s?.puanlar[i] ?? null} />
                    </td>
                  ))}
                  <td className="border-l border-zinc-100 px-3 py-2">
                    {s ? (
                      <GenelSonucRozeti sonuc={s.genelSonuc} />
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {kayitlilar.length === 0 && (
              <tr>
                <td
                  colSpan={basliklar.length + 3}
                  className="px-4 py-10 text-center text-sm text-zinc-400"
                >
                  Bu akademide listelenecek aday yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
