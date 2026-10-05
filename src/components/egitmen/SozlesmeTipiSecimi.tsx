"use client";

import { ALT_SOZLESME_TIPLERI, ISTIHDAM_TIPLERI } from "@/lib/egitmenSecenekleri";
import type { IstihdamTipi } from "@/lib/types";

/** Sözleşme tipi ve alt sözleşme tipi seçimi (PRD 10.2); iki liste birbirinden bağımsızdır. */
export function SozlesmeTipiSecimi({
  tip,
  altTip,
  onChange,
  kucuk = false,
}: {
  tip: IstihdamTipi | "";
  altTip: string;
  onChange: (tip: IstihdamTipi | "", altTip: string) => void;
  kucuk?: boolean;
}) {
  const sinif = `rounded-lg border border-zinc-200 bg-white outline-none focus:border-brand ${
    kucuk ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-sm"
  }`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={tip}
        onChange={(e) => onChange(e.target.value as IstihdamTipi | "", altTip)}
        className={sinif}
      >
        <option value="">Sözleşme tipi</option>
        {ISTIHDAM_TIPLERI.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select value={altTip} onChange={(e) => onChange(tip, e.target.value)} className={sinif}>
        <option value="">Alt sözleşme tipi</option>
        {ALT_SOZLESME_TIPLERI.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
