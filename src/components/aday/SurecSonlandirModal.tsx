"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { bugun, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { SUREC_SONLANDIRMA_NEDENLERI } from "@/lib/egitmenSecenekleri";
import type { AdayEgitmen } from "@/lib/types";

/**
 * Akademiyi tamamlayamayan (sınavdan başarısız, yarıda bırakan) ya da akademiye katılmayan
 * adayın sürecini sonlandırır (PRD 10.1, 8.2): Akademi Eğitmeni sözleşmesi kapatılır, aday
 * akademi öncesindeki üyelik tipine döner ve adayı ekleyen KM/KMY'ye bildirim gider.
 */
export function SurecSonlandirModal({
  aday,
  varsayilanNeden,
  onClose,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  varsayilanNeden?: (typeof SUREC_SONLANDIRMA_NEDENLERI)[number];
  onClose: () => void;
  onAdayGuncelle: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [neden, setNeden] = useState<string>(varsayilanNeden ?? "");
  const [aciklama, setAciklama] = useState("");

  const sonlandir = () => {
    if (!neden) return;
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    const tarih = tarihYaz(bugun());
    const sozlesmeVar =
      aday.surecDurumu === "akademi_egitmeni" || aday.surecDurumu === "akademiyi_tamamladi";
    onAdayGuncelle({
      ...aday,
      surecDurumu: "surec_sonlandirildi",
      surecSonlandirma: { neden, aciklama: aciklama.trim() || undefined, tarih, yapan },
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih,
          aksiyon: sozlesmeVar
            ? `Süreç sonlandırıldı (${neden}); Akademi Eğitmeni sözleşmesi kapatıldı, aday önceki üyelik tipine döndü`
            : `Süreç sonlandırıldı (${neden})`,
          yapan,
          detay: aciklama.trim() || undefined,
        },
      ],
    });
    bildirimEkle({
      aliciRol: aday.mulakatiYapanRol,
      aliciAd: KULLANICILAR[aday.mulakatiYapanRol].ad,
      baslik: `${aday.ad} ${aday.soyad} adayının süreci sonlandırıldı`,
      mesaj: `Neden: ${neden}.${aciklama.trim() ? ` ${aciklama.trim()}` : ""}`,
      planlayan: yapan,
      tarih,
      adayId: aday.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Süreci Sonlandır</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <p className="text-sm text-zinc-600">
            {aday.ad} {aday.soyad} adayının süreci sonlandırılacak. Akademi Eğitmeni sözleşmesi
            kapatılır ve aday önceki üyelik tipine (fiziksel / dijital) döner. Adayı ekleyen kulüp
            müdürüne bildirim gider.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Neden<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <select
              value={neden}
              onChange={(e) => setNeden(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Seçiniz</option>
              {SUREC_SONLANDIRMA_NEDENLERI.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">Açıklama</label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={2}
              placeholder="İsteğe bağlı"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={sonlandir}
            disabled={!neden}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Süreci Sonlandır
          </button>
        </div>
      </div>
    </div>
  );
}
