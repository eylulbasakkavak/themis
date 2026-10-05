"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdayDetayIcerik } from "@/components/aday/AdayDetayIcerik";
import { useAdaylar } from "@/lib/AdaylarContext";

export default function AdayDetayPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const baslangicTab = searchParams.get("tab") ?? undefined;
  const donusOnayBekleyenlere = searchParams.get("donus") === "onay-bekleyenler";
  const talepId = searchParams.get("talep");
  const { adaylar, guncelleAday } = useAdaylar();
  const aday = adaylar.find((a) => a.id === id);

  return (
    <div className="flex flex-col gap-5">
      {donusOnayBekleyenlere ? (
        <Link
          href={`/onay-bekleyenler?aday=${id}${talepId ? `&talep=${talepId}` : ""}`}
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Onay Talepleri&apos;ne Dön
        </Link>
      ) : (
        <Link
          href="/adaylar"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Eğitmenler
        </Link>
      )}

      {aday ? (
        <AdayDetayIcerik aday={aday} onAdayGuncelle={guncelleAday} baslangicTab={baslangicTab} />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
          Aday bulunamadı.
        </div>
      )}
    </div>
  );
}
