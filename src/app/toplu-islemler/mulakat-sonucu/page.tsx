"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { useAdaylar } from "@/lib/AdaylarContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import {
  akademiMulakatiniYapan,
  bosDegerlendirme,
  degerlendirmeyiUygula,
  eksikler,
  kisaAkademiyeYonlendirildiMi,
  MULAKAT_KRITERLERI,
  sonucHesapla,
  toplamPuan,
  tumKriterlerIsaretliMi,
  type MulakatDegerlendirmesi,
  type MulakatKriterAnahtari,
  type MulakatSonucu,
} from "@/lib/mulakatDegerlendirme";
import { kulupMarkasi } from "@/lib/kulupler";
import type { AdayEgitmen } from "@/lib/types";

function GeriDon() {
  return (
    <Link
      href="/toplu-islemler"
      className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Toplu İşlemler
    </Link>
  );
}

/** Tarih girişinden gelen "YYYY-MM-DD" değerini "DD.MM.YYYY" olarak gösterir. */
function tarihGoster(tarih: string) {
  const [y, m, g] = tarih.split("-");
  return g && m && y ? `${g}.${m}.${y}` : tarih;
}

const DURUM_HUCRE: Record<MulakatSonucu, string> = {
  Olumlu: "bg-emerald-50 text-emerald-700",
  Olumsuz: "bg-rose-50 text-rose-700",
  Katılmadı: "bg-amber-100 text-amber-800",
};

/** Bir satırda kullanıcı herhangi bir alanı doldurduysa satır "dokunulmuş" sayılır. */
function dokunulduMu(d: MulakatDegerlendirmesi) {
  return (
    d.katilmadi ||
    Object.keys(d.kriterler).length > 0 ||
    d.kisaAkademiUygun !== undefined ||
    !!d.altiAySonraBasvurabilir ||
    !!d.aciklama?.trim() ||
    !!d.kisiselNot?.trim()
  );
}

const hucre = "border border-zinc-200 px-2 py-1.5";
const baslikHucre = "border border-zinc-700 px-2 py-2 align-top";

export default function TopluMulakatSonucuPage() {
  const { adaylar, setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const yetkiVar = ikYetkisiVarMi(currentUser.rol);
  const [seciliTarih, setSeciliTarih] = useState<string | null>(null);
  const [satirlar, setSatirlar] = useState<Record<string, MulakatDegerlendirmesi>>({});
  const [sonucMesaji, setSonucMesaji] = useState<string | null>(null);

  // Mülakatı planlanmış ve sonucu henüz girilmemiş adaylar, mülakat tarihine göre.
  const bekleyenler = useMemo(
    () =>
      adaylar
        .filter((a) => a.surecDurumu === "mulakat_sonucu_bekleniyor" && a.mulakatPlanlananTarihi)
        .sort((a, b) =>
          `${a.mulakatPlanlananTarihi} ${a.mulakatPlanlananSaat ?? ""}`.localeCompare(
            `${b.mulakatPlanlananTarihi} ${b.mulakatPlanlananSaat ?? ""}`
          )
        ),
    [adaylar]
  );
  const tarihler = useMemo(
    () => [...new Set(bekleyenler.map((a) => a.mulakatPlanlananTarihi!))].sort(),
    [bekleyenler]
  );
  const gorunenler = seciliTarih
    ? bekleyenler.filter((a) => a.mulakatPlanlananTarihi === seciliTarih)
    : bekleyenler;

  const satir = (id: string) => satirlar[id] ?? bosDegerlendirme();
  const guncelle = (id: string, degisiklik: Partial<MulakatDegerlendirmesi>) =>
    setSatirlar((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? bosDegerlendirme()), ...degisiklik },
    }));

  const kriterAyarla = (id: string, anahtar: MulakatKriterAnahtari, deger: 0 | 1 | undefined) => {
    const kriterler = { ...satir(id).kriterler };
    if (deger === undefined) delete kriterler[anahtar];
    else kriterler[anahtar] = deger;
    guncelle(id, { kriterler });
  };

  const dokunulanlar = gorunenler.filter((a) => dokunulduMu(satir(a.id)));
  const hazirlar = dokunulanlar.filter((a) => eksikler(satir(a.id), a).length === 0);
  const eksikSayisi = dokunulanlar.length - hazirlar.length;

  const tumunuKaydet = () => {
    if (hazirlar.length === 0) return;
    const giren = `${currentUser.ad} (${currentUser.rol})`;
    const kaydedilecek = new Map(hazirlar.map((a) => [a.id, satir(a.id)]));
    const sayac: Record<MulakatSonucu, number> = { Olumlu: 0, Olumsuz: 0, Katılmadı: 0 };
    for (const d of kaydedilecek.values()) sayac[sonucHesapla(d)!] += 1;

    setAdaylar((prev) =>
      prev.map((a) => {
        const d = kaydedilecek.get(a.id);
        return d ? degerlendirmeyiUygula(a, d, giren) : a;
      })
    );
    setSatirlar((prev) => {
      const kalan = { ...prev };
      for (const id of kaydedilecek.keys()) delete kalan[id];
      return kalan;
    });
    setSonucMesaji(
      `${kaydedilecek.size} adayın değerlendirmesi kaydedildi: ${sayac.Olumlu} olumlu, ${sayac.Olumsuz} olumsuz, ${sayac.Katılmadı} katılmadı.`
    );
  };

  if (!yetkiVar) {
    return (
      <div className="flex flex-col gap-5">
        <GeriDon />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
          Bu işlem yalnızca İK tarafından yapılabilir. Şu anki rolün: {currentUser.rol}.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Akademi Mülakatı Sonucu Gir</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Mülakatı planlanmış adayların her kriteri için 1 (karşılıyor) veya 0 (karşılamıyor) seçin; puan ve sonuç otomatik hesaplanır.
          En az 4 kriteri karşılayan aday Olumlu sonuçlanır.
        </p>
      </div>

      {sonucMesaji && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {sonucMesaji}
          </span>
          <button
            onClick={() => setSonucMesaji(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">Mülakat tarihi:</span>
        {[null, ...tarihler].map((t) => {
          const aktif = seciliTarih === t;
          const adet = t
            ? bekleyenler.filter((a) => a.mulakatPlanlananTarihi === t).length
            : bekleyenler.length;
          return (
            <button
              key={t ?? "tumu"}
              onClick={() => setSeciliTarih(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                aktif
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {t ? tarihGoster(t) : "Tümü"} <span className="opacity-60">{adet}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-300 bg-white shadow-sm">
        <table className="w-full min-w-[2100px] border-collapse text-sm">
          <thead className="bg-zinc-900 text-white">
            <tr>
              <th className={`${baslikHucre} sticky left-0 z-10 w-52 bg-zinc-900 text-left`}>
                Ad-Soyad
              </th>
              <th className={`${baslikHucre} w-16`}>Yıl</th>
              <th className={`${baslikHucre} w-32`}>Mülakatı Yapan</th>
              <th className={`${baslikHucre} w-24`}>Tarih</th>
              <th className={`${baslikHucre} w-20`}>Cinsiyet</th>
              <th className={`${baslikHucre} w-24`}>MAC One/MACFit</th>
              <th className={`${baslikHucre} w-28`}>Kulüp</th>
              <th className={`${baslikHucre} w-24`}>Mülakat Tipi</th>
              <th className={`${baslikHucre} w-20`}>Katılmadı</th>
              {MULAKAT_KRITERLERI.map((k) => (
                <th key={k.anahtar} className={`${baslikHucre} w-28`} title={k.kapsam}>
                  <div className="font-semibold">{k.ad}</div>
                  <div className="mt-0.5 text-[10px] font-normal leading-tight text-zinc-400">
                    {k.kapsam}
                  </div>
                </th>
              ))}
              <th className={`${baslikHucre} w-16`}>Sonuç</th>
              <th className={`${baslikHucre} w-24`}>Durum</th>
              <th className={`${baslikHucre} w-32`}>Kısa Akademi</th>
              <th className={`${baslikHucre} w-56 text-left`}>Açıklama</th>
              <th className={`${baslikHucre} w-20`}>6 Ay Sonra Başvurabilir</th>
              <th className={`${baslikHucre} w-56 text-left`}>Kişisel Notlar</th>
            </tr>
          </thead>
          <tbody>
            {gorunenler.map((a: AdayEgitmen) => {
              const d = satir(a.id);
              const sonuc = sonucHesapla(d);
              const kisa = kisaAkademiyeYonlendirildiMi(a.akademiMulakatTipi);
              const eksik = dokunulduMu(d) ? eksikler(d, a) : [];
              const aciklamaEksik = sonuc === "Olumsuz" && !d.aciklama?.trim();
              return (
                <tr key={a.id} className={eksik.length > 0 ? "bg-rose-50/30" : ""}>
                  <td className={`${hucre} sticky left-0 z-[1] bg-white`}>
                    <div className="font-medium text-zinc-900">
                      {a.ad} {a.soyad}
                    </div>
                    <div className="font-mono text-xs text-zinc-400">{a.themisId}</div>
                  </td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>
                    {a.mulakatPlanlananTarihi!.slice(0, 4)}
                  </td>
                  <td className={`${hucre} text-xs text-zinc-600`}>{akademiMulakatiniYapan(a)}</td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>
                    <span className="font-semibold text-zinc-800">
                      {tarihGoster(a.mulakatPlanlananTarihi!)}
                    </span>
                    {a.mulakatPlanlananSaat && <div>{a.mulakatPlanlananSaat}</div>}
                  </td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>
                    {a.cinsiyet?.toLocaleUpperCase("tr-TR") ?? "—"}
                  </td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>
                    {kulupMarkasi(a.kulup)}
                  </td>
                  <td className={`${hucre} text-xs text-zinc-600`}>{a.kulup}</td>
                  <td className={`${hucre} text-center text-xs text-zinc-600`}>
                    {kisa ? "Kısa Dönem" : "Standart"}
                  </td>
                  <td className={`${hucre} text-center`}>
                    <input
                      type="checkbox"
                      checked={d.katilmadi}
                      onChange={(e) =>
                        guncelle(a.id, {
                          katilmadi: e.target.checked,
                          kriterler: e.target.checked ? {} : d.kriterler,
                        })
                      }
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </td>
                  {MULAKAT_KRITERLERI.map((k) => {
                    const p = d.kriterler[k.anahtar];
                    return (
                      <td key={k.anahtar} className="border border-zinc-200 p-0">
                        {/* 1 = karşılıyor, 0 = karşılamıyor; boş bırakılan kriter sonucu bekletir. */}
                        <select
                          aria-label={`${a.ad} ${a.soyad} – ${k.ad}`}
                          disabled={d.katilmadi}
                          value={p === undefined ? "" : String(p)}
                          onChange={(e) =>
                            kriterAyarla(
                              a.id,
                              k.anahtar,
                              e.target.value === "" ? undefined : (Number(e.target.value) as 0 | 1)
                            )
                          }
                          className={`h-11 w-full cursor-pointer bg-transparent text-center text-base font-semibold outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-transparent ${
                            p === 1
                              ? "bg-emerald-50/60 text-emerald-700"
                              : p === 0
                                ? "bg-rose-50/60 text-rose-600"
                                : "text-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          <option value="">–</option>
                          <option value="1">1</option>
                          <option value="0">0</option>
                        </select>
                      </td>
                    );
                  })}
                  <td
                    className={`${hucre} text-center text-base font-bold ${
                      d.katilmadi
                        ? "bg-amber-50 text-amber-700"
                        : !tumKriterlerIsaretliMi(d)
                          ? "text-zinc-300"
                          : sonuc === "Olumlu"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {d.katilmadi ? 0 : tumKriterlerIsaretliMi(d) ? toplamPuan(d) : "—"}
                  </td>
                  <td
                    className={`${hucre} text-center text-xs font-bold ${sonuc ? DURUM_HUCRE[sonuc] : "text-zinc-300"}`}
                  >
                    {sonuc ? sonuc.toLocaleUpperCase("tr-TR") : "—"}
                  </td>
                  <td className={`${hucre} text-center`}>
                    <select
                      value={
                        d.kisaAkademiUygun === undefined
                          ? ""
                          : d.kisaAkademiUygun
                            ? "evet"
                            : "hayir"
                      }
                      onChange={(e) =>
                        guncelle(a.id, {
                          kisaAkademiUygun:
                            e.target.value === "" ? undefined : e.target.value === "evet",
                        })
                      }
                      className={`w-full rounded border bg-white px-1 py-1 text-xs outline-none ${
                        kisa && sonuc && sonuc !== "Katılmadı" && d.kisaAkademiUygun === undefined
                          ? "border-rose-300"
                          : "border-zinc-200"
                      }`}
                    >
                      <option value="">Seçiniz</option>
                      <option value="evet">Uygun</option>
                      <option value="hayir">Uygun değil</option>
                    </select>
                  </td>
                  <td className={`${hucre} ${aciklamaEksik ? "bg-rose-50" : ""}`}>
                    <input
                      value={d.aciklama ?? ""}
                      onChange={(e) => guncelle(a.id, { aciklama: e.target.value })}
                      placeholder={aciklamaEksik ? "Olumsuz sonuçta zorunlu" : ""}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-rose-400"
                    />
                  </td>
                  <td className={`${hucre} text-center`}>
                    <input
                      type="checkbox"
                      checked={!!d.altiAySonraBasvurabilir}
                      onChange={(e) =>
                        guncelle(a.id, { altiAySonraBasvurabilir: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </td>
                  <td className={hucre}>
                    <input
                      value={d.kisiselNot ?? ""}
                      onChange={(e) => guncelle(a.id, { kisiselNot: e.target.value })}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </td>
                </tr>
              );
            })}
            {gorunenler.length === 0 && (
              <tr>
                <td colSpan={22} className="px-4 py-12 text-center text-sm text-zinc-400">
                  Mülakatı planlanmış, sonucu bekleyen aday yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-800">{hazirlar.length}</span> satır kaydedilmeye
          hazır
          {eksikSayisi > 0 && (
            <span className="ml-2 text-rose-600">· {eksikSayisi} satırda eksik var</span>
          )}
        </span>
        <button
          onClick={tumunuKaydet}
          disabled={hazirlar.length === 0}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tümünü Kaydet
        </button>
      </div>
    </div>
  );
}
