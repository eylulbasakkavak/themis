"use client";

import { Download } from "lucide-react";
import { belgeIndir } from "@/lib/belgeIndir";
import type { AdayEgitmen } from "@/lib/types";

/** Yüklenmiş bir belgenin yanındaki indirme butonu (ikon; `etiket` verilirse yazılı). */
export function BelgeIndirButonu({
  belge,
  aday,
  ekSatirlar,
  etiket,
}: {
  belge: { ad: string; tarih?: string };
  aday: Pick<AdayEgitmen, "ad" | "soyad" | "themisId">;
  ekSatirlar?: string[];
  etiket?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => belgeIndir(belge, aday, ekSatirlar)}
      title="İndir"
      aria-label={`${belge.ad} indir`}
      className={
        etiket
          ? "flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          : "rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
      }
    >
      <Download className="h-3.5 w-3.5" />
      {etiket}
    </button>
  );
}
