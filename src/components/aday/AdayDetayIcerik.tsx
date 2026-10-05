"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { AdayDetayTabs } from "@/components/aday/AdayDetayTabs";
import { AkademiEgitimineDavet } from "@/components/aday/AkademiEgitimineDavet";
import { AkademiSinavSonuclari } from "@/components/aday/AkademiSinavSonuclari";
import { AkademiMulakatiSonucu } from "@/components/aday/AkademiMulakatiSonucu";
import { BelgeYonetimi } from "@/components/aday/BelgeYonetimi";
import { GenelBilgi } from "@/components/aday/GenelBilgi";
import { IhtarKaydi } from "@/components/aday/IhtarKaydi";
import { SonrakiAksiyonKarti } from "@/components/aday/SonrakiAksiyonKarti";
import { EgitmenIslemleriPaneli } from "@/components/egitmen/EgitmenIslemleriPaneli";
import { SertifikaYonetimi } from "@/components/egitmen/SertifikaYonetimi";
import { SozlesmeGecmisi } from "@/components/aday/SozlesmeGecmisi";
import { surecDurumuGorunumu, uyelikTipi, uyelikTipiBilgi } from "@/lib/status";
import type { AdayEgitmen } from "@/lib/types";

export function AdayDetayIcerik({
  aday,
  onAdayGuncelle,
  baslangicTab,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
  baslangicTab?: string;
}) {
  const [sekme, setSekme] = useState<string>(baslangicTab ?? "genel");
  const durum = surecDurumuGorunumu(aday);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white">
              {aday.ad[0]}
              {aday.soyad[0]}
            </span>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">
                {aday.ad} {aday.soyad}
              </h1>
              <p className="text-sm text-zinc-500">
                <span className="font-mono">#{aday.themisId}</span> · {aday.kulup} ·{" "}
                {aday.mulakatiYapanRol} mülakatı
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              label={uyelikTipi(aday.surecDurumu)}
              tone={uyelikTipiBilgi[uyelikTipi(aday.surecDurumu)].tone}
            />
            {durum.label !== uyelikTipi(aday.surecDurumu) && (
              <span className="text-[11px] text-zinc-400">{durum.label}</span>
            )}
          </div>
        </div>
      </div>

      <AdayDetayTabs
        aktif={sekme}
        onDegistir={setSekme}
        tabs={[
          {
            id: "genel",
            label: "Genel Bilgi",
            content: (
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="order-2 lg:order-1">
                  <GenelBilgi aday={aday} onAdayGuncelle={onAdayGuncelle} />
                </div>
                <div className="order-1 flex flex-col gap-4 lg:sticky lg:top-0 lg:order-2">
                  <SonrakiAksiyonKarti
                    key={aday.id}
                    aday={aday}
                    onAdayGuncelle={onAdayGuncelle}
                    onSekmeAc={setSekme}
                  />
                  {aday.surecDurumu === "egitmen" && onAdayGuncelle && (
                    <EgitmenIslemleriPaneli aday={aday} onAdayGuncelle={onAdayGuncelle} />
                  )}
                </div>
              </div>
            ),
          },
          {
            id: "belgeler",
            label: "Belgeler",
            content: <BelgeYonetimi key={aday.id} aday={aday} onAdayGuncelle={onAdayGuncelle} />,
          },
          {
            id: "kademe-federasyon",
            label: "Sertifikalar",
            content: <SertifikaYonetimi aday={aday} onAdayGuncelle={onAdayGuncelle} />,
          },
          {
            id: "akademi-sinav",
            label: "Akademi & Sınav Sonuçları",
            content: (
              <div className="flex flex-col gap-4">
                <AkademiMulakatiSonucu aday={aday} onAdayGuncelle={onAdayGuncelle} />
                <AkademiEgitimineDavet aday={aday} onAdayGuncelle={onAdayGuncelle} />
                <AkademiSinavSonuclari aday={aday} />
              </div>
            ),
          },
          {
            id: "sozlesme",
            label: "Sözleşme Geçmişi",
            content: <SozlesmeGecmisi aday={aday} />,
          },
          {
            id: "ihtar",
            label: "İhtar Kaydı",
            content: <IhtarKaydi aday={aday} onAdayGuncelle={onAdayGuncelle} />,
          },
        ]}
      />
    </div>
  );
}
