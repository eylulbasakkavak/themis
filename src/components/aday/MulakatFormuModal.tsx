"use client";

import { useState, type ReactNode } from "react";
import { FileSignature, X } from "lucide-react";
import {
  AKADEMI_MULAKAT_SECENEKLERI,
  CINSIYET_SECENEKLERI,
  EGITIM_BILGISI_SECENEKLERI,
  FEDERASYON_KADEME_SECENEKLERI,
  TOPLAM_DENEYIM_SECENEKLERI,
} from "@/lib/egitmenSecenekleri";
import type { AdayEgitmen } from "@/lib/types";

type Cinsiyet = NonNullable<AdayEgitmen["cinsiyet"]>;
type EvetHayir = NonNullable<AdayEgitmen["antrenorlukGecmisiVarMi"]>;
type AkademiMulakatTipi = NonNullable<AdayEgitmen["akademiMulakatTipi"]>;

export type MulakatFormuVerisi = {
  kulup: string;
  tarih: string;
  adSoyad: string;
  tcKimlikNo: string;
  mulakatiYapan: string;
  cinsiyet: Cinsiyet;
  egitimBilgisi: string;
  federasyonKademeDurumu: string;
  denklikMezuniyetTarihi: string;
  antrenorlukGecmisiVarMi: EvetHayir;
  grupDersiVerebilir: boolean;
  toplamDeneyim: string;
  sonGorevYeri: string;
  antrenorlukGecmisiDetay: string;
  akademiMulakatTipi: AkademiMulakatTipi;
  degerlendirmeNotu: string;
};

const DENKLIK_OGRENCI = "Denklik Bekliyor (Öğrenci)";
const KISA_DONEM = "Kısa Dönem Akademi Mülakatı (1 Hafta)";

// PRD'deki not: 5. soruya (antrenörlük geçmişi) "Hayır" yanıtı verildiyse ve 4. sorudaki
// (Federasyon Kademe) ilk 2 seçenekten biri işaretlendiyse, "Kısa Dönem Akademi Mülakatı"
// seçeneği çıkmamalı.
const KISA_DONEM_GIZLENECEK_KADEMELER = new Set(FEDERASYON_KADEME_SECENEKLERI.slice(0, 2));

const girdiSinifi =
  "w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base outline-none focus:border-zinc-400";
const secimSinifi =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-zinc-400";

function AlanEtiket({ children, zorunlu }: { children: string; zorunlu?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-zinc-600">
      {children}
      {zorunlu && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

/** Görüntüleme modunda alanın değeri. */
function Deger({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-700">
      {children || <span className="text-zinc-400">Girilmedi</span>}
    </p>
  );
}

export function MulakatFormuModal({
  aday,
  dahaOnceDolduruldu,
  saltOkunur = false,
  onClose,
  onKaydet,
}: {
  aday: AdayEgitmen;
  dahaOnceDolduruldu: boolean;
  // Canlı eğitmende form yalnızca görüntülenir; alanlar değiştirilemez.
  saltOkunur?: boolean;
  onClose: () => void;
  onKaydet: (veri: MulakatFormuVerisi) => void;
}) {
  const otonom = aday.mulakatiYapanRol === "İK";
  const [duzenlemeModu, setDuzenlemeModu] = useState(!saltOkunur && !dahaOnceDolduruldu);

  const [kulup, setKulup] = useState(aday.formKulup ?? aday.kulup);
  const [tarih, setTarih] = useState(aday.formTarih ?? new Date().toLocaleDateString("tr-TR"));
  const [adSoyad, setAdSoyad] = useState(aday.formAdSoyad ?? `${aday.ad} ${aday.soyad}`);
  const [tcKimlikNo, setTcKimlikNo] = useState(aday.tcKimlikNo ?? "");
  const [mulakatiYapan, setMulakatiYapan] = useState(
    aday.formMulakatiYapan ?? aday.mulakatiYapan ?? ""
  );
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
  const [grupDersiVerebilir, setGrupDersiVerebilir] = useState(aday.grupDersiVerebilir ?? false);
  const [toplamDeneyim, setToplamDeneyim] = useState(aday.toplamDeneyim ?? "");
  const [sonGorevYeri, setSonGorevYeri] = useState(aday.sonGorevYeri ?? "");
  const [antrenorlukGecmisiDetay, setAntrenorlukGecmisiDetay] = useState(
    aday.antrenorlukGecmisiDetay ?? ""
  );
  const [akademiMulakatTipi, setAkademiMulakatTipi] = useState<AkademiMulakatTipi | "">(
    aday.akademiMulakatTipi ?? ""
  );
  const [degerlendirmeNotu, setDegerlendirmeNotu] = useState(aday.mulakatDegerlendirmeNotu ?? "");

  const antrenorlukVar = antrenorlukGecmisiVarMi === "Evet";
  // Kısa Dönem Akademi, ancak "En az 2 grup dersi verebilme becerisi" işaretliyse seçilebilir;
  // bu kutu antrenörlük geçmişi "Evet" iken sorulduğundan "Hayır"da da gizlenir.
  const kademeKurali =
    antrenorlukGecmisiVarMi === "Hayır" &&
    KISA_DONEM_GIZLENECEK_KADEMELER.has(federasyonKademeDurumu);
  const kisaDonemGizli = kademeKurali || !antrenorlukVar || !grupDersiVerebilir;
  const gosterilecekAkademiSecenekleri = kisaDonemGizli
    ? AKADEMI_MULAKAT_SECENEKLERI.filter((s) => s !== KISA_DONEM)
    : AKADEMI_MULAKAT_SECENEKLERI;
  // Seçili Kısa Dönem, koşulu bozulunca geçersiz sayılır ve yeniden seçim istenir.
  const gecerliAkademiTipi =
    akademiMulakatTipi === KISA_DONEM && kisaDonemGizli ? "" : akademiMulakatTipi;

  const denklikOgrenciSecili = federasyonKademeDurumu === DENKLIK_OGRENCI;
  const tcGecerli = /^\d{11}$/.test(tcKimlikNo.trim());

  const zorunlularTamam =
    !!adSoyad &&
    tcGecerli &&
    !!mulakatiYapan.trim() &&
    !!cinsiyet &&
    !!egitimBilgisi &&
    !!federasyonKademeDurumu &&
    (!denklikOgrenciSecili || !!denklikMezuniyetTarihi) &&
    !!antrenorlukGecmisiVarMi &&
    !!gecerliAkademiTipi;

  const kaydet = () => {
    if (!zorunlularTamam || !cinsiyet || !antrenorlukGecmisiVarMi || !gecerliAkademiTipi) return;
    onKaydet({
      kulup,
      tarih,
      adSoyad,
      tcKimlikNo: tcKimlikNo.trim(),
      mulakatiYapan: mulakatiYapan.trim(),
      cinsiyet,
      egitimBilgisi,
      federasyonKademeDurumu,
      denklikMezuniyetTarihi,
      antrenorlukGecmisiVarMi,
      // Antrenörlük geçmişi yoksa detay alanları kaydedilmez.
      grupDersiVerebilir: antrenorlukVar && grupDersiVerebilir,
      toplamDeneyim: antrenorlukVar ? toplamDeneyim : "",
      sonGorevYeri: antrenorlukVar ? sonGorevYeri.trim() : "",
      antrenorlukGecmisiDetay: antrenorlukVar ? antrenorlukGecmisiDetay : "",
      akademiMulakatTipi: gecerliAkademiTipi,
      degerlendirmeNotu: degerlendirmeNotu.trim(),
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                ["Kulüp", kulup, setKulup, false],
                ["Tarih", tarih, setTarih, false],
                ["Mülakatı Yapan (Ad Soyad)", mulakatiYapan, setMulakatiYapan, true],
                ["Adayın Adı Soyadı", adSoyad, setAdSoyad, true],
                ["Adayın TC Kimlik No", tcKimlikNo, setTcKimlikNo, true],
              ] as const
            ).map(([etiket, deger, setDeger, zorunlu]) => (
              <div key={etiket}>
                <AlanEtiket zorunlu={zorunlu}>{etiket}</AlanEtiket>
                {duzenlemeModu ? (
                  <input
                    value={deger}
                    onChange={(e) => setDeger(e.target.value)}
                    inputMode={etiket === "Adayın TC Kimlik No" ? "numeric" : undefined}
                    maxLength={etiket === "Adayın TC Kimlik No" ? 11 : undefined}
                    className={girdiSinifi}
                  />
                ) : (
                  <Deger>{deger}</Deger>
                )}
                {duzenlemeModu && etiket === "Adayın TC Kimlik No" && tcKimlikNo && !tcGecerli && (
                  <p className="mt-1 text-xs text-rose-600">TC Kimlik No 11 haneli olmalı.</p>
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
              <Deger>{cinsiyet}</Deger>
            )}
          </div>

          <div>
            <AlanEtiket zorunlu>Eğitim Bilgileri</AlanEtiket>
            {duzenlemeModu ? (
              <select
                value={egitimBilgisi}
                onChange={(e) => setEgitimBilgisi(e.target.value)}
                className={secimSinifi}
              >
                <option value="">Seçiniz</option>
                {EGITIM_BILGISI_SECENEKLERI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <Deger>{egitimBilgisi}</Deger>
            )}
          </div>

          <div>
            <AlanEtiket zorunlu>Federasyon Kademe Belge Durumu</AlanEtiket>
            {duzenlemeModu ? (
              <select
                value={federasyonKademeDurumu}
                onChange={(e) => setFederasyonKademeDurumu(e.target.value)}
                className={secimSinifi}
              >
                <option value="">Seçiniz</option>
                {FEDERASYON_KADEME_SECENEKLERI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <Deger>{federasyonKademeDurumu}</Deger>
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
                  className={girdiSinifi}
                />
              ) : (
                <Deger>{denklikMezuniyetTarihi}</Deger>
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
              <Deger>{antrenorlukGecmisiVarMi}</Deger>
            )}
          </div>

          {antrenorlukVar && (
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4">
              <div className="text-sm font-semibold text-zinc-800">Antrenörlük Geçmişi Detayı</div>

              <label
                className={`flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 ${
                  duzenlemeModu ? "cursor-pointer hover:bg-zinc-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={grupDersiVerebilir}
                  onChange={(e) => setGrupDersiVerebilir(e.target.checked)}
                  disabled={!duzenlemeModu}
                  className="mt-0.5 h-4 w-4 accent-zinc-900"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-800">
                    En az 2 grup dersi verebilme becerisi var mı?
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    Bu alan işaretlenmezse Kısa Dönem Akademi seçilemez.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <AlanEtiket>Toplam deneyim</AlanEtiket>
                  {duzenlemeModu ? (
                    <select
                      value={toplamDeneyim}
                      onChange={(e) => setToplamDeneyim(e.target.value)}
                      className={secimSinifi}
                    >
                      <option value="">Seçiniz</option>
                      {TOPLAM_DENEYIM_SECENEKLERI.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Deger>{toplamDeneyim}</Deger>
                  )}
                </div>
                <div>
                  <AlanEtiket>Son görev yeri</AlanEtiket>
                  {duzenlemeModu ? (
                    <input
                      value={sonGorevYeri}
                      onChange={(e) => setSonGorevYeri(e.target.value)}
                      className={girdiSinifi}
                    />
                  ) : (
                    <Deger>{sonGorevYeri}</Deger>
                  )}
                </div>
              </div>

              <div>
                <AlanEtiket>Deneyim özeti</AlanEtiket>
                {duzenlemeModu ? (
                  <textarea
                    value={antrenorlukGecmisiDetay}
                    onChange={(e) => setAntrenorlukGecmisiDetay(e.target.value)}
                    rows={3}
                    className={girdiSinifi}
                  />
                ) : (
                  <Deger>{antrenorlukGecmisiDetay}</Deger>
                )}
              </div>
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
                      gecerliAkademiTipi === s
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <Deger>{akademiMulakatTipi}</Deger>
            )}
            {duzenlemeModu && kisaDonemGizli && (
              <p className="mt-1 text-xs text-zinc-400">
                {kademeKurali
                  ? "Antrenörlük geçmişi yok ve federasyon kademe belgesi/temel eğitimi de yok — "
                  : !antrenorlukVar
                    ? "Antrenörlük geçmişi yok, grup dersi becerisi sorulmadı — "
                    : "En az 2 grup dersi verebilme becerisi işaretlenmedi — "}
                bu adayda &quot;Kısa Dönem Akademi Mülakatı&quot; seçeneği gösterilmiyor.
              </p>
            )}
          </div>

          <div>
            <AlanEtiket>Değerlendirme Notu</AlanEtiket>
            {duzenlemeModu ? (
              <textarea
                value={degerlendirmeNotu}
                onChange={(e) => setDegerlendirmeNotu(e.target.value)}
                rows={4}
                placeholder="Mülakata ilişkin genel değerlendirmeniz"
                className={girdiSinifi}
              />
            ) : (
              <Deger>{degerlendirmeNotu}</Deger>
            )}
          </div>

          {saltOkunur ? (
            <p className="rounded-lg bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
              Canlı eğitmenlerde mülakat formu yalnızca görüntülenebilir, alanlar değiştirilemez.
            </p>
          ) : (
            !duzenlemeModu && (
              <button
                onClick={() => setDuzenlemeModu(true)}
                className="self-start rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Düzenle
              </button>
            )
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
