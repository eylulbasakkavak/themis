"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import {
  donemEtiketi,
  donemSecenekleriUret,
  guncelDonemMi,
  METRIK_LIMIT_ALANLARI,
  oncekiDonem,
  type MetrikLimitAlani,
} from "@/lib/karne";
import { useKarneler } from "@/lib/KarnelerContext";
import type { MetrikLimitleri } from "@/lib/types";

type Taslak = Record<MetrikLimitAlani, number>;

function taslakOlustur(
  limit: MetrikLimitleri | undefined,
  oncekiLimit: MetrikLimitleri | undefined
): Taslak {
  const kaynak = limit ?? oncekiLimit;
  const t = {} as Taslak;
  METRIK_LIMIT_ALANLARI.forEach(({ alan }) => {
    t[alan] = kaynak?.[alan] ?? 0;
  });
  return t;
}

export default function MetrikLimitleriPage() {
  const { currentUser } = useCurrentUser();
  const { metrikLimitleri, limitKaydet, aktifDonem } = useKarneler();
  const [kaydedildiMesaji, setKaydedildiMesaji] = useState<string | null>(null);

  const [donem, setDonem] = useState(aktifDonem);
  const donemSecenekleri = useMemo(() => donemSecenekleriUret(aktifDonem), [aktifDonem]);
  const mevcutLimit = metrikLimitleri.find((l) => l.donem === donem);
  const oncekiLimit = metrikLimitleri.find((l) => l.donem === oncekiDonem(donem));
  const saltOkunur = !guncelDonemMi(donem, aktifDonem);
  const [taslak, setTaslak] = useState<Taslak>(() => taslakOlustur(mevcutLimit, oncekiLimit));

  const donemDegistir = (yeniDonem: string) => {
    setDonem(yeniDonem);
    setKaydedildiMesaji(null);
    const mevcut = metrikLimitleri.find((l) => l.donem === yeniDonem);
    const onceki = metrikLimitleri.find((l) => l.donem === oncekiDonem(yeniDonem));
    setTaslak(taslakOlustur(mevcut, onceki));
  };

  const alanDegistir = (alan: MetrikLimitAlani, deger: string) => {
    setTaslak((t) => ({ ...t, [alan]: Number(deger) || 0 }));
  };

  const kaydet = () => {
    if (saltOkunur) return;
    const yeni: MetrikLimitleri = {
      id: `l-${donem}`,
      donem,
      ...taslak,
      girisTarihi: "Bugün",
      giren: `${currentUser.ad} (${currentUser.rol})`,
    };
    limitKaydet(yeni);
    setKaydedildiMesaji(`${donemEtiketi(donem)} dönemi için metrik limitleri kaydedildi.`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Dönem Sonu Metrik Limitleri (Threshold)
        </h1>
        <p className="text-xs text-zinc-400">
          Her metrik için, o metrikte 100 puana denk gelecek üst sınırı gir. Bu sınıra ulaşan/aşan
          eğitmen o metrikte 100 puan almış sayılır. Yılda 2 dönem vardır; sadece şu an içinde
          bulunduğumuz dönemde değişiklik yapılabilir, geçmiş dönemlerin verisi salt
          görüntülenebilir.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-zinc-600" htmlFor="limitDonem">
            Dönem
          </label>
          <select
            id="limitDonem"
            value={donem}
            onChange={(e) => donemDegistir(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
          >
            {donemSecenekleri.map((d) => (
              <option key={d} value={d}>
                {donemEtiketi(d)}
                {guncelDonemMi(d, aktifDonem) ? " (güncel)" : ""}
              </option>
            ))}
          </select>
          {mevcutLimit && (
            <span className="text-xs text-zinc-400">
              Bu dönem için daha önce {mevcutLimit.girisTarihi} tarihinde {mevcutLimit.giren}{" "}
              tarafından girildi.
            </span>
          )}
        </div>

        {saltOkunur && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            Bu dönem geçmişte kaldığı için salt görüntülenebilir; değişiklik yalnızca güncel dönemde
            ({donemEtiketi(aktifDonem)}) yapılabilir.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {METRIK_LIMIT_ALANLARI.map(({ alan, label }) => (
            <div key={alan}>
              <label className="text-xs text-zinc-400" htmlFor={`limit-${alan}`}>
                {label}
              </label>
              <input
                id={`limit-${alan}`}
                type="number"
                min={0}
                disabled={saltOkunur}
                value={taslak[alan]}
                onChange={(e) => alanDegistir(alan, e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-zinc-50 disabled:text-zinc-400"
              />
            </div>
          ))}
        </div>

        {!saltOkunur && (
          <div className="flex items-center justify-between gap-3">
            {kaydedildiMesaji ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {kaydedildiMesaji}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={kaydet}
              className="self-end rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
