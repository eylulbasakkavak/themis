"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { bugun, inputTarihindenCevir, inputTarihine, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen } from "@/lib/types";

/**
 * İhtar kayıtları (PRD 11.4): tarih ve sebep girilir, kaydı giren otomatik yazılır. Genel onay
 * kuralı gereği KM/KMY'nin girdiği ihtar İK onayına (Onay Talepleri) düşer.
 */
export function IhtarKaydi({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [ihtarSebep, setIhtarSebep] = useState("");
  const [ihtarTarihi, setIhtarTarihi] = useState(inputTarihine(tarihYaz(bugun())));
  const ik = ikYetkisiVarMi(currentUser.rol);
  const kayitlar = aday.ihtarKayitlari ?? [];

  const ihtarEkle = () => {
    if (!ihtarSebep.trim() || !ihtarTarihi) return;
    const id = `ih${Date.now()}`;
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    onAdayGuncelle?.({
      ...aday,
      ihtarKayitlari: [
        ...kayitlar,
        {
          id,
          tarih: inputTarihindenCevir(ihtarTarihi),
          sebep: ihtarSebep.trim(),
          kaydeden: yapan,
          onaylandi: ik,
        },
      ],
    });
    if (!ik) {
      bildirimEkle({
        aliciRol: "İK",
        aliciAd: KULLANICILAR["İK"].ad,
        baslik: `${aday.ad} ${aday.soyad} için ihtar kaydı onay bekliyor`,
        mesaj: ihtarSebep.trim(),
        planlayan: yapan,
        tarih: tarihYaz(bugun()),
        adayId: aday.id,
        link: `/onay-bekleyenler?aday=${aday.id}&talep=${aday.id}-ihtar-${id}`,
      });
    }
    setIhtarSebep("");
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">İhtar Kaydı</h3>
      <div className="flex flex-col gap-2">
        {kayitlar.length === 0 && <p className="text-sm text-zinc-400">İhtar kaydı bulunmuyor.</p>}
        {kayitlar.map((k, i) => {
          const bekliyor = k.onaylandi === false && !k.redSebebi;
          return (
            <div
              key={k.id ?? i}
              className="rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium text-zinc-800">
                  {k.tarih}
                  {bekliyor && <Badge label="İK onayı bekliyor" tone="orange" />}
                  {k.redSebebi && (
                    <span title={k.redSebebi}>
                      <Badge label="Reddedildi" tone="gray" />
                    </span>
                  )}
                  {bekliyor && ik && (
                    <Link
                      href={`/onay-bekleyenler?aday=${aday.id}&talep=${aday.id}-ihtar-${k.id ?? i}`}
                      className="text-xs font-semibold text-amber-700 underline"
                    >
                      İncele
                    </Link>
                  )}
                </span>
                <span className="text-xs text-zinc-400">{k.kaydeden}</span>
              </div>
              <div className="mt-1.5">
                <div className="text-xs text-zinc-400">İhtar Sebebi</div>
                <div className="mt-1">
                  <Badge label={k.sebep} tone={k.redSebebi ? "gray" : "red"} />
                </div>
                {k.redSebebi && (
                  <div className="mt-1 text-xs text-zinc-500">Ret nedeni: {k.redSebebi}</div>
                )}
              </div>
            </div>
          );
        })}
        {onAdayGuncelle && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={ihtarTarihi}
              onChange={(e) => setIhtarTarihi(e.target.value)}
              aria-label="İhtar tarihi"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={ihtarSebep}
              onChange={(e) => setIhtarSebep(e.target.value)}
              placeholder="İhtar sebebi"
              className="min-w-48 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={ihtarEkle}
              disabled={!ihtarSebep.trim() || !ihtarTarihi}
              className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ik ? "İhtar Ekle" : "Onaya Gönder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
