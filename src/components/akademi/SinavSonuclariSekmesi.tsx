"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Pencil } from "lucide-react";
import {
  type Duzeltme,
  DuzeltmeFormu,
  SinavPuani,
} from "@/components/aday/AkademiSinavSonuclari";
import { useAdaylar } from "@/lib/AdaylarContext";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { akademiDenemeleri, akademiNihaisi } from "@/lib/akademiSinav";
import {
  basliklariGrupla,
  VARSAYILAN_SINAV_BASLIKLARI,
} from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { bugun, tarihYaz } from "@/lib/akademi";
import type { AdayEgitmen, AkademiSinavSonucu } from "@/lib/types";

/** Akademi bazında sınav sonuçları listesi ve raporu (PRD 9.1). */
export function SinavSonuclariSekmesi() {
  const { currentUser } = useCurrentUser();
  const { adaylar } = useAdaylar();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari, puanDuzelt } = useAkademiSinavSonuclari();
  // İK / Sistem Yöneticisi puanı burada da düzeltebilir (profildeki ile aynı iz kaydı).
  const yetkili = ikYetkisiVarMi(currentUser.rol);
  const [duzeltme, setDuzeltme] = useState<Duzeltme | null>(null);
  const akademiler = donemler.filter(
    (d) => !d.iptal && d.kayitlilar.length > 0,
  );
  const [akademiId, setAkademiId] = useState(akademiler[0]?.id ?? "");
  const [arama, setArama] = useState("");
  // Seçilen sınav (1 / 2 / 3): yalnızca o sınava girenler ve o sınavın puanları.
  const [seciliSinav, setGorunum] = useState<1 | 2 | 3>(1);

  const akademi = donemler.find((d) => d.id === akademiId);
  // Akademide yapılmış sınavlar; seçim bunlardan biri değilse ilkine düşer.
  const akademiSinavlari = [
    ...new Set(
      sinavSonuclari
        .filter((s) => s.akademiDonemiId === akademiId)
        .map((s) => s.sinavNo),
    ),
  ].sort();
  const gorunum: 1 | 2 | 3 = akademiSinavlari.includes(seciliSinav)
    ? seciliSinav
    : (akademiSinavlari[0] ?? 1);
  const kayitlilar = (akademi?.kayitlilar ?? [])
    .map((id) => adaylar.find((a) => a.id === id))
    .filter((a): a is AdayEgitmen => !!a)
    .filter((a) =>
      `${a.ad} ${a.soyad}`
        .toLocaleLowerCase("tr")
        .includes(arama.trim().toLocaleLowerCase("tr")),
    );
  const nihaiBul = (a: AdayEgitmen) =>
    akademiNihaisi(akademiDenemeleri(sinavSonuclari, a.id, akademiId));
  // Yalnızca seçilen sınava girenler listelenir.
  const denemeBul = (a: AdayEgitmen) =>
    nihaiBul(a).denemeler.find((d) => d.sinavNo === gorunum);
  const listelenenler = kayitlilar.filter((a) => !!denemeBul(a));
  /** Satırın genel sonucu: seçilen sınav sonrası. */
  const genelBul = (a: AdayEgitmen) => denemeBul(a)?.genelSonuc;
  const ilkSonuc = kayitlilar
    .map((a) => nihaiBul(a).denemeler[0])
    .find((s) => s);
  // Kolonlar Excel'den gelen başlıklardır; henüz yükleme yoksa varsayılan şablon başlıkları.
  const basliklar = ilkSonuc?.basliklar ?? VARSAYILAN_SINAV_BASLIKLARI;
  const genelBaslik = ilkSonuc?.genelSonucBasligi ?? "PERSONAL TRAINING";
  /**
   * Seçilen görünüme göre bir dersin puanı ve geldiği sınav. 2. / 3. sınav görünümünde o sınava
   * girilmeyen dersin önceki sınavdaki puanı gösterilir (`onceki`).
   */
  const puanBul = (
    a: AdayEgitmen,
    i: number,
  ): {
    puan: number | null;
    sinavNo?: number;
    onceki?: boolean;
    // Gösterilen puanın kaydı (düzeltme bu kayda yapılır).
    duzeltilecek?: Duzeltme;
  } => {
    const n = nihaiBul(a);
    const ders = n.dersler.find(
      (d) =>
        d.baslik.grup === basliklar[i].grup && d.baslik.ad === basliklar[i].ad,
    );
    const kayit = (no?: number): Duzeltme | undefined => {
      const sonuc: AkademiSinavSonucu | undefined = n.denemeler.find(
        (d) => d.sinavNo === no,
      );
      const indeks =
        sonuc?.basliklar.findIndex(
          (b) => b.grup === basliklar[i].grup && b.ad === basliklar[i].ad,
        ) ?? -1;
      return sonuc && indeks >= 0 ? { sonuc, indeks } : undefined;
    };
    if (!ders) return { puan: null };
    const buSinav = ders.puanlar[gorunum];
    if (buSinav !== undefined && buSinav !== null)
      return { puan: buSinav, duzeltilecek: kayit(gorunum) };
    // Bu sınava girilmedi: önceki sınavların en sonuncusundaki puan.
    for (let n = gorunum - 1; n >= 1; n--) {
      const p = ders.puanlar[n as 1 | 2];
      if (p !== undefined && p !== null)
        return { puan: p, sinavNo: n, onceki: true, duzeltilecek: kayit(n) };
    }
    // 1. sınavda boş kalan puan girilebilir.
    return { puan: null, duzeltilecek: gorunum === 1 ? kayit(1) : undefined };
  };

  const raporIndir = () => {
    const satirlar = [
      [
        "Eğitmen ID",
        "Ad Soyad",
        "Kulüp",
        "Sınav Sayısı",
        ...basliklar.map((b) => `${b.grup} - ${b.ad}`),
        `GENEL SONUÇ - ${genelBaslik}`,
      ],
      ...listelenenler.map((a) => {
        const n = nihaiBul(a);
        return [
          a.themisId,
          `${a.ad} ${a.soyad}`,
          a.kulup,
          String(n.denemeler.length || ""),
          ...basliklar.map((_, i) => (puanBul(a, i).puan ?? "") + ""),
          genelBul(a) ?? "",
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
          className="w-64 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand"
        >
          {akademiler.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ad} · {d.baslangicTarihi}
            </option>
          ))}
        </select>
        <select
          value={gorunum}
          onChange={(e) => setGorunum(Number(e.target.value) as 1 | 2 | 3)}
          disabled={akademiSinavlari.length === 0}
          className="w-64 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand disabled:text-zinc-400"
        >
          {akademiSinavlari.length === 0 ? (
            <option>Sınav sonucu yok</option>
          ) : (
            akademiSinavlari.map((n) => (
              <option key={n} value={n}>
                {n}. Sınav
              </option>
            ))
          )}
        </select>
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ad soyad ara..."
          className="w-64 h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={raporIndir}
            disabled={listelenenler.length === 0}
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
              <th
                rowSpan={2}
                className="border-b border-zinc-100 px-4 py-2 text-left"
              >
                Ad Soyad
              </th>
              <th
                rowSpan={2}
                className="border-b border-zinc-100 px-3 py-2 text-left"
              >
                Kulüp
              </th>
              <th rowSpan={2} className="border-b border-zinc-100 px-3 py-2">
                Sınav
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
              <th className="border-b border-l border-zinc-100 px-3 py-1.5">
                GENEL SONUÇ
              </th>
            </tr>
            <tr className="text-[10px] font-medium text-zinc-400">
              {basliklar.map((b, i) => (
                <th
                  key={i}
                  className="border-b border-l border-zinc-100 px-2 py-1.5"
                >
                  {b.ad}
                </th>
              ))}
              <th className="border-b border-l border-zinc-100 px-3 py-1.5">
                {genelBaslik}
              </th>
            </tr>
          </thead>
          <tbody>
            {listelenenler.map((a) => {
              const n = nihaiBul(a);
              return (
                <tr
                  key={a.id}
                  className="border-b border-zinc-50 last:border-0"
                >
                  <td className="px-4 py-2 text-left">
                    <Link
                      href={`/adaylar/${a.id}`}
                      className="font-medium text-zinc-900 hover:text-brand"
                    >
                      {a.ad} {a.soyad}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-left text-zinc-600">
                    {a.kulup}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {n.denemeler.length ? `${n.denemeler.length}/3` : "—"}
                  </td>
                  {basliklar.map((_, i) => {
                    const { puan, sinavNo, onceki, duzeltilecek } = puanBul(
                      a,
                      i,
                    );
                    return (
                      <td
                        key={i}
                        className="group/hucre relative border-l border-zinc-100 px-2 py-2"
                      >
                        <span
                          className="relative inline-block"
                          title={
                            onceki
                              ? `${sinavNo}. sınav puanı (bu sınava girilmedi)`
                              : undefined
                          }
                        >
                          {onceki ? (
                            // Bu sınava girilmeyen ders: önceki sınavdaki puan soluk.
                            <span className="inline-flex min-w-9 justify-center px-1.5 py-0.5 text-sm font-medium text-zinc-400">
                              {puan}
                            </span>
                          ) : (
                            <SinavPuani puan={puan} />
                          )}
                        </span>
                        {yetkili && duzeltilecek && (
                          <button
                            onClick={() => setDuzeltme(duzeltilecek)}
                            title="Puanı düzelt"
                            className="absolute right-0.5 top-0.5 rounded p-0.5 text-zinc-300 opacity-0 hover:text-zinc-600 group-hover/hucre:opacity-100"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-l border-zinc-100 px-3 py-2">
                    {genelBul(a) ? (
                      // Kutusuz, yalnızca renkli yazı.
                      <span
                        className={`font-semibold ${genelBul(a) === "Geçti" ? "text-emerald-700" : "text-rose-600"}`}
                      >
                        {genelBul(a)}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {listelenenler.length === 0 && (
              <tr>
                <td
                  colSpan={basliklar.length + 4}
                  className="px-4 py-10 text-center text-sm text-zinc-400"
                >
                  {akademiSinavlari.length === 0
                    ? "Bu akademide henüz sınav sonucu yok."
                    : `${gorunum}. sınava giren aday yok.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {duzeltme && (
        <DuzeltmeFormu
          duzeltme={duzeltme}
          onClose={() => setDuzeltme(null)}
          onKaydet={(yeni, aciklama) => {
            puanDuzelt(
              duzeltme.sonuc.id,
              duzeltme.indeks,
              yeni,
              aciklama,
              `${currentUser.ad} (${currentUser.rol})`,
              tarihYaz(bugun()),
            );
            setDuzeltme(null);
          }}
        />
      )}
    </div>
  );
}
