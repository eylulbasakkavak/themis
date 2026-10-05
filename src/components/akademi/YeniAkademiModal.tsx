"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  akademiAdiOlustur,
  bitisTarihiHesapla,
  inputTarihindenCevir,
  sonrakiDonemNo,
} from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import type { AkademiDonemi, AkademiTipi } from "@/lib/types";

const AKADEMI_TIPLERI: AkademiTipi[] = [
  "Standart Akademi Mülakatı (4 Hafta)",
  "Kısa Dönem Akademi Mülakatı (1 Hafta)",
];

export function YeniAkademiModal({ onClose }: { onClose: () => void }) {
  const { donemler, donemEkle } = useAkademiDonemleri();
  const [donemNo, setDonemNo] = useState("");
  const [tip, setTip] = useState<AkademiTipi | "">("");
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [kontenjan, setKontenjan] = useState("");

  const ad = tip && Number(donemNo) > 0 ? akademiAdiOlustur(tip, Number(donemNo)) : "";
  const adCakisiyor = !!ad && donemler.some((d) => d.ad === ad);

  // Bitiş tarihi başlangıç ve tipe göre otomatik hesaplanır (PRD 7.1).
  const baslangic = baslangicTarihi ? inputTarihindenCevir(baslangicTarihi) : "";
  const bitisTarihi = tip && baslangic ? bitisTarihiHesapla(baslangic, tip) : "";

  const zorunlularTamam =
    !!ad &&
    !adCakisiyor &&
    !!tip &&
    !!baslangicTarihi &&
    !!bitisTarihi &&
    !!kontenjan &&
    Number(kontenjan) > 0;

  const kaydet = () => {
    if (!zorunlularTamam || !tip) return;
    const yeni: Omit<AkademiDonemi, "id" | "kayitlilar"> = {
      ad,
      tip,
      baslangicTarihi: baslangic,
      bitisTarihi,
      kontenjan: Number(kontenjan),
    };
    donemEkle(yeni);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Yeni Akademi Dönemi</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Akademi Tipi<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {AKADEMI_TIPLERI.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTip(t);
                    setDonemNo(String(sonrakiDonemNo(donemler, t)));
                  }}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Dönem No<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={donemNo}
              onChange={(e) => setDonemNo(e.target.value)}
              disabled={!tip}
              placeholder={tip ? undefined : "Önce akademi tipini seçin"}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-zinc-50"
            />
            {ad && (
              <p className={`mt-1 text-xs ${adCakisiyor ? "text-rose-500" : "text-zinc-500"}`}>
                {adCakisiyor ? `"${ad}" zaten tanımlı.` : `Akademi adı: ${ad}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">
                Başlangıç Tarihi<span className="ml-0.5 text-rose-500">*</span>
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
                {bitisTarihi || <span className="text-zinc-400">Otomatik hesaplanır</span>}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600">
              Kontenjan<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={kontenjan}
              onChange={(e) => setKontenjan(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          <p className="text-xs text-zinc-400">
            Şu anda {donemler.length} akademi dönemi tanımlı. Yeni dönem, KM/KMY&apos;nin Akademi
            Eğitimine Davet formundaki &quot;Hangi akademiye dahil edilecek?&quot; seçeneklerinde
            hemen görünür.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={kaydet}
            disabled={!zorunlularTamam}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
