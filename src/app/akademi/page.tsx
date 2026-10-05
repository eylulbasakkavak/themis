"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, GraduationCap, Plus } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SinavSonuclariSekmesi } from "@/components/akademi/SinavSonuclariSekmesi";
import { YeniAkademiModal } from "@/components/akademi/YeniAkademiModal";
import {
  akademiDurumu,
  doluluk,
  gelmeyenSayisi,
  inputTarihindenCevir,
  kisaAkademiMi,
  bugun,
  tarihCoz,
  yoklamaAlindiMi,
} from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";

type Sekme = "akademiler" | "sinav";
type TipFiltresi = "" | "Standart" | "Kısa Dönem";

const SEKMELER: { deger: Sekme; label: string }[] = [
  { deger: "akademiler", label: "Akademiler" },
  { deger: "sinav", label: "Sınav Sonuçları" },
];

function yakinlikSirasi(d: { baslangicTarihi: string; bitisTarihi: string }): number {
  const simdi = bugun().getTime();
  const baslangic = tarihCoz(d.baslangicTarihi)?.getTime() ?? 0;
  const bitis = tarihCoz(d.bitisTarihi)?.getTime() ?? 0;
  const GUN = 86_400_000;
  if (bitis >= simdi && baslangic <= simdi) return (baslangic - simdi) / GUN; // devam ediyor
  if (baslangic > simdi) return (baslangic - simdi) / GUN; // yaklaşan: en yakını önce
  return 1_000_000 + (simdi - bitis) / GUN; // biten: en son biten önce
}

export default function AkademiPage() {
  const router = useRouter();
  const { donemler } = useAkademiDonemleri();
  const [sekme, setSekme] = useState<Sekme>("akademiler");
  const [yeniAcik, setYeniAcik] = useState(false);
  const [tipFiltresi, setTipFiltresi] = useState<TipFiltresi>("");
  const [tarihBaslangic, setTarihBaslangic] = useState("");
  const [tarihBitis, setTarihBitis] = useState("");

  // Liste akademi başlangıç tarihine ve tipine göre filtrelenir (PRD 7.2).
  const gorunenler = donemler
    .filter((d) => {
      if (tipFiltresi && (kisaAkademiMi(d.tip) ? "Kısa Dönem" : "Standart") !== tipFiltresi) {
        return false;
      }
      const baslangic = tarihCoz(d.baslangicTarihi);
      const alt = tarihBaslangic ? tarihCoz(inputTarihindenCevir(tarihBaslangic)) : null;
      const ust = tarihBitis ? tarihCoz(inputTarihindenCevir(tarihBitis)) : null;
      if (baslangic && alt && baslangic < alt) return false;
      if (baslangic && ust && baslangic > ust) return false;
      return true;
    })
    // Bugüne en yakın akademiler üstte: önce devam edenler, sonra en yakın başlayacaklar,
    // en altta biten akademiler (en son biten önce).
    .sort((a, b) => yakinlikSirasi(a) - yakinlikSirasi(b));

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Akademi</h1>
        <button
          type="button"
          onClick={() => setYeniAcik(true)}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Yeni Akademi Ekle
        </button>
      </div>

      <div className="flex shrink-0 gap-2 border-b border-zinc-200">
        {SEKMELER.map((s) => (
          <button
            key={s.deger}
            onClick={() => setSekme(s.deger)}
            className={`-mb-px border-b-2 px-4 pb-3 pt-1 text-[15px] transition-colors ${
              sekme === s.deger
                ? "border-brand font-semibold text-zinc-900"
                : "border-transparent font-medium text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sekme === "akademiler" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
            <select
              value={tipFiltresi}
              onChange={(e) => setTipFiltresi(e.target.value as TipFiltresi)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Tüm Tipler</option>
              <option value="Standart">Standart (4 Hafta)</option>
              <option value="Kısa Dönem">Kısa Dönem (1 Hafta)</option>
            </select>
            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
              Başlangıç:
              <input
                type="date"
                value={tarihBaslangic}
                onChange={(e) => setTarihBaslangic(e.target.value)}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
              />
              –
              <input
                type="date"
                value={tarihBitis}
                onChange={(e) => setTarihBitis(e.target.value)}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
              />
            </div>
            {(tipFiltresi || tarihBaslangic || tarihBitis) && (
              <button
                onClick={() => {
                  setTipFiltresi("");
                  setTarihBaslangic("");
                  setTarihBitis("");
                }}
                className="text-xs font-medium text-brand hover:underline"
              >
                Filtreleri temizle
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400">{gorunenler.length} akademi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="px-5 py-2.5">Akademi</th>
                  <th className="px-4 py-2.5">Tip</th>
                  <th className="px-4 py-2.5">Tarih</th>
                  <th className="px-4 py-2.5">Doluluk</th>
                  <th className="px-4 py-2.5">Gelmeyen</th>
                  <th className="px-4 py-2.5">Durum</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {gorunenler.map((d) => {
                  const durum = akademiDurumu(d);
                  const dol = doluluk(d);
                  const oran =
                    dol.payda > 0 ? Math.min(100, Math.round((dol.pay / dol.payda) * 100)) : 0;
                  const kisa = kisaAkademiMi(d.tip);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => router.push(`/akademi/${d.id}`)}
                      className={`group cursor-pointer border-b border-zinc-50 last:border-0 hover:bg-zinc-50 ${
                        d.iptal ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              kisa
                                ? "bg-orange-100 text-orange-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            <GraduationCap className="h-4.5 w-4.5" />
                          </span>
                          <span className="font-medium text-zinc-900 group-hover:text-brand">
                            {d.ad}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-700">{kisa ? "Kısa Dönem" : "Standart"}</div>
                        <div className="text-xs text-zinc-400">{kisa ? "1 Hafta" : "4 Hafta"}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {d.baslangicTarihi} – {d.bitisTarihi}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-800">
                          {dol.pay} / {dol.payda}
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${
                              yoklamaAlindiMi(d)
                                ? "bg-emerald-500"
                                : oran >= 100
                                  ? "bg-rose-500"
                                  : "bg-brand"
                            }`}
                            style={{ width: `${oran}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-400">{dol.etiket}</div>
                      </td>
                      <td className="px-4 py-3">
                        {yoklamaAlindiMi(d) ? (
                          <span
                            className={
                              gelmeyenSayisi(d) > 0
                                ? "font-semibold text-rose-600"
                                : "text-zinc-500"
                            }
                          >
                            {gelmeyenSayisi(d)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={durum.label} tone={durum.tone} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-zinc-300 group-hover:text-brand" />
                      </td>
                    </tr>
                  );
                })}
                {gorunenler.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-400">
                      Bu filtreyle eşleşen akademi yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sekme === "sinav" && <SinavSonuclariSekmesi />}

      {yeniAcik && <YeniAkademiModal onClose={() => setYeniAcik(false)} />}
    </div>
  );
}
