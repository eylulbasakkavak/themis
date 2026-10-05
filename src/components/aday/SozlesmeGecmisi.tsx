import { Link2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { AdayEgitmen } from "@/lib/types";

export function SozlesmeGecmisi({ aday }: { aday: AdayEgitmen }) {
  const kayitlar = aday.sozlesmeGecmisi ?? [];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Sözleşme ve kulüp geçmişi</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Bu alan Flyby&apos;dan gerçek zamanlı beslenir ve Themis&apos;te değiştirilemez.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
          <Link2 className="h-3.5 w-3.5" />
          FLYBY
        </span>
      </div>

      {kayitlar.length === 0 ? (
        <div className="border-t border-zinc-100 px-5 py-14 text-center text-sm text-zinc-400">
          Bu eğitmen için sözleşme kaydı bulunmuyor.
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-zinc-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-2.5">Kulüp</th>
                <th className="px-4 py-2.5">Sözleşme Tipi</th>
                <th className="px-4 py-2.5">Başlangıç</th>
                <th className="px-4 py-2.5">Bitiş / Fesih Tarihi</th>
                <th className="px-4 py-2.5">Durum</th>
                <th className="px-4 py-2.5">Bitiş / Fesih Nedeni</th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((k, i) => (
                <tr key={i} className="border-b border-zinc-50 last:border-0">
                  <td className="px-4 py-3.5 font-medium text-zinc-900">{k.kulup}</td>
                  <td className="px-4 py-3.5 text-zinc-600">
                    {k.sozlesmeTipi}
                    {k.altSozlesmeTipi && (
                      <div className="text-xs text-zinc-400">{k.altSozlesmeTipi}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sky-700">{k.baslangicTarihi}</td>
                  <td className="px-4 py-3.5 text-sky-700">{k.bitisTarihi ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <Badge label={k.durum} tone={k.durum === "Devam Ediyor" ? "green" : "gray"} />
                  </td>
                  <td className="px-4 py-3.5 text-zinc-600">{k.bitisNedeni ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
