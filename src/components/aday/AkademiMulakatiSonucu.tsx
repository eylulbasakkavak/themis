"use client";

import { useState } from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import { BilgiTablosu, puanRengi, SonucMetni } from "@/components/aday/BilgiTablosu";
import { MulakatSonucuModal } from "@/components/aday/MulakatSonucuModal";
import { inputTarihindenCevir } from "@/lib/akademi";
import { ikinciBelgeSetiOnaylanmisMi } from "@/lib/belgeKurallari";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { degerlendirmeyiUygula, MULAKAT_KRITERLERI, toplamPuan } from "@/lib/mulakatDegerlendirme";
import type { AdayEgitmen } from "@/lib/types";

/** Akademi mülakatının 6 kriterli değerlendirmesi ve sonucu; profilde doğrudan tablo olarak. */
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
  const sonuc = aday.gorusmeSonucu;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">Akademi Mülakatı Sonucu</h3>
        {/* Girilmiş sonucun düzeltilmesi; ilk giriş Sonraki Aksiyon kartından yapılır. */}
        {sonuc && ikYetkisi && onAdayGuncelle && (
          <button
            onClick={() => setAcik(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Sonucu Düzenle
          </button>
        )}
      </div>

      {sonuc ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Sonuç girilirken doldurulan tüm alanlar, boş olsa da gösterilir (PRD 5.5). */}
          <BilgiTablosu
            satirlar={[
              [
                "Sonuç",
                <SonucMetni
                  key="s"
                  label={sonuc}
                  olumlu={sonuc === "Olumlu" ? true : sonuc === "Olumsuz" ? false : null}
                />,
              ],
              ["Toplam Puan", d && !d.katilmadi ? `${toplamPuan(d)} / 6` : "—"],
              [
                "Mülakat Tarihi",
                aday.mulakatPlanlananTarihi
                  ? `${inputTarihindenCevir(aday.mulakatPlanlananTarihi)} ${aday.mulakatPlanlananSaat ?? ""}`
                  : "—",
              ],
              ["Sonuç Tarihi", aday.gorusmeSonucuTarihi || "—"],
              ["Sonucu Giren", d?.giren ?? "—"],
              ["Mülakata Katılım", d?.katilmadi ? "Katılmadı" : "Katıldı"],
              [
                "Kısa Akademi Uygunluğu",
                d?.kisaAkademiUygun === undefined
                  ? "—"
                  : d.kisaAkademiUygun
                    ? "Uygun"
                    : "Uygun değil",
              ],
              ["6 Ay Sonra Tekrar Başvurabilir", d?.altiAySonraBasvurabilir ? "Evet" : "Hayır"],
              ["Açıklama", d?.aciklama ?? aday.olumsuzOlmaNedeni ?? "—"],
              ...(ikYetkisi
                ? ([["Kişisel Notlar (İK ve akademi)", d?.kisiselNot || "—"]] as [string, string][])
                : []),
            ]}
          />

          {d && !d.katilmadi && (
            <table className="h-fit w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
                  <th className="px-3 py-1.5 font-medium">Kriter</th>
                  <th className="w-16 px-3 py-1.5 text-right font-medium">Puan</th>
                </tr>
              </thead>
              <tbody>
                {MULAKAT_KRITERLERI.map((k) => {
                  const p = d.kriterler[k.anahtar];
                  return (
                    <tr
                      key={k.anahtar}
                      className={`border-b-2 border-white ${puanRengi(p === undefined ? null : p === 1)}`}
                    >
                      <td className="px-3 py-1.5" title={k.kapsam}>
                        {k.ad}
                      </td>
                      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                        {p ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
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
