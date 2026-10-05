"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { bugun, inputTarihindenCevir, tarihYaz } from "@/lib/akademi";
import { KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen } from "@/lib/types";

export function MulakatPlanlaModal({
  aday,
  onClose,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onClose: () => void;
  onAdayGuncelle: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [tarih, setTarih] = useState("");
  const [saat, setSaat] = useState("");

  const zorunlularTamam = !!tarih && !!saat;

  const planla = () => {
    if (!zorunlularTamam) return;
    const planlayan = `${currentUser.ad} (${currentUser.rol})`;
    const planlamaTarihi = tarihYaz(bugun());
    const mulakatTarihi = `${inputTarihindenCevir(tarih)} ${saat}`;
    // Mülakata katılmayan aday yeniden planlanınca sonuç beklemeye geri döner.
    const yenidenPlanlama = aday.surecDurumu === "mulakata_katilmadi";
    onAdayGuncelle({
      ...aday,
      ...(yenidenPlanlama
        ? {
            surecDurumu: "mulakat_sonucu_bekleniyor" as const,
            gorusmeSonucu: undefined,
            gorusmeSonucuTarihi: undefined,
            mulakatDegerlendirmesi: undefined,
          }
        : {}),
      mulakatPlanlananTarihi: tarih,
      mulakatPlanlananSaat: saat,
      mulakatPlanlayanKisi: planlayan,
      mulakatPlanlamaTarihi: planlamaTarihi,
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih: planlamaTarihi,
          aksiyon: `Akademi mülakatı ${mulakatTarihi} tarihine planlandı`,
          yapan: planlayan,
        },
      ],
    });
    bildirimEkle({
      aliciRol: aday.mulakatiYapanRol,
      aliciAd: KULLANICILAR[aday.mulakatiYapanRol].ad,
      baslik: `${aday.ad} ${aday.soyad} için akademi mülakatı planlandı`,
      // PRD 5.1: mülakat tarihi, planlayan İK kullanıcısı, planlama tarihi ve bilgi metni.
      mesaj: `Mülakat tarihi: ${mulakatTarihi} · Planlayan: ${planlayan} · Planlama tarihi: ${planlamaTarihi}. Mülakata ilişkin detaylı bilgilendirme İK tarafından mail ile iletilecektir.`,
      planlayan,
      tarih: planlamaTarihi,
      adayId: aday.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Akademi Mülakatı Planla</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Gün<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Saat<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <input
              type="time"
              value={saat}
              onChange={(e) => setSaat(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={planla}
            disabled={!zorunlularTamam}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Planla
          </button>
        </div>
      </div>
    </div>
  );
}
