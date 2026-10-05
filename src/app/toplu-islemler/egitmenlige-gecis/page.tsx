"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SozlesmeTipiSecimi } from "@/components/egitmen/SozlesmeTipiSecimi";
import { useAdaylar } from "@/lib/AdaylarContext";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { egitmenBilgileriEksikMi, egitmeneGecir } from "@/lib/egitmenGecis";
import type { IstihdamTipi } from "@/lib/types";

type Secim = { tip: IstihdamTipi | ""; altTip: string };

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

/**
 * Toplu eğitmen statüsüne geçiş (PRD 10.2): akademi sınavını geçen adaylar sözleşme tipi ve alt
 * sözleşme tipi seçilerek tek seferde eğitmen yapılır. Sınavdan kalan aday geçirilemez.
 */
export default function TopluEgitmenligeGecisPage() {
  const { adaylar, setAdaylar } = useAdaylar();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const { currentUser } = useCurrentUser();
  const [akademiFiltresi, setAkademiFiltresi] = useState("");
  const [secimler, setSecimler] = useState<Record<string, Secim>>({});
  const [isaretli, setIsaretli] = useState<string[]>([]);
  const [toplu, setToplu] = useState<Secim>({ tip: "", altTip: "" });
  const [mesaj, setMesaj] = useState<string | null>(null);

  if (!ikYetkisiVarMi(currentUser.rol)) {
    return (
      <div className="flex flex-col gap-5">
        <GeriDon />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
          Eğitmen statüsüne geçiş yalnızca İK tarafından yapılabilir. Şu anki rolün:{" "}
          {currentUser.rol}.
        </div>
      </div>
    );
  }

  const hazirlar = adaylar.filter((a) => a.surecDurumu === "akademiyi_tamamladi");
  const akademiler = donemler.filter((d) => hazirlar.some((a) => a.akademiDonemiId === d.id));
  const gorunenler = akademiFiltresi
    ? hazirlar.filter((a) => a.akademiDonemiId === akademiFiltresi)
    : hazirlar;

  const sinavSonucu = (id: string, donemId?: string) =>
    sinavSonuclari.find(
      (s) => s.egitmenId === id && (!s.akademiDonemiId || s.akademiDonemiId === donemId)
    )?.genelSonuc;
  const secim = (id: string): Secim => {
    const a = adaylar.find((x) => x.id === id);
    return secimler[id] ?? { tip: a?.istihdamTipi ?? "", altTip: a?.altSozlesmeTipi ?? "" };
  };
  const engel = (id: string): string | null => {
    const a = adaylar.find((x) => x.id === id)!;
    if (sinavSonucu(a.id, a.akademiDonemiId) === "Kaldı") return "Sınav sonucu Kaldı";
    if (egitmenBilgileriEksikMi(a)) return "Ayakkabı / beden bilgisi eksik";
    const s = secim(id);
    if (!s.tip || !s.altTip) return "Sözleşme tipi seçilmedi";
    return null;
  };
  const gecirilebilirler = isaretli.filter(
    (id) => gorunenler.some((a) => a.id === id) && !engel(id)
  );
  const tumuIsaretli = gorunenler.length > 0 && gorunenler.every((a) => isaretli.includes(a.id));

  const topluUygula = () => {
    if (!toplu.tip || !toplu.altTip) return;
    setSecimler((prev) => ({
      ...prev,
      ...Object.fromEntries(isaretli.map((id) => [id, toplu])),
    }));
  };

  const gecir = () => {
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    const idler = new Set(gecirilebilirler);
    setAdaylar((prev) =>
      prev.map((a) => {
        if (!idler.has(a.id)) return a;
        const s = secim(a.id);
        return egitmeneGecir(a, s.tip as IstihdamTipi, s.altTip, yapan);
      })
    );
    setIsaretli((prev) => prev.filter((id) => !idler.has(id)));
    setMesaj(
      `${idler.size} kişi eğitmen statüsüne geçirildi; Flyby'da Eğitmen Self-Employee sözleşmeleri tanımlandı, kulüp bilgileri Flyby ve CMS'e aktarıldı.`
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Eğitmenliğe Geçiş</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Akademi sınavını geçen adayları seçin, sözleşme tipini belirleyin ve tek seferde eğitmen
          statüsüne geçirin. Eğitmen, aday olarak eklendiği kulüpte göreve başlar.
        </p>
      </div>

      {mesaj && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {mesaj}
          </span>
          <button
            onClick={() => setMesaj(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <select
            value={akademiFiltresi}
            onChange={(e) => setAkademiFiltresi(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Tüm akademiler</option>
            {akademiler.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ad}
              </option>
            ))}
          </select>
          <span className="text-sm text-zinc-500">
            <strong className="text-zinc-900">{gorunenler.length}</strong> kişi eğitmenliğe geçişe
            hazır
          </span>
          {isaretli.length > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
              <span className="text-xs font-medium text-zinc-500">
                Seçili {isaretli.length} kişiye uygula:
              </span>
              <SozlesmeTipiSecimi
                kucuk
                tip={toplu.tip}
                altTip={toplu.altTip}
                onChange={(tip, altTip) => setToplu({ tip, altTip })}
              />
              <button
                onClick={topluUygula}
                disabled={!toplu.tip || !toplu.altTip}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-40"
              >
                Uygula
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Tümünü seç"
                    checked={tumuIsaretli}
                    onChange={(e) =>
                      setIsaretli(e.target.checked ? gorunenler.map((a) => a.id) : [])
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </th>
                <th className="px-4 py-2.5">Ad Soyad</th>
                <th className="px-4 py-2.5">Kulüp</th>
                <th className="px-4 py-2.5">Akademi</th>
                <th className="px-4 py-2.5">Sınav</th>
                <th className="px-4 py-2.5">Sözleşme Tipi / Alt Sözleşme Tipi</th>
                <th className="px-4 py-2.5">Durum</th>
              </tr>
            </thead>
            <tbody>
              {gorunenler.map((a) => {
                const s = secim(a.id);
                const sorun = engel(a.id);
                const sonuc = sinavSonucu(a.id, a.akademiDonemiId);
                return (
                  <tr key={a.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`${a.ad} ${a.soyad} seç`}
                        checked={isaretli.includes(a.id)}
                        disabled={sonuc === "Kaldı"}
                        onChange={(e) =>
                          setIsaretli((prev) =>
                            e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)
                          )
                        }
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">
                        {a.ad} {a.soyad}
                      </div>
                      <div className="font-mono text-xs text-zinc-400">{a.themisId}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{a.kulup}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {donemler.find((d) => d.id === a.akademiDonemiId)?.ad ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {sonuc ? (
                        <Badge label={sonuc} tone={sonuc === "Geçti" ? "green" : "red"} />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SozlesmeTipiSecimi
                        kucuk
                        tip={s.tip}
                        altTip={s.altTip}
                        onChange={(tip, altTip) =>
                          setSecimler((prev) => ({ ...prev, [a.id]: { tip, altTip } }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      {sorun ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {sorun}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600">Hazır</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {gorunenler.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Eğitmenliğe geçişe hazır aday yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm text-zinc-500">
          <strong className="text-zinc-900">{gecirilebilirler.length}</strong> kişi geçişe hazır
          {isaretli.length > gecirilebilirler.length && (
            <span className="ml-2 text-amber-700">
              · {isaretli.length - gecirilebilirler.length} seçili kişide eksik var
            </span>
          )}
        </span>
        <button
          onClick={gecir}
          disabled={gecirilebilirler.length === 0}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Seçilenleri Eğitmenliğe Geçir
        </button>
      </div>
    </div>
  );
}
