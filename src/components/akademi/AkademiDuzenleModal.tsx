"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  akademiAdiOlustur,
  bitisTarihiHesapla,
  inputTarihindenCevir,
  inputTarihine,
} from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import type { AkademiDonemi, AkademiTipi } from "@/lib/types";

const AKADEMI_TIPLERI: AkademiTipi[] = [
  "Standart Akademi Mülakatı (4 Hafta)",
  "Kısa Dönem Akademi Mülakatı (1 Hafta)",
];

/** Henüz aday kaydedilmemiş akademinin tarih, tip ve kontenjanını düzenler (PRD 7.1). */
export function AkademiDuzenleModal({
  akademi,
  onClose,
}: {
  akademi: AkademiDonemi;
  onClose: () => void;
}) {
  const { donemGuncelle } = useAkademiDonemleri();
  const [tip, setTip] = useState<AkademiTipi>(akademi.tip);
  const [baslangicTarihi, setBaslangicTarihi] = useState(inputTarihine(akademi.baslangicTarihi));
  const [kontenjan, setKontenjan] = useState(String(akademi.kontenjan));

  const donemNo = Number(akademi.ad.match(/Dönem (\d+)$/)?.[1] ?? 0);
  const baslangic = baslangicTarihi ? inputTarihindenCevir(baslangicTarihi) : "";
  const bitisTarihi = baslangic ? bitisTarihiHesapla(baslangic, tip) : "";
  const gecerli = !!baslangic && Number(kontenjan) > 0;

  const kaydet = () => {
    if (!gecerli) return;
    donemGuncelle({
      ...akademi,
      ad: donemNo ? akademiAdiOlustur(tip, donemNo) : akademi.ad,
      tip,
      baslangicTarihi: baslangic,
      bitisTarihi,
      kontenjan: Number(kontenjan),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Akademiyi Düzenle</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">Akademi Tipi</label>
            <div className="flex gap-2">
              {AKADEMI_TIPLERI.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTip(t)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    tip === t
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {t.startsWith("Standart") ? "Standart (4 Hafta)" : "Kısa Dönem (1 Hafta)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={baslangicTarihi}
                onChange={(e) => setBaslangicTarihi(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">Bitiş Tarihi</label>
              <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {bitisTarihi || "—"}
              </p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">Kontenjan</label>
            <input
              type="number"
              min={1}
              value={kontenjan}
              onChange={(e) => setKontenjan(e.target.value)}
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
            onClick={kaydet}
            disabled={!gecerli}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
