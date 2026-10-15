"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Download,
  Pencil,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { AkademiDuzenleModal } from "@/components/akademi/AkademiDuzenleModal";
import { useAdaylar } from "@/lib/AdaylarContext";
import {
  akademiDurumu,
  bugun,
  devamDurumu,
  duzenlenebilirMi,
  egitimGunleri,
  gecmisEgitimGunleri,
  gununYoklamasi,
  gelmeyenSayisi,
  katilanSayisi,
  kayitliSayisi,
  kisaAkademiMi,
  tarihYaz,
  yoklamaAlindiMi,
} from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen, YoklamaDurumu } from "@/lib/types";

function GeriDon() {
  return (
    <Link
      href="/akademi"
      className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Akademi
    </Link>
  );
}

function Sayi({
  label,
  deger,
  renk,
}: {
  label: string;
  deger: ReactNode;
  renk?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 px-4 py-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${renk ?? "text-zinc-900"}`}>
        {deger}
      </div>
    </div>
  );
}

function csvIndir(dosyaAdi: string, basliklar: string[], satirlar: string[][]) {
  const csv = [basliklar, ...satirlar]
    .map((satir) =>
      satir.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dosyaAdi;
  link.click();
  URL.revokeObjectURL(url);
}

/** Akademi detayı: kayıtlı aday listesi, filtre/Excel ve ilk gün yoklaması (PRD 7.3, 8). */
export default function AkademiDetayPage() {
  const { id } = useParams<{ id: string }>();
  const { donemler, donemIptal, yoklamaKaydet, gunlukYoklamaKaydet } =
    useAkademiDonemleri();
  const { adaylar, setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const akademi = donemler.find((d) => d.id === id);

  const [aramaMetni, setAramaMetni] = useState("");
  const [cinsiyet, setCinsiyet] = useState("");
  const [kulup, setKulup] = useState("");
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [iptalOnay, setIptalOnay] = useState(false);
  // Yoklama modunda işaretlenen ama henüz kaydedilmemiş değerler ve yoklaması alınan gün.
  const [yoklamaTaslak, setYoklamaTaslak] = useState<Record<
    string,
    YoklamaDurumu
  > | null>(null);
  const [yoklamaGunu, setYoklamaGunu] = useState<string | null>(null);
  // Tabloda gösterilen eğitim günü (varsayılan: bugüne en yakın geçmiş gün).
  const [seciliGunHam, setSeciliGun] = useState<string | null>(null);

  if (!akademi) {
    return (
      <div className="flex flex-col gap-5">
        <GeriDon />
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
          Akademi bulunamadı.
        </div>
      </div>
    );
  }

  // Akademi Yöneticisi / Akademi Eğitmeni rolleri henüz yok; yetkili işlemler İK'dadır.
  const yetkili = ikYetkisiVarMi(currentUser.rol);
  const durum = akademiDurumu(akademi);
  const kayitlilar = akademi.kayitlilar
    .map((aid) => adaylar.find((a) => a.id === aid))
    .filter((a): a is AdayEgitmen => !!a);
  const kulupler = [...new Set(kayitlilar.map((a) => a.kulup))].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
  const gorunenler = kayitlilar.filter(
    (a) =>
      `${a.ad} ${a.soyad}`
        .toLocaleLowerCase("tr")
        .includes(aramaMetni.trim().toLocaleLowerCase("tr")) &&
      (!cinsiyet || a.cinsiyet === cinsiyet) &&
      (!kulup || a.kulup === kulup),
  );
  const gunler = egitimGunleri(akademi);
  const ilkGun = gunler[0];
  const gecmisGunler = gecmisEgitimGunleri(akademi);
  const seciliGun = seciliGunHam ?? gecmisGunler.at(-1) ?? ilkGun;
  const gunNo = (g: string) => gunler.indexOf(g) + 1;
  const yoklamaModu = yoklamaTaslak !== null;
  // Gelmemek yalnızca devamsızlık olarak kaydedilir; her gün tüm kayıtlılar yoklamaya girer.
  const yoklamaGirenler = kayitlilar;
  const yoklamaDegeri = (aid: string) =>
    (yoklamaTaslak ?? gununYoklamasi(akademi, seciliGun) ?? {})[aid];
  const yoklamaTamam =
    yoklamaModu && yoklamaGirenler.every((a) => yoklamaTaslak[a.id]);
  /** Günün yoklama durumu: alındı / bekliyor (günü geldi, alınmadı) / gelecek. */
  const gunDurumu = (g: string) =>
    gununYoklamasi(akademi, g)
      ? "alindi"
      : gecmisGunler.includes(g)
        ? "bekliyor"
        : "gelecek";
  const yoklamaBaslat = (g: string) => {
    setSeciliGun(g);
    setYoklamaGunu(g);
    setYoklamaTaslak({ ...(gununYoklamasi(akademi, g) ?? {}) });
  };

  const excelIndir = () =>
    csvIndir(
      `${akademi.ad.replace(/[\s/]+/g, "-")}-aday-listesi.csv`,
      [
        "Ad Soyad",
        "Eğitmen ID",
        "Cinsiyet",
        "Kulüp",
        "Konaklama",
        "Ayakkabı No",
        "Üst Beden",
        "Alt Beden",
        `Yoklama (${gunNo(seciliGun)}. gün)`,
        "Devam",
      ],
      gorunenler.map((a) => [
        `${a.ad} ${a.soyad}`,
        a.themisId,
        a.cinsiyet ?? "",
        a.kulup,
        a.bmOnayliKonaklama ?? "",
        a.ayakkabiNo ?? "",
        a.ustBeden ?? "",
        a.altBeden ?? "",
        gununYoklamasi(akademi, seciliGun)?.[a.id] ?? "",
        `${devamDurumu(akademi, a.id).geldi}/${devamDurumu(akademi, a.id).alinan}`,
      ]),
    );

  const yoklamaKaydetVeUygula = () => {
    if (!yoklamaTaslak || !yoklamaTamam) return;
    const yapan = `${currentUser.ad} (${currentUser.rol})`;
    const tarih = tarihYaz(bugun());
    // Her gün (1. gün dahil) yalnızca devam kaydıdır; sözleşme kapatılmaz.
    if (yoklamaGunu === ilkGun) {
      yoklamaKaydet(akademi.id, yoklamaTaslak, yapan, tarih);
    } else if (yoklamaGunu) {
      gunlukYoklamaKaydet(akademi.id, {
        tarih: yoklamaGunu,
        yoklama: yoklamaTaslak,
        alan: yapan,
        alinmaTarihi: tarih,
      });
    }
    const gun = yoklamaGunu ?? ilkGun;
    setAdaylar((prev) =>
      prev.map((a) =>
        yoklamaTaslak[a.id] === "Gelmedi"
          ? {
              ...a,
              aksiyonGecmisi: [
                ...a.aksiyonGecmisi,
                {
                  tarih,
                  aksiyon: `Akademi ${gunNo(gun)}. gün (${gun}) yoklamasında gelmedi (${akademi.ad})`,
                  yapan,
                },
              ],
            }
          : a,
      ),
    );
    setYoklamaTaslak(null);
    setYoklamaGunu(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <GeriDon />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{akademi.ad}</h1>
              <Badge label={durum.label} tone={durum.tone} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {kisaAkademiMi(akademi.tip)
                ? "Kısa Dönem (1 Hafta)"
                : "Standart (4 Hafta)"}{" "}
              · {akademi.baslangicTarihi} – {akademi.bitisTarihi}
            </p>
            {akademi.yoklamaAlan && (
              <p className="mt-0.5 text-xs text-zinc-400">
                Yoklama: {akademi.yoklamaTarihi} · {akademi.yoklamaAlan}
              </p>
            )}
          </div>
          {/* Akademi, başlangıç günü 1. gün yoklaması alınarak başlatılır; sonra günlük yoklama açılır. */}
          {yetkili &&
            !akademi.yoklama &&
            !yoklamaModu &&
            !akademi.iptal &&
            kayitlilar.length > 0 &&
            gecmisGunler.length > 0 && (
              <button
                onClick={() => yoklamaBaslat(ilkGun)}
                title="1. gün yoklaması alınarak akademi başlatılır"
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                <CalendarCheck className="h-4 w-4" />
                Akademiyi Başlat
              </button>
            )}
          {yetkili && duzenlenebilirMi(akademi) && (
            <div className="flex gap-2">
              <button
                onClick={() => setDuzenleAcik(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                <Pencil className="h-4 w-4" />
                Düzenle
              </button>
              <button
                onClick={() => setIptalOnay(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" />
                İptal Et
              </button>
            </div>
          )}
        </div>

        {iptalOnay && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {akademi.ad} iptal edilecek ve davet listelerinden kalkacak. Emin
            misiniz?
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setIptalOnay(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  donemIptal(akademi.id);
                  setIptalOnay(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                İptal Et
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Sayi label="Kontenjan" deger={akademi.kontenjan} />
          <Sayi label="Kayıtlı" deger={kayitliSayisi(akademi)} />
          <Sayi
            label="Katılan"
            deger={yoklamaAlindiMi(akademi) ? katilanSayisi(akademi) : "—"}
            renk="text-emerald-600"
          />
          <Sayi
            label="Gelmeyen"
            deger={yoklamaAlindiMi(akademi) ? gelmeyenSayisi(akademi) : "—"}
            renk="text-rose-600"
          />
        </div>
      </div>

      {/* Günlük yoklama: akademi başlatıldıktan sonra (1. gün dahil) her gün buradan alınır/düzenlenir. */}
      {!akademi.iptal && akademi.yoklama && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Günlük Yoklama
              </h3>
              <p className="text-xs text-zinc-400">
                {gecmisGunler.filter((g) => gunDurumu(g) === "alindi").length} /{" "}
                {gecmisGunler.length} günün yoklaması alındı · toplam{" "}
                {gunler.length} eğitim günü
              </p>
            </div>
            {yetkili && !yoklamaModu && gunDurumu(seciliGun) !== "gelecek" && (
              <button
                onClick={() => yoklamaBaslat(seciliGun)}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                <CalendarCheck className="h-4 w-4" />
                {gunDurumu(seciliGun) === "alindi"
                  ? `${gunNo(seciliGun)}. gün yoklamasını düzenle`
                  : `${gunNo(seciliGun)}. gün yoklamasını al`}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gunler.map((g) => {
              const d = gunDurumu(g);
              const secili = g === seciliGun;
              return (
                <button
                  key={g}
                  disabled={d === "gelecek" || yoklamaModu}
                  onClick={() => setSeciliGun(g)}
                  title={
                    d === "alindi"
                      ? "Yoklama alındı"
                      : d === "bekliyor"
                        ? "Yoklama bekliyor"
                        : "Henüz gelmedi"
                  }
                  className={`flex min-w-16 flex-col items-center rounded-lg border px-2 py-1.5 text-xs disabled:cursor-not-allowed ${
                    secili
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : d === "alindi"
                        ? "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        : d === "bekliyor"
                          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "border-dashed border-zinc-200 text-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-1 font-semibold">
                    {d === "alindi" && (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    )}
                    {gunNo(g)}. Gün
                  </span>
                  <span
                    className={
                      secili ? "text-zinc-300" : "text-[11px] opacity-70"
                    }
                  >
                    {g.slice(0, 5)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              placeholder="Ad soyad ara..."
              className="w-full outline-none placeholder:text-zinc-400"
            />
          </div>
          <select
            value={cinsiyet}
            onChange={(e) => setCinsiyet(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Tüm Cinsiyetler</option>
            <option value="Kadın">Kadın</option>
            <option value="Erkek">Erkek</option>
          </select>
          <select
            value={kulup}
            onChange={(e) => setKulup(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Tüm Kulüpler</option>
            {kulupler.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          {yoklamaModu ? (
            <button
              onClick={() =>
                setYoklamaTaslak(
                  Object.fromEntries(
                    yoklamaGirenler.map((a) => [a.id, "Geldi" as const]),
                  ),
                )
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Tümünü Geldi İşaretle
            </button>
          ) : (
            <button
              onClick={excelIndir}
              disabled={gorunenler.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Excel İndir
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                <th className="px-4 py-2.5">Ad Soyad</th>
                <th className="px-4 py-2.5">Eğitmen ID</th>
                <th className="px-4 py-2.5">Cinsiyet</th>
                <th className="px-4 py-2.5">Kulüp</th>
                <th className="px-4 py-2.5">Konaklama</th>
                <th className="px-4 py-2.5">Ayakkabı No</th>
                <th className="px-4 py-2.5">Beden (Üst / Alt)</th>
                <th className="px-4 py-2.5">
                  Yoklama
                  {akademi.yoklama || yoklamaModu
                    ? ` · ${gunNo(yoklamaGunu ?? seciliGun)}. gün`
                    : ""}
                </th>
                <th className="px-4 py-2.5">Devam</th>
              </tr>
            </thead>
            <tbody>
              {gorunenler.map((a, i) => {
                const y = yoklamaDegeri(a.id);
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-zinc-50 last:border-0 ${i % 2 === 1 ? "bg-zinc-50/50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/adaylar/${a.id}`}
                        className="font-medium text-zinc-900 hover:text-brand"
                      >
                        {a.ad} {a.soyad}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {a.themisId}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {a.cinsiyet ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{a.kulup}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {a.bmOnayliKonaklama === "Evet"
                        ? "Konaklayacak"
                        : a.bmOnayliKonaklama === "Hayır"
                          ? "Konaklamayacak"
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {a.ayakkabiNo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {a.ustBeden ?? "—"} / {a.altBeden ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {yoklamaModu && yoklamaGirenler.includes(a) ? (
                        <div className="flex gap-1.5">
                          {(["Geldi", "Gelmedi"] as const).map((deger) => (
                            <button
                              key={deger}
                              onClick={() =>
                                setYoklamaTaslak({
                                  ...yoklamaTaslak,
                                  [a.id]: deger,
                                })
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                y === deger
                                  ? deger === "Geldi"
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-rose-600 bg-rose-600 text-white"
                                  : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                              }`}
                            >
                              {deger}
                            </button>
                          ))}
                        </div>
                      ) : y ? (
                        <Badge
                          label={y}
                          tone={y === "Geldi" ? "green" : "red"}
                        />
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const { geldi, alinan } = devamDurumu(akademi, a.id);
                        if (!alinan)
                          return <span className="text-zinc-300">—</span>;
                        return (
                          <span
                            className={`font-semibold ${geldi < alinan ? "text-rose-600" : "text-zinc-700"}`}
                            title={`${alinan - geldi} gün gelmedi`}
                          >
                            {geldi}/{alinan} gün
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {gorunenler.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    {kayitlilar.length === 0
                      ? "Bu akademiye henüz aday kaydedilmedi."
                      : "Bu filtreyle eşleşen aday yok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {yoklamaModu && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
            <span className="text-sm text-zinc-500">
              {gunNo(yoklamaGunu ?? ilkGun)}. gün ({yoklamaGunu}) ·{" "}
              {Object.keys(yoklamaTaslak).length} / {yoklamaGirenler.length}{" "}
              aday işaretlendi
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setYoklamaTaslak(null);
                  setYoklamaGunu(null);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Vazgeç
              </button>
              <button
                onClick={yoklamaKaydetVeUygula}
                disabled={!yoklamaTamam}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {akademi.yoklama
                  ? "Yoklamayı Kaydet"
                  : "Yoklamayı Kaydet ve Başlat"}
              </button>
            </div>
          </div>
        )}
      </div>

      {duzenleAcik && (
        <AkademiDuzenleModal
          akademi={akademi}
          onClose={() => setDuzenleAcik(false)}
        />
      )}
    </div>
  );
}
