"use client";

import { useState } from "react";
import { Check, ClipboardCheck, X } from "lucide-react";
import {
  akademiMulakatiniYapan,
  bosDegerlendirme,
  eksikler,
  kisaAkademiyeYonlendirildiMi,
  MULAKAT_KRITERLERI,
  OLUMLU_ESIGI,
  sonucHesapla,
  toplamPuan,
  type MulakatDegerlendirmesi,
} from "@/lib/mulakatDegerlendirme";
import { kulupMarkasi } from "@/lib/kulupler";
import type { AdayEgitmen } from "@/lib/types";

const SONUC_RENK = {
  Olumlu: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Olumsuz: "bg-rose-50 text-rose-700 ring-rose-200",
  Katılmadı: "bg-amber-50 text-amber-700 ring-amber-200",
} as const;

function SecimButonu({
  secili,
  onClick,
  children,
}: {
  secili: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
        secili
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

/** Kriter için ✓ (karşılıyor = 1) / ✗ (karşılamıyor = 0) ikon butonu. */
function KriterButonu({
  deger,
  secili,
  onClick,
}: {
  deger: 0 | 1;
  secili: boolean;
  onClick: () => void;
}) {
  const Ikon = deger === 1 ? Check : X;
  const seciliRenk =
    deger === 1
      ? "border-emerald-600 bg-emerald-600 text-white"
      : "border-rose-600 bg-rose-600 text-white";
  const bosRenk =
    deger === 1
      ? "border-zinc-200 text-zinc-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
      : "border-zinc-200 text-zinc-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={deger === 1 ? "Karşılıyor" : "Karşılamıyor"}
      aria-pressed={secili}
      title={deger === 1 ? "Karşılıyor (1)" : "Karşılamıyor (0)"}
      className={`flex h-9 w-12 items-center justify-center rounded-lg border transition-colors ${
        secili ? seciliRenk : bosRenk
      }`}
    >
      <Ikon className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}

/** Tek bir adayın akademi mülakatı değerlendirmesi (PRD 5.6 — tekli giriş). */
export function MulakatSonucuModal({
  aday,
  kisiselNotGorunur,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  kisiselNotGorunur: boolean;
  onClose: () => void;
  onKaydet: (d: MulakatDegerlendirmesi) => void;
}) {
  const [d, setD] = useState<MulakatDegerlendirmesi>(
    aday.mulakatDegerlendirmesi ?? bosDegerlendirme()
  );
  const sonuc = sonucHesapla(d);
  const eksikListesi = eksikler(d, aday);
  const kisaAkademi = kisaAkademiyeYonlendirildiMi(aday.akademiMulakatTipi);
  const tarih = aday.mulakatPlanlananTarihi;
  const bilgiler: [string, string][] = [
    ["Yıl", tarih?.slice(0, 4) ?? "—"],
    ["Mülakatı Yapan", akademiMulakatiniYapan(aday)],
    [
      "Tarih",
      tarih
        ? `${tarih.split("-").reverse().join(".")}${aday.mulakatPlanlananSaat ? ` ${aday.mulakatPlanlananSaat}` : ""}`
        : "—",
    ],
    ["Ad-Soyad", `${aday.ad} ${aday.soyad}`],
    ["Cinsiyet", aday.cinsiyet ?? "—"],
    ["MAC One/MACFit", kulupMarkasi(aday.kulup)],
    ["Kulüp", aday.kulup],
    ["Mülakat Tipi", kisaAkademi ? "Kısa Dönem" : "Standart"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-zinc-400" />
            <div>
              <h3 className="text-base font-semibold text-zinc-900">
                Akademi Mülakatı Değerlendirmesi
              </h3>
              <p className="text-xs text-zinc-400">
                {aday.ad} {aday.soyad} · {aday.akademiMulakatTipi ?? "Akademi tipi seçilmedi"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-4 gap-x-4 gap-y-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            {bilgiler.map(([etiket, deger]) => (
              <div key={etiket} className="min-w-0">
                <dt className="text-xs font-medium text-zinc-400">{etiket}</dt>
                <dd className="truncate font-medium text-zinc-800">{deger}</dd>
              </div>
            ))}
          </dl>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={d.katilmadi}
              onChange={(e) =>
                setD({
                  ...d,
                  katilmadi: e.target.checked,
                  kriterler: e.target.checked ? {} : d.kriterler,
                })
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
            Aday mülakata katılmadı
          </label>

          {!d.katilmadi && (
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              {MULAKAT_KRITERLERI.map((k) => (
                <div key={k.anahtar} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-800">{k.ad}</div>
                    <div className="text-xs text-zinc-400">{k.kapsam}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <KriterButonu
                      deger={1}
                      secili={d.kriterler[k.anahtar] === 1}
                      onClick={() => setD({ ...d, kriterler: { ...d.kriterler, [k.anahtar]: 1 } })}
                    />
                    <KriterButonu
                      deger={0}
                      secili={d.kriterler[k.anahtar] === 0}
                      onClick={() => setD({ ...d, kriterler: { ...d.kriterler, [k.anahtar]: 0 } })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
            <div className="text-sm text-zinc-600">
              {d.katilmadi ? (
                "Puanlama yapılmaz."
              ) : (
                <>
                  Toplam puan: <span className="font-bold text-zinc-900">{toplamPuan(d)}/6</span>
                  <span className="ml-2 text-xs text-zinc-400">
                    (en az {OLUMLU_ESIGI} kriter = Olumlu)
                  </span>
                </>
              )}
            </div>
            {sonuc ? (
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${SONUC_RENK[sonuc]}`}
              >
                {sonuc.toLocaleUpperCase("tr-TR")}
              </span>
            ) : (
              <span className="text-sm text-zinc-400">Sonuç: tüm kriterler işaretlenince</span>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Kısa akademi uygunluğu
              {kisaAkademi && !d.katilmadi && <span className="ml-0.5 text-rose-500">*</span>}
            </label>
            <div className="flex gap-2">
              <SecimButonu
                secili={d.kisaAkademiUygun === true}
                onClick={() => setD({ ...d, kisaAkademiUygun: true })}
              >
                Kısa akademiye uygun
              </SecimButonu>
              <SecimButonu
                secili={d.kisaAkademiUygun === false}
                onClick={() => setD({ ...d, kisaAkademiUygun: false })}
              >
                Uygun değil
              </SecimButonu>
            </div>
            {kisaAkademi && sonuc === "Olumlu" && d.kisaAkademiUygun === false && (
              <p className="mt-1 text-xs text-amber-700">
                Sonuç olumlu olduğu için aday standart akademiye yönlendirilecek.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-600">
              Açıklama
              {sonuc === "Olumsuz" && <span className="ml-0.5 text-rose-500">*</span>}
            </label>
            <textarea
              value={d.aciklama ?? ""}
              onChange={(e) => setD({ ...d, aciklama: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={!!d.altiAySonraBasvurabilir}
              onChange={(e) => setD({ ...d, altiAySonraBasvurabilir: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300"
            />
            6 ay sonra tekrar başvurabilir
          </label>

          {kisiselNotGorunur && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600">
                Kişisel notlar
                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                  Yalnızca İK ve akademi rolleri görür
                </span>
              </label>
              <textarea
                value={d.kisiselNot ?? ""}
                onChange={(e) => setD({ ...d, kisiselNot: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
          <span className="text-xs text-rose-500">{eksikListesi[0] ?? ""}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
            >
              Vazgeç
            </button>
            <button
              onClick={() => onKaydet(d)}
              disabled={eksikListesi.length > 0}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
