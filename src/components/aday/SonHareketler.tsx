"use client";

import { useState } from "react";
import { Award, Building2, ClipboardCheck, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { AdayEgitmen } from "@/lib/types";

type Kategori = "surec" | "sertifika" | "sozlesme";

type Hareket = {
  tarih: string;
  baslik: string;
  yapan: string;
  detay?: string;
  kategori: Kategori;
  // Onay bekleyen / reddedilen sertifika kayıtları için.
  durum?: "bekliyor" | "reddedildi";
  olumsuz?: boolean;
};

const IKON = { surec: ClipboardCheck, sertifika: Award, sozlesme: Building2 };

/** "DD.MM.YYYY" ya da "Bugün" → sıralama anahtarı. */
function zaman(tarih: string): number {
  if (tarih === "Bugün") return Date.now();
  const [g, a, y] = tarih.split(".").map(Number);
  return g && a && y ? new Date(y, a - 1, g).getTime() : 0;
}

const SOZLESME = /kulüp değiştir|sözleşme|fesih|işten çık/i;
const OLUMSUZ =
  /reddedildi|fesih|feshedildi|işten çık|katılmadı|gelmedi|sonlandırıldı/i;

/**
 * Eğitmenin tüm hareketleri tek akışta: süreç ve eğitmen işlemleri (işlem geçmişi) ile
 * sertifika kayıtları (kademe belgesi, gelişim semineri, temel eğitim). En yeni üstte.
 */
function hareketler(a: AdayEgitmen): Hareket[] {
  const durum = (k: { onaylandi: boolean; redSebebi?: string }) =>
    k.onaylandi
      ? undefined
      : k.redSebebi
        ? ("reddedildi" as const)
        : ("bekliyor" as const);
  const liste: Hareket[] = [
    ...a.aksiyonGecmisi.map((k) => ({
      tarih: k.tarih,
      baslik: k.aksiyon,
      yapan: k.yapan,
      detay: k.detay,
      kategori: (SOZLESME.test(k.aksiyon) ? "sozlesme" : "surec") as Kategori,
      olumsuz: OLUMSUZ.test(k.aksiyon),
    })),
    ...(a.sertifikalar ?? [])
      .filter((s) => s.yukleyen)
      .map((s) => ({
        tarih: s.belgeTarihi,
        baslik: `${s.brans} ${s.kademe}. kademe belgesi yüklendi`,
        yapan: s.yukleyen!,
        kategori: "sertifika" as const,
        durum: durum(s),
      })),
    ...(a.gelisimSeminerleri ?? []).map((s) => ({
      tarih: s.tarih,
      baslik: `${s.brans} gelişim semineri girildi`,
      yapan: s.yukleyen,
      detay: s.ad,
      kategori: "sertifika" as const,
      durum: durum(s),
    })),
    ...(a.temelEgitimSonuclari ?? []).map((t) => ({
      tarih: t.tarih,
      baslik: `${t.hedefKademe}. kademe temel eğitim sonucu: ${t.sonuc}`,
      yapan: t.yukleyen,
      detay: `${t.brans ?? "Fitness"} · sınav ${t.sinavTarihi}`,
      kategori: "sertifika" as const,
      durum: durum(t),
      olumsuz: t.sonuc !== "Geçti",
    })),
  ];
  // Onay bekleyen / reddedilen sertifika kayıtları akışa alınmaz (İK onaylayınca düşer).
  // Themis'e eklenmeden önceki tarihli belgeler (ör. başvurudan önce alınmış kademe belgesi)
  // Themis'te yapılmış bir hareket değildir; akışa alınmaz.
  const eklenme = zaman(a.basvuruTarihi);
  return liste
    .filter(
      (h) =>
        h.kategori !== "sertifika" || (zaman(h.tarih) >= eklenme && !h.durum),
    )
    .sort((x, y) => zaman(y.tarih) - zaman(x.tarih));
}

const ILK_GOSTERIM = 5;

/** Genel Bilgi'nin altında son hareketler akışı: son 5 hareket, gerisi "…" ile. */
export function SonHareketler({ aday }: { aday: AdayEgitmen }) {
  const [tumu, setTumu] = useState(false);
  const tum = hareketler(aday);
  // Yatay şerit: son 5 hareket soldan sağa eskiden yeniye; en yenisi en sağda.
  const son5 = tum.slice(0, ILK_GOSTERIM).reverse();
  const eski = tum.slice(ILK_GOSTERIM);
  const kirmizi = (h: Hareket) => h.olumsuz || h.durum === "reddedildi";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-lg font-semibold text-zinc-900">
        Son Hareketler
      </h3>

      {tum.length === 0 ? (
        <p className="text-sm text-zinc-400">Henüz hareket yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <ol className="flex min-w-[720px]">
            {eski.length > 0 && (
              // Daha eski hareketler: "⋯" ile altta açılır.
              <li className="relative flex w-14 shrink-0 flex-col items-center">
                <span className="absolute left-1/2 top-[15px] h-px w-full bg-zinc-200" />
                <button
                  onClick={() => setTumu(!tumu)}
                  title={
                    tumu ? "Daha az göster" : `${eski.length} hareket daha`
                  }
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <span className="mt-2 text-[11px] text-zinc-400">
                  +{eski.length}
                </span>
              </li>
            )}
            {son5.map((h, i) => {
              const Ikon = IKON[h.kategori];
              const enSon = i === son5.length - 1;
              return (
                <li
                  key={`${h.tarih}-${i}`}
                  className="relative flex flex-1 flex-col items-center px-2"
                >
                  {!enSon && (
                    <span className="absolute left-1/2 top-[15px] h-px w-full bg-zinc-200" />
                  )}
                  {i === 0 && eski.length > 0 && (
                    <span className="absolute right-1/2 top-[15px] h-px w-1/2 bg-zinc-200" />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                      kirmizi(h)
                        ? "bg-rose-50 text-rose-500"
                        : enSon
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <Ikon className="h-4 w-4" />
                  </span>
                  <span className="mt-2 text-xs font-medium text-zinc-400">
                    {h.tarih}
                  </span>
                  {/* Uzun cümleler 2 satırda kesilir; tamamı üzerine gelince görünür. */}
                  <span
                    className="mt-1 line-clamp-2 text-center text-sm font-medium text-zinc-900"
                    title={h.baslik}
                  >
                    {h.baslik}
                  </span>
                  {h.detay && (
                    <span
                      className="mt-0.5 line-clamp-1 text-center text-xs text-zinc-400"
                      title={h.detay}
                    >
                      {h.detay}
                    </span>
                  )}
                  <span className="mt-0.5 text-center text-xs text-zinc-500">
                    {h.yapan}
                  </span>
                  {h.durum === "bekliyor" && (
                    <span className="mt-1">
                      <Badge label="İK onayı bekliyor" tone="orange" />
                    </span>
                  )}
                  {h.durum === "reddedildi" && (
                    <span className="mt-1">
                      <Badge label="Reddedildi" tone="red" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {tumu && eski.length > 0 && (
        <div className="mt-5 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {eski.map((h, i) => (
            <div
              key={`${h.tarih}-${i}`}
              className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-sm"
            >
              <span className="text-xs text-zinc-400">{h.tarih}</span>
              <span
                className={`truncate ${kirmizi(h) ? "text-rose-600" : "text-zinc-800"}`}
              >
                {h.baslik}
                {h.detay && (
                  <span className="ml-1.5 text-xs text-zinc-400">
                    · {h.detay}
                  </span>
                )}
              </span>
              <span className="text-xs text-zinc-500">{h.yapan}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
