"use client";

import { useState } from "react";
import { AlertTriangle, Pencil, X } from "lucide-react";
import { bugun, tarihYaz } from "@/lib/akademi";
import {
  GECME_PUANI,
  gxDersleri,
  gxYetkinlikleri,
  type GxYetkinlik,
} from "@/lib/akademiSinav";
import { VARSAYILAN_SINAV_BASLIKLARI } from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen, GxKarari } from "@/lib/types";

const KARAR_ADI = { verebilir: "Verebilir", veremez: "Veremez" } as const;

function KararMetni({ karar }: { karar: GxYetkinlik["karar"] }) {
  if (!karar) return <span className="text-zinc-300">—</span>;
  return (
    <span
      className={`font-semibold ${karar === "verebilir" ? "text-emerald-700" : "text-rose-600"}`}
    >
      {KARAR_ADI[karar]}
    </span>
  );
}

/**
 * Profil → GX Yetkinliği. Sistem önerisi akademi sınavındaki son puandan gelir (70+ verebilir);
 * İK / Sistem Yöneticisi akademi kararı olarak değiştirebilir (neden zorunlu). Herkes görür.
 */
export function GxYetkinligi({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const yetkili = ikYetkisiVarMi(currentUser.rol) && !!onAdayGuncelle;
  const [duzenlenen, setDuzenlenen] = useState<GxYetkinlik | null>(null);
  const satirlar = gxYetkinlikleri(
    aday,
    sinavSonuclari,
    gxDersleri(VARSAYILAN_SINAV_BASLIKLARI),
  );
  const verebildigi = satirlar
    .filter((s) => s.karar === "verebilir")
    .map((s) => s.ders);

  const kaydet = (ders: string, karar: GxKarari["karar"], neden: string) => {
    if (!onAdayGuncelle) return;
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    const tarih = tarihYaz(bugun());
    onAdayGuncelle({
      ...aday,
      gxKararlari: [
        ...(aday.gxKararlari ?? []),
        { ders, karar, neden, yapan, tarih },
      ],
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih,
          aksiyon: `GX yetkinliği: ${ders} → ${KARAR_ADI[karar]}`,
          yapan,
          detay: neden,
        },
      ],
    });
    setDuzenlenen(null);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900">GX Yetkinliği</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Sistem önerisi akademi sınavındaki son puandan gelir ({GECME_PUANI}+
          verebilir). Akademi kararı kademeden bağımsızdır ve öneriden farklı
          olabilir.
        </p>
      </div>

      <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm">
        <span className="text-zinc-500">Verebildiği dersler: </span>
        <span className="font-semibold text-zinc-900">
          {verebildigi.length ? verebildigi.join(", ") : "—"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500">
              <th className="py-2 pr-4 font-medium">Ders</th>
              <th className="px-3 py-2 font-medium">Akademi puanı</th>
              <th className="px-3 py-2 font-medium">Sistem önerisi</th>
              <th className="px-3 py-2 font-medium">Akademi kararı</th>
              <th className="px-3 py-2 font-medium">Neden / değiştiren</th>
              <th className="py-2 pl-3" />
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr
                key={s.ders}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="py-2.5 pr-4 font-medium text-zinc-800">
                  {s.ders}
                </td>
                <td className="px-3 py-2.5 text-zinc-600">
                  {s.puan === null ? (
                    <span className="text-zinc-300">—</span>
                  ) : (
                    <>
                      <span
                        className={`font-semibold tabular-nums ${s.puan >= GECME_PUANI ? "text-emerald-700" : "text-rose-600"}`}
                      >
                        {s.puan}
                      </span>
                      <span className="ml-1.5 text-xs text-zinc-400">
                        ({s.sinavNo}. sınav)
                      </span>
                    </>
                  )}
                </td>
                <td className="px-3 py-2.5 text-zinc-500">
                  {s.oneri ? KARAR_ADI[s.oneri] : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <KararMetni karar={s.karar} />
                </td>
                <td className="px-3 py-2.5 text-xs text-zinc-500">
                  {s.sonKarar ? (
                    <span
                      title={s.gecmis
                        .map(
                          (k) =>
                            `${k.tarih} · ${k.yapan}: ${KARAR_ADI[k.karar]} — ${k.neden}`,
                        )
                        .join("\n")}
                    >
                      <span className="text-zinc-700">{s.sonKarar.neden}</span>
                      <span className="block text-zinc-400">
                        {s.sonKarar.yapan} · {s.sonKarar.tarih}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  {yetkili && (
                    <button
                      onClick={() => setDuzenlenen(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      <Pencil className="h-3 w-3" />
                      Düzenle
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {duzenlenen && (
        <KararFormu
          satir={duzenlenen}
          onClose={() => setDuzenlenen(null)}
          onKaydet={(karar, neden) => kaydet(duzenlenen.ders, karar, neden)}
        />
      )}
    </div>
  );
}

function KararFormu({
  satir,
  onClose,
  onKaydet,
}: {
  satir: GxYetkinlik;
  onClose: () => void;
  onKaydet: (karar: GxKarari["karar"], neden: string) => void;
}) {
  const [karar, setKarar] = useState<GxKarari["karar"]>(
    satir.karar === "verebilir" ? "veremez" : "verebilir",
  );
  const [neden, setNeden] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {satir.ders} · GX yetkinliği
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Akademi puanı ve sistem önerisi: karar verilirken göz önünde olsun diye uyarı gibi. */}
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="text-sm font-semibold">
                Akademi puanı: {satir.puan ?? "—"}
                {satir.sinavNo ? ` (${satir.sinavNo}. sınav)` : ""}
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                Sistem önerisi: {satir.oneri ? KARAR_ADI[satir.oneri] : "—"}
              </div>
              <div className="mt-1 text-xs text-rose-600/80">
                Öneriden farklı bir karar verirseniz nedeni kaydedilir.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {(["verebilir", "veremez"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKarar(k)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  karar === k
                    ? k === "verebilir"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-rose-600 bg-rose-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {k === "verebilir" ? "Ders verebilir" : "Ders veremez"}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-600">
              Neden<span className="ml-0.5 text-rose-500">*</span>
            </span>
            <textarea
              rows={3}
              value={neden}
              onChange={(e) => setNeden(e.target.value)}
              placeholder="Kararın nedeni (ör. uygulamada gözlemlenen performans)"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onKaydet(karar, neden.trim())}
            disabled={!neden.trim() || karar === satir.karar}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
