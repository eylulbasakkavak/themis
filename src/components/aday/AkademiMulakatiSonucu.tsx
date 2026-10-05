"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, ClipboardCheck, Lock, X } from "lucide-react";
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
  const [detay, setDetay] = useState(false);
  const ikYetkisi = ikYetkisiVarMi(currentUser.rol);
  const d = aday.mulakatDegerlendirmesi;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">Akademi Mülakatı Sonucu</h3>

      {/* Sayfada özet; kriterler ve ayrıntılar satıra tıklayınca detayda açılır. */}
      {aday.gorusmeSonucu && (
        <button
          onClick={() => setDetay(true)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50"
        >
          <span>
            <span className="block text-sm font-semibold text-zinc-900">Akademi Mülakatı</span>
            <span className="mt-0.5 block text-xs text-zinc-400">
              Mülakat{" "}
              {aday.mulakatPlanlananTarihi
                ? inputTarihindenCevir(aday.mulakatPlanlananTarihi)
                : "—"}{" "}
              · Sonuç {aday.gorusmeSonucuTarihi ?? "—"}
              {d?.giren && ` · ${d.giren}`}
            </span>
            {(d?.aciklama || aday.olumsuzOlmaNedeni) && (
              <span className="mt-1 block max-w-xl truncate text-xs text-zinc-600">
                {d?.aciklama ?? aday.olumsuzOlmaNedeni}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {d?.altiAySonraBasvurabilir && <Badge label="6 ay sonra başvurabilir" tone="pink" />}
            {d?.kisaAkademiUygun !== undefined && (
              <Badge
                label={d.kisaAkademiUygun ? "Kısa akademiye uygun" : "Kısa akademiye uygun değil"}
                tone={d.kisaAkademiUygun ? "blue" : "gray"}
              />
            )}
            {d && !d.katilmadi && (
              <span className="text-sm font-semibold text-zinc-700">{toplamPuan(d)}/6</span>
            )}
            <Badge label={aday.gorusmeSonucu} tone={gorusmeSonucuBilgi[aday.gorusmeSonucu].tone} />
            <ChevronRight className="h-4 w-4 text-zinc-300" />
          </span>
        </button>
      )}

      {detay && aday.gorusmeSonucu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetay(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-zinc-900">Akademi Mülakatı Sonucu</h2>
                <Badge
                  label={aday.gorusmeSonucu}
                  tone={gorusmeSonucuBilgi[aday.gorusmeSonucu].tone}
                />
              </div>
              <button
                onClick={() => setDetay(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Alan label="Mülakat Tarihi">
                  {aday.mulakatPlanlananTarihi
                    ? `${inputTarihindenCevir(aday.mulakatPlanlananTarihi)} ${aday.mulakatPlanlananSaat ?? ""}`
                    : "—"}
                </Alan>
                <Alan label="Sonuç Tarihi">{aday.gorusmeSonucuTarihi || "—"}</Alan>
                {/* Sonuç girilirken doldurulan tüm alanlar, boş olsa da gösterilir (PRD 5.5). */}
                <Alan label="Sonucu Giren">{d?.giren ?? "—"}</Alan>
                <Alan label="Toplam Puan">{d && !d.katilmadi ? `${toplamPuan(d)}/6` : "—"}</Alan>
                <Alan label="Mülakata Katılım">{d?.katilmadi ? "Katılmadı" : "Katıldı"}</Alan>
                <Alan label="Kısa Akademi Uygunluğu">
                  {d?.kisaAkademiUygun === undefined
                    ? "—"
                    : d.kisaAkademiUygun
                      ? "Uygun"
                      : "Uygun değil"}
                </Alan>
                <Alan label="6 Ay Sonra Tekrar Başvurabilir">
                  {d?.altiAySonraBasvurabilir ? "Evet" : "Hayır"}
                </Alan>
              </div>
              <div className="mt-4">
                <Alan label="Açıklama">{d?.aciklama ?? aday.olumsuzOlmaNedeni ?? "—"}</Alan>
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

              {ikYetkisi && (
                <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  <span className="text-xs font-semibold text-zinc-400">
                    Kişisel notlar (yalnızca İK ve akademi) ·{" "}
                  </span>
                  {d?.kisiselNot || "—"}
                </div>
              )}

              {/* Girilmiş sonucun düzeltilmesi; ilk giriş Sonraki Aksiyon kartından yapılır. */}
              {ikYetkisi && onAdayGuncelle && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => {
                      setDetay(false);
                      setAcik(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Sonucu Düzenle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!aday.gorusmeSonucu && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-4 text-sm text-zinc-400">
          <Lock className="h-4 w-4 shrink-0" />
          {!ikinciBelgeSetiOnaylanmisMi(aday)
            ? "Önce ikinci belge setinin onaylanması gerekiyor."
            : !aday.mulakatPlanlananTarihi
              ? "Önce mülakat planlanmalı."
              : "Sonuç henüz girilmedi."}
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
