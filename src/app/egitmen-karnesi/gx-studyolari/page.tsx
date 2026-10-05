"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Lock } from "lucide-react";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import {
  donemEtiketi,
  donemIlkAyindaMiyiz,
  donemSecenekleriUret,
  guncelDonemMi,
} from "@/lib/karne";
import { useKarneler } from "@/lib/KarnelerContext";
import { KULUPLER } from "@/lib/kulupler";

function ornekGxSayisiUret(): number {
  return 2 + Math.floor(Math.random() * 7);
}

export default function GxStudyolariPage() {
  const { currentUser } = useCurrentUser();
  const { kulupStudyoSayilari, kulupStudyoKaydet, aktifDonem } = useKarneler();

  const [donem, setDonem] = useState(aktifDonem);
  const donemSecenekleri = useMemo(() => donemSecenekleriUret(aktifDonem), [aktifDonem]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const duzenlenebilir = guncelDonemMi(donem, aktifDonem) && donemIlkAyindaMiyiz(donem);

  const kayitlar = useMemo(
    () =>
      KULUPLER.map((kulup) => ({
        kulup,
        kayit: kulupStudyoSayilari.find((k) => k.kulup === kulup && k.donem === donem),
      })),
    [kulupStudyoSayilari, donem]
  );

  const exceldenYukle = () => {
    if (!duzenlenebilir) return;
    setYukleniyor(true);
    setTimeout(() => {
      KULUPLER.forEach((kulup) => {
        kulupStudyoKaydet({
          id: `ks-${kulup}-${donem}`,
          kulup,
          donem,
          gxSayisi: ornekGxSayisiUret(),
          girisTarihi: "Bugün",
          giren: `${currentUser.ad} (${currentUser.rol}) — Excel toplu yükleme`,
        });
      });
      setYukleniyor(false);
      setMesaj(
        `${KULUPLER.length} kulüp için ${donemEtiketi(donem)} GX stüdyo sayıları Excel'den yüklendi.`
      );
    }, 500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">GX Stüdyo Sayıları</h1>
        <p className="text-xs text-zinc-400">
          Kulüplerin GX Stüdyo sayıları Excel ile toplu yüklenir, tüm kulüpler otomatik listelenir.
          Yılda 2 dönem vardır; sayılar sadece dönemin ilk ayında güncellenebilir, sonrasında salt
          görüntülenebilir.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="studyoDonem">
              Dönem
            </label>
            <select
              id="studyoDonem"
              value={donem}
              onChange={(e) => {
                setDonem(e.target.value);
                setMesaj(null);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              {donemSecenekleri.map((d) => (
                <option key={d} value={d}>
                  {donemEtiketi(d)}
                  {guncelDonemMi(d, aktifDonem) ? " (güncel)" : ""}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={dosyaInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) exceldenYukle();
              e.target.value = "";
            }}
          />
          <button
            onClick={() => dosyaInputRef.current?.click()}
            disabled={!duzenlenebilir || yukleniyor}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {yukleniyor ? "Yükleniyor..." : "Excel'den Yükle"}
          </button>
        </div>

        {!duzenlenebilir && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            {guncelDonemMi(donem, aktifDonem)
              ? `GX stüdyo sayıları sadece ${donemEtiketi(donem)} döneminin ilk ayında güncellenebilir; şu an düzenlemeye kapalı.`
              : "Bu dönem geçmişte kaldığı için salt görüntülenebilir."}
          </div>
        )}

        {mesaj && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {mesaj}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                <th className="px-4 py-2.5">Kulüp</th>
                <th className="px-4 py-2.5">GX Sayısı</th>
                <th className="px-4 py-2.5">Giren</th>
                <th className="px-4 py-2.5">Giriş Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map(({ kulup, kayit }, i) => (
                <tr
                  key={kulup}
                  className={`border-b border-zinc-50 last:border-0 ${
                    i % 2 === 1 ? "bg-zinc-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-black">{kulup}</td>
                  <td className="px-4 py-3 text-zinc-600">{kayit?.gxSayisi ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{kayit?.giren ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{kayit?.girisTarihi ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
