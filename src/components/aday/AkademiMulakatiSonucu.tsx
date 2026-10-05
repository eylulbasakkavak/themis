"use client";

import { useState, type ReactNode } from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import { Badge } from "@/components/Badge";
import { MulakatSonucuModal } from "@/components/aday/MulakatSonucuModal";
import { inputTarihindenCevir } from "@/lib/akademi";
import { ikinciBelgeSetiOnaylanmisMi } from "@/lib/belgeKurallari";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { degerlendirmeyiUygula, MULAKAT_KRITERLERI, toplamPuan } from "@/lib/mulakatDegerlendirme";
import { gorusmeSonucuBilgi } from "@/lib/status";
import type { AdayEgitmen } from "@/lib/types";

function Alan({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-0.5 break-words text-sm font-medium text-zinc-800">{children}</div>
    </div>
  );
}

/** Akademi mülakatının 6 kriterli değerlendirmesi ve sonucu (Akademi sekmesinde gösterilir). */
export function AkademiMulakatiSonucu({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const [acik, setAcik] = useState(false);
  const ikYetkisi = ikYetkisiVarMi(currentUser.rol);
  const d = aday.mulakatDegerlendirmesi;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">Akademi Mülakatı Sonucu</h3>
        {aday.gorusmeSonucu && (
          <Badge label={aday.gorusmeSonucu} tone={gorusmeSonucuBilgi[aday.gorusmeSonucu].tone} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Alan label="Mülakat Tarihi">
          {aday.mulakatPlanlananTarihi
            ? `${inputTarihindenCevir(aday.mulakatPlanlananTarihi)} ${aday.mulakatPlanlananSaat ?? ""}`
            : "—"}
        </Alan>
        <Alan label="Sonuç Tarihi">{aday.gorusmeSonucuTarihi || "—"}</Alan>
        {d?.giren && <Alan label="Sonucu Giren">{d.giren}</Alan>}
        {d && !d.katilmadi && <Alan label="Toplam Puan">{toplamPuan(d)}/6</Alan>}
        {d?.kisaAkademiUygun !== undefined && (
          <Alan label="Kısa Akademi Uygunluğu">{d.kisaAkademiUygun ? "Uygun" : "Uygun değil"}</Alan>
        )}
        {d?.altiAySonraBasvurabilir !== undefined && (
          <Alan label="6 Ay Sonra Tekrar Başvurabilir">
            {d.altiAySonraBasvurabilir ? "Evet" : "Hayır"}
          </Alan>
        )}
        {(d?.aciklama || aday.olumsuzOlmaNedeni) && (
          <Alan label="Açıklama">{d?.aciklama ?? aday.olumsuzOlmaNedeni}</Alan>
        )}
      </div>

      {d && !d.katilmadi && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MULAKAT_KRITERLERI.map((k) => {
            const p = d.kriterler[k.anahtar];
            return (
              <div
                key={k.anahtar}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2"
              >
                <span className="truncate text-sm text-zinc-700">{k.ad}</span>
                <span
                  className={`text-sm font-bold ${p === 1 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {p ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {ikYetkisi && d?.kisiselNot && (
        <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          <span className="text-xs font-semibold text-zinc-400">Kişisel notlar · </span>
          {d.kisiselNot}
        </div>
      )}

      {!aday.gorusmeSonucu && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-4 text-sm text-zinc-400">
          <Lock className="h-4 w-4 shrink-0" />
          {!ikinciBelgeSetiOnaylanmisMi(aday)
            ? "Önce ikinci belge setinin onaylanması gerekiyor."
            : !aday.mulakatPlanlananTarihi
              ? "Önce mülakat planlanmalı."
              : "Sonuç henüz girilmedi."}
        </div>
      )}

      {/* Girilmiş sonucun düzeltilmesi; ilk giriş Sonraki Aksiyon kartından yapılır. */}
      {ikYetkisi && onAdayGuncelle && aday.gorusmeSonucu && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setAcik(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Sonucu Düzenle
          </button>
        </div>
      )}

      {acik && onAdayGuncelle && (
        <MulakatSonucuModal
          aday={aday}
          kisiselNotGorunur={ikYetkisi}
          onClose={() => setAcik(false)}
          onKaydet={(yeni) => {
            onAdayGuncelle(
              degerlendirmeyiUygula(aday, yeni, `${currentUser.ad} (${currentUser.rol})`)
            );
            setAcik(false);
          }}
        />
      )}
    </div>
  );
}
