"use client";

import { useState } from "react";
import { FileSignature, X } from "lucide-react";
import {
  AKADEMI_MULAKAT_SECENEKLERI,
  CINSIYET_SECENEKLERI,
  EGITIM_BILGISI_SECENEKLERI,
  FEDERASYON_KADEME_SECENEKLERI,
} from "@/lib/egitmenSecenekleri";
import type { AdayEgitmen } from "@/lib/types";

type Cinsiyet = NonNullable<AdayEgitmen["cinsiyet"]>;
type EvetHayir = NonNullable<AdayEgitmen["antrenorlukGecmisiVarMi"]>;
type AkademiMulakatTipi = NonNullable<AdayEgitmen["akademiMulakatTipi"]>;

const DENKLIK_OGRENCI = "Denklik Bekliyor (Öğrenci)";

// PRD'deki not: 5. soruya (antrenörlük geçmişi) "Hayır" yanıtı verildiyse ve 4. sorudaki
// (Federasyon Kademe) ilk 2 seçenekten biri işaretlendiyse, "Kısa Dönem Akademi Mülakatı"
// seçeneği çıkmamalı.
const KISA_DONEM_GIZLENECEK_KADEMELER = new Set(FEDERASYON_KADEME_SECENEKLERI.slice(0, 2));

function AlanEtiket({ children, zorunlu }: { children: string; zorunlu?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-zinc-600">
      {children}
      {zorunlu && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

export function MulakatFormuModal({
  aday,
  dahaOnceDolduruldu,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  dahaOnceDolduruldu: boolean;
  onClose: () => void;
  onKaydet: (veri: {
    kulup: string;
    tarih: string;
    adSoyad: string;
    cinsiyet: Cinsiyet;
    egitimBilgisi: string;
    federasyonKademeDurumu: string;
    denklikMezuniyetTarihi: string;
    antrenorlukGecmisiVarMi: EvetHayir;
    antrenorlukGecmisiDetay: string;
    akademiMulakatTipi: AkademiMulakatTipi;
  }) => void;
}) {
  const otonom = aday.mulakatiYapanRol === "İK";
  const [duzenlemeModu, setDuzenlemeModu] = useState(!dahaOnceDolduruldu);

  const [kulup, setKulup] = useState(aday.formKulup ?? aday.kulup);
  const [tarih, setTarih] = useState(aday.formTarih ?? new Date().toLocaleDateString("tr-TR"));
  const [adSoyad, setAdSoyad] = useState(aday.formAdSoyad ?? `${aday.ad} ${aday.soyad}`);
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet | "">(aday.cinsiyet ?? "");
  const [egitimBilgisi, setEgitimBilgisi] = useState(aday.egitimBilgisi ?? "");
  const [federasyonKademeDurumu, setFederasyonKademeDurumu] = useState(
    aday.federasyonKademeDurumu ?? ""
  );
  const [denklikMezuniyetTarihi, setDenklikMezuniyetTarihi] = useState(
    aday.denklikMezuniyetTarihi ?? ""
  );
  const [antrenorlukGecmisiVarMi, setAntrenorlukGecmisiVarMi] = useState<EvetHayir | "">(
    aday.antrenorlukGecmisiVarMi ?? ""
  );
  const [antrenorlukGecmisiDetay, setAntrenorlukGecmisiDetay] = useState(
    aday.antrenorlukGecmisiDetay ?? ""
  );
  const [akademiMulakatTipi, setAkademiMulakatTipi] = useState<AkademiMulakatTipi | "">(
    aday.akademiMulakatTipi ?? ""
  );

  const kisaDonemGizli =
    antrenorlukGecmisiVarMi === "Hayır" &&
    KISA_DONEM_GIZLENECEK_KADEMELER.has(federasyonKademeDurumu);
  const gosterilecekAkademiSecenekleri = kisaDonemGizli
    ? AKADEMI_MULAKAT_SECENEKLERI.filter((s) => s !== "Kısa Dönem Akademi Mülakatı (1 Hafta)")
    : AKADEMI_MULAKAT_SECENEKLERI;

  const denklikOgrenciSecili = federasyonKademeDurumu === DENKLIK_OGRENCI;

  const zorunlularTamam =
    !!adSoyad &&
    !!cinsiyet &&
    !!egitimBilgisi &&
    !!federasyonKademeDurumu &&
    (!denklikOgrenciSecili || !!denklikMezuniyetTarihi) &&
    !!antrenorlukGecmisiVarMi &&
    !!akademiMulakatTipi;

  const kaydet = () => {
    if (!zorunlularTamam || !cinsiyet || !antrenorlukGecmisiVarMi || !akademiMulakatTipi) return;
    onKaydet({
      kulup,
      tarih,
      adSoyad,
      cinsiyet,
      egitimBilgisi,
      federasyonKademeDurumu,
      denklikMezuniyetTarihi,
      antrenorlukGecmisiVarMi,
      antrenorlukGecmisiDetay,
      akademiMulakatTipi,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-5">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-zinc-400" />
            <h3 className="text-lg font-semibold text-zinc-900">Spor Eğitmeni Mülakat Formu</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-8 py-6">
          {otonom && (
            <p className="rounded-lg bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
              İK tarafından yapılan mülakatlarda bu form doldurulması zorunlu değildir.
            </p>
          )}

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                ["Kulüp", kulup, setKulup],
                ["Tarih", tarih, setTarih],
                ["Adayın Adı Soyadı", adSoyad, setAdSoyad],
              ] as const
            ).map(([etiket, deger, setDeger]) => (
              <div key={etiket}>
                <AlanEtiket zorunlu={etiket === "Adayın Adı Soyadı"}>{etiket}</AlanEtiket>
                {duzenlemeModu ? (
                  <input
                    value={deger}
                    onChange={(e) => setDeger(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base outline-none focus:border-zinc-400"
                  />
                ) : (
                  <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                    {deger || <span className="text-zinc-400">Girilmedi</span>}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div>
            <AlanEtiket zorunlu>Cinsiyeti</AlanEtiket>
            {duzenlemeModu ? (
              <div className="flex flex-wrap gap-2">
                {CINSIYET_SECENEKLERI.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCinsiyet(c)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      cinsiyet === c
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                {cinsiyet || <span className="text-zinc-400">Girilmedi</span>}
              </p>
            )}
          </div>

          <div>
            <AlanEtiket zorunlu>Eğitim Bilgileri</AlanEtiket>
            {duzenlemeModu ? (
              <select
                value={egitimBilgisi}
                onChange={(e) => setEgitimBilgisi(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-zinc-400"
              >
                <option value="">Seçiniz</option>
                {EGITIM_BILGISI_SECENEKLERI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                {egitimBilgisi || <span className="text-zinc-400">Girilmedi</span>}
              </p>
            )}
          </div>

          <div>
            <AlanEtiket zorunlu>Federasyon Kademe Belge Durumu</AlanEtiket>
            {duzenlemeModu ? (
              <select
                value={federasyonKademeDurumu}
                onChange={(e) => setFederasyonKademeDurumu(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-zinc-400"
              >
                <option value="">Seçiniz</option>
                {FEDERASYON_KADEME_SECENEKLERI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                {federasyonKademeDurumu || <span className="text-zinc-400">Girilmedi</span>}
              </p>
            )}
          </div>

          {denklikOgrenciSecili && (
            <div>
              <AlanEtiket zorunlu>Mezuniyet Tarihi</AlanEtiket>
              {duzenlemeModu ? (
                <input
                  type="date"
                  value={denklikMezuniyetTarihi}
                  onChange={(e) => setDenklikMezuniyetTarihi(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base outline-none focus:border-zinc-400"
                />
              ) : (
                <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                  {denklikMezuniyetTarihi || <span className="text-zinc-400">Girilmedi</span>}
                </p>
              )}
            </div>
          )}

          <div>
            <AlanEtiket zorunlu>Adayın antrenörlük geçmişi var mı?</AlanEtiket>
            {duzenlemeModu ? (
              <div className="flex flex-wrap gap-2">
                {(["Evet", "Hayır"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAntrenorlukGecmisiVarMi(v)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      antrenorlukGecmisiVarMi === v
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                {antrenorlukGecmisiVarMi || <span className="text-zinc-400">Girilmedi</span>}
              </p>
            )}
          </div>

          {antrenorlukGecmisiVarMi === "Evet" && (
            <div>
              <AlanEtiket>Antrenörlük Geçmişi Detayı</AlanEtiket>
              <p className="mb-1 text-xs text-zinc-400">
                Bu alan için yapılandırılmış seçenekler henüz netleşmedi — şimdilik serbest metin.
              </p>
              {duzenlemeModu ? (
                <textarea
                  value={antrenorlukGecmisiDetay}
                  onChange={(e) => setAntrenorlukGecmisiDetay(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base outline-none focus:border-zinc-400"
                />
              ) : (
                <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                  {antrenorlukGecmisiDetay || <span className="text-zinc-400">Girilmedi</span>}
                </p>
              )}
            </div>
          )}

          <div>
            <AlanEtiket zorunlu>Hangi akademi mülakatına yönlendiriyorsunuz?</AlanEtiket>
            {duzenlemeModu ? (
              <div className="flex flex-wrap gap-2">
                {gosterilecekAkademiSecenekleri.map((s) => (
                  <button
                    key={s}
                    onClick={() => setAkademiMulakatTipi(s)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      akademiMulakatTipi === s
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
                {akademiMulakatTipi || <span className="text-zinc-400">Girilmedi</span>}
              </p>
            )}
            {duzenlemeModu && kisaDonemGizli && (
              <p className="mt-1 text-xs text-zinc-400">
                Antrenörlük geçmişi yok ve federasyon kademe belgesi/temel eğitimi de yok — bu
                adayda &quot;Kısa Dönem Akademi Mülakatı&quot; seçeneği gösterilmiyor.
              </p>
            )}
          </div>

          {!duzenlemeModu && (
            <button
              onClick={() => setDuzenlemeModu(true)}
              className="self-start rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Düzenle
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-8 py-5">
          {duzenlemeModu ? (
            <>
              <button
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-base font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Vazgeç
              </button>
              <button
                onClick={kaydet}
                disabled={!zorunlularTamam}
                className="rounded-xl bg-brand px-5 py-2.5 text-base font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Kaydet
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-base font-semibold text-white hover:bg-black"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
