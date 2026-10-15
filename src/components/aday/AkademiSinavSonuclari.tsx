"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Download, History, Pencil, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SonucMetni } from "@/components/aday/BilgiTablosu";
import { bugun, tarihYaz } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import {
  type AkademiNihaisi,
  egitmeninAkademileri,
  GECME_PUANI,
  gectiMi,
} from "@/lib/akademiSinav";
import { basliklariGrupla } from "@/lib/akademiSinavExcel";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import type { AdayEgitmen, AkademiSinavSonucu } from "@/lib/types";

/** Puan hücresi: 70'in altındaki puanlar yalnızca kırmızı işaretlenir (PRD 9.1). */
export function SinavPuani({ puan }: { puan: number | null }) {
  if (puan === null) return <span className="text-zinc-300">—</span>;
  const kaldi = puan < GECME_PUANI;
  return (
    <span
      className={`inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-sm font-semibold ${
        kaldi ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {puan}
    </span>
  );
}

export function GenelSonucRozeti({
  sonuc,
}: {
  sonuc: AkademiSinavSonucu["genelSonuc"];
}) {
  return <Badge label={sonuc} tone={sonuc === "Geçti" ? "green" : "red"} />;
}

const girdi =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const ikincilButon =
  "flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50";

function Pencere({
  baslik,
  altBaslik,
  onClose,
  onKaydet,
  kaydedilebilir,
  children,
}: {
  baslik: string;
  altBaslik?: string;
  onClose: () => void;
  onKaydet: () => void;
  kaydedilebilir: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{baslik}</h2>
            {altBaslik && <p className="text-xs text-zinc-400">{altBaslik}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={onKaydet}
            disabled={!kaydedilebilir}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function Etiketli({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-600">
        {label}
        <span className="ml-0.5 text-rose-500">*</span>
      </span>
      {children}
    </label>
  );
}

/** Puan metni: 70+ yeşil, altı kırmızı. */
function Puan({ p }: { p: number | null | undefined }) {
  if (p === null || p === undefined)
    return <span className="text-zinc-300">—</span>;
  return (
    <span
      className={`font-semibold tabular-nums ${gectiMi(p) ? "text-emerald-700" : "text-rose-600"}`}
    >
      {p}
    </span>
  );
}

function raporIndir(
  aday: AdayEgitmen,
  nihai: AkademiNihaisi,
  akademiAdi: string,
) {
  const sinavlar = nihai.denemeler.map((d) => d.sinavNo);
  const kimlik = [aday.themisId, `${aday.ad} ${aday.soyad}`, akademiAdi];
  const satirlar = [
    [
      "Eğitmen ID",
      "Ad Soyad",
      "Akademi",
      "Grup",
      "Ders",
      ...sinavlar.map((n) => `${n}. Sınav`),
      "Sonuç",
    ],
    ...nihai.dersler.map((d) => [
      ...kimlik,
      d.baslik.grup,
      d.baslik.ad,
      ...sinavlar.map((n) => String(d.puanlar[n] ?? "")),
      d.nihai === null ? "" : gectiMi(d.nihai) ? "Geçti" : "Kaldı",
    ]),
    [
      ...kimlik,
      "GENEL SONUÇ",
      "",
      ...sinavlar.map(() => ""),
      nihai.genelSonuc ?? "",
    ],
  ];
  const csv = satirlar
    .map((s) => s.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sinav-sonucu-${aday.themisId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export type Duzeltme = { sonuc: AkademiSinavSonucu; indeks: number };

/**
 * Eğitmen profilindeki Akademi Sınav Sonuçları (PRD 9.1). Her akademide en fazla 3 sınav: 2. ve 3.
 * sınava yalnızca kalınan derslerden girilir. Genel sonuç Fitness Teorik + Uygulama derslerinin
 * hepsi 70+ ise "Geçti"; GX dersleri genel sonucu etkilemez, ders verme yetkinliğini belirler.
 * İK / Sistem Yöneticisi puanı düzeltebilir ve GX tekrar sınavı ekleyebilir.
 */
export function AkademiSinavSonuclari({ aday }: { aday: AdayEgitmen }) {
  const { currentUser } = useCurrentUser();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari, puanDuzelt } = useAkademiSinavSonuclari();
  const yetkili = ikYetkisiVarMi(currentUser.rol);
  const yapan = `${currentUser.ad} (${currentUser.rol})`;
  const bugunStr = tarihYaz(bugun());
  const [duzeltme, setDuzeltme] = useState<Duzeltme | null>(null);

  const tarihSirasi = (n: AkademiNihaisi) =>
    n.denemeler[0]?.yuklemeTarihi.split(".").reverse().join("") ?? "";
  const akademiler = egitmeninAkademileri(sinavSonuclari, aday.id).sort(
    (x, y) => tarihSirasi(y.nihai).localeCompare(tarihSirasi(x.nihai)),
  );
  const akademiAdi = (d: AkademiSinavSonucu) => {
    const akademi = donemler.find((x) => x.id === d.akademiDonemiId);
    return akademi
      ? `${akademi.ad} (${akademi.baslangicTarihi} – ${akademi.bitisTarihi})`
      : "Akademi";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Akademi Sınav Sonuçları
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            3 sınav hakkı · genel sonuç: Fitness Teorik ve Uygulama derslerinin
            hepsi {GECME_PUANI}+
          </p>
        </div>

        {akademiler.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
            <ClipboardList className="h-4 w-4 shrink-0" />
            Henüz sınav sonucu yok. Sonuçlar Toplu İşlemler → Toplu Akademi
            Sınav Sonucu Gir ekranından Excel ile yüklenir.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {akademiler.map(({ anahtar, nihai }) => {
              const ad = akademiAdi(nihai.denemeler[0]);
              const sinavNolari = nihai.denemeler.map((d) => d.sinavNo);
              const son = nihai.denemeler.at(-1);
              // Grup adı yalnızca grubun ilk satırında yazılır (rowSpan).
              const gruplar = basliklariGrupla(
                nihai.dersler.map((d) => d.baslik),
              );
              const satirGruplari = gruplar.map((g, k) => {
                const bas = gruplar.slice(0, k).reduce((t, x) => t + x.adet, 0);
                return {
                  ...g,
                  dersler: nihai.dersler.slice(bas, bas + g.adet),
                };
              });
              return (
                <div key={anahtar}>
                  <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {ad}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {sinavNolari.length}/3 sınav · son yükleme{" "}
                        {son?.yuklemeTarihi} · {son?.yukleyen}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {nihai.genelSonuc && (
                        <span
                          className={`text-sm font-semibold ${
                            nihai.genelSonuc === "Geçti"
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          Genel sonuç: {nihai.genelSonuc}
                        </span>
                      )}
                      <button
                        onClick={() => raporIndir(aday, nihai, ad)}
                        className={ikincilButon}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Rapor
                      </button>
                    </div>
                  </div>
                  {nihai.sonrakiSinavNo && (
                    <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {nihai.sonrakiSinavNo}. sınav hakkı var · girilecek
                      dersler:{" "}
                      {nihai.kalinanDersler.map((b) => b.ad).join(", ")}
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                        <th className="w-44 py-2 pr-4 font-medium">Grup</th>
                        <th className="px-3 py-2 font-medium">Ders</th>
                        {sinavNolari.map((n) => (
                          <th
                            key={n}
                            className="w-24 px-3 py-2 text-right font-medium"
                          >
                            {n}. Sınav
                          </th>
                        ))}
                        <th className="w-24 px-3 py-2 text-right font-medium">
                          Sonuç
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {satirGruplari.flatMap((g) =>
                        g.dersler.map((d, j) => (
                          <tr
                            key={`${g.grup}-${d.baslik.ad}`}
                            className={
                              j === g.adet - 1 ? "border-b border-zinc-200" : ""
                            }
                          >
                            {j === 0 && (
                              <td
                                rowSpan={g.adet}
                                className="py-2 pr-4 align-top text-xs font-medium uppercase tracking-wide text-zinc-500"
                              >
                                {g.grup}
                              </td>
                            )}
                            <td className="px-3 py-2 text-zinc-700">
                              {d.baslik.ad}
                            </td>
                            {nihai.denemeler.map((den) => {
                              const i = den.basliklar.findIndex(
                                (b) =>
                                  b.grup === d.baslik.grup &&
                                  b.ad === d.baslik.ad,
                              );
                              const p = i >= 0 ? den.puanlar[i] : null;
                              const izler = (den.duzeltmeler ?? []).filter(
                                (z) => z.baslikIndeksi === i,
                              );
                              return (
                                <td
                                  key={den.id}
                                  className="group/hucre px-3 py-2 text-right"
                                >
                                  <span className="inline-flex items-center justify-end gap-1.5">
                                    {izler.length > 0 && (
                                      <span
                                        title={izler
                                          .map(
                                            (z) =>
                                              `${z.tarih} · ${z.yapan}: ${z.eski ?? "—"} → ${z.yeni ?? "—"} (${z.aciklama})`,
                                          )
                                          .join("\n")}
                                      >
                                        <History className="h-3.5 w-3.5 text-amber-500" />
                                      </span>
                                    )}
                                    <Puan p={p} />
                                    {yetkili &&
                                      i >= 0 &&
                                      (p !== null || den.sinavNo === 1) && (
                                        <button
                                          onClick={() =>
                                            setDuzeltme({
                                              sonuc: den,
                                              indeks: i,
                                            })
                                          }
                                          title="Puanı düzelt"
                                          className="rounded p-0.5 text-zinc-300 opacity-0 hover:text-zinc-600 group-hover/hucre:opacity-100"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                      )}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-right">
                              {d.nihai === null ? (
                                <span className="text-zinc-300">—</span>
                              ) : (
                                <SonucMetni
                                  label={gectiMi(d.nihai) ? "Geçti" : "Kaldı"}
                                  olumlu={gectiMi(d.nihai)}
                                />
                              )}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {duzeltme && (
        <DuzeltmeFormu
          duzeltme={duzeltme}
          onClose={() => setDuzeltme(null)}
          onKaydet={(yeni, aciklama) => {
            puanDuzelt(
              duzeltme.sonuc.id,
              duzeltme.indeks,
              yeni,
              aciklama,
              yapan,
              bugunStr,
            );
            setDuzeltme(null);
          }}
        />
      )}
    </div>
  );
}

/** İK / Sistem Yöneticisi puan düzeltme penceresi (profil ve akademi sınav tablosu). */
export function DuzeltmeFormu({
  duzeltme,
  onClose,
  onKaydet,
}: {
  duzeltme: Duzeltme;
  onClose: () => void;
  onKaydet: (yeni: number | null, aciklama: string) => void;
}) {
  const { sonuc, indeks } = duzeltme;
  const eski = sonuc.puanlar[indeks];
  const [deger, setDeger] = useState(eski === null ? "" : String(eski));
  const [aciklama, setAciklama] = useState("");
  const sayi = deger.trim() === "" ? null : Number(deger);
  const gecerli =
    sayi === null || (!Number.isNaN(sayi) && sayi >= 0 && sayi <= 100);
  return (
    <Pencere
      baslik="Puanı düzelt"
      altBaslik={`${sonuc.basliklar[indeks].grup} · ${sonuc.basliklar[indeks].ad} · ${sonuc.sinavNo}. sınav`}
      onClose={onClose}
      onKaydet={() => onKaydet(sayi, aciklama.trim())}
      kaydedilebilir={gecerli && sayi !== eski && !!aciklama.trim()}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-600">Mevcut puan</div>
          <div className="mt-2 text-base">
            <Puan p={eski} />
          </div>
        </div>
        <Etiketli label="Yeni puan">
          <input
            type="number"
            min={0}
            max={100}
            value={deger}
            onChange={(e) => setDeger(e.target.value)}
            className={girdi}
          />
        </Etiketli>
      </div>
      <Etiketli label="Açıklama">
        <textarea
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Düzeltme nedeni (ör. sınav kâğıdı yeniden değerlendirildi)"
          className={girdi}
        />
      </Etiketli>
      <p className="text-xs text-zinc-400">
        Genel sonuç ve adayın süreç durumu yeni puana göre yeniden hesaplanır;
        değişiklik kayıt altına alınır.
      </p>
    </Pencere>
  );
}
