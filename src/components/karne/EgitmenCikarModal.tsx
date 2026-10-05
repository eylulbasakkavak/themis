"use client";

import { useMemo, useState } from "react";
import { Search, UserMinus, X } from "lucide-react";
import { donemEtiketi, IZIN_SEBEPLERI, sonrakiDonem } from "@/lib/karne";
import type { AdayEgitmen, KarneHaricKaydi } from "@/lib/types";

export function EgitmenCikarModal({
  adaylar,
  mevcutKayit,
  aktifDonem,
  onKaydet,
  onClose,
}: {
  adaylar: AdayEgitmen[];
  mevcutKayit?: KarneHaricKaydi;
  aktifDonem: string;
  onKaydet: (veri: { egitmenId: string; sebep: string; suresiz: boolean; hedefDonem: string }) => void;
  onClose: () => void;
}) {
  const donemSecenekleri = useMemo(() => {
    const secenekler = [aktifDonem];
    for (let i = 0; i < 5; i++) {
      secenekler.push(sonrakiDonem(secenekler[secenekler.length - 1]));
    }
    return secenekler;
  }, [aktifDonem]);

  const [secilenId, setSecilenId] = useState(mevcutKayit?.egitmenId ?? "");
  const [arama, setArama] = useState("");
  const [sebep, setSebep] = useState(
    mevcutKayit && IZIN_SEBEPLERI.includes(mevcutKayit.sebep) ? mevcutKayit.sebep : IZIN_SEBEPLERI[0]
  );
  const [digerSebep, setDigerSebep] = useState(
    mevcutKayit && !IZIN_SEBEPLERI.includes(mevcutKayit.sebep) ? mevcutKayit.sebep : ""
  );
  const [suresiz, setSuresiz] = useState(mevcutKayit ? mevcutKayit.suresiz : true);
  const [hedefDonem, setHedefDonem] = useState(mevcutKayit?.donem ?? aktifDonem);

  const secilenAday = adaylar.find((a) => a.id === secilenId);

  const sonuclar = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const havuz = !q
      ? adaylar
      : adaylar.filter((a) =>
          `${a.ad} ${a.soyad} ${a.id}`.toLocaleLowerCase("tr").includes(q)
        );
    return havuz.slice(0, 8);
  }, [arama, adaylar]);

  const kaydet = () => {
    if (!secilenId) return;
    const sebepMetni = sebep === "Diğer" ? digerSebep.trim() || "Diğer" : sebep;
    onKaydet({ egitmenId: secilenId, sebep: sebepMetni, suresiz, hedefDonem });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900">
              {mevcutKayit ? "Kaydı Düzenle" : "Eğitmeni Karneden Çıkar"}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {secilenAday ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  {secilenAday.ad} {secilenAday.soyad}
                </div>
                <div className="text-xs text-zinc-400">{secilenAday.kulup}</div>
              </div>
              <button
                onClick={() => {
                  setSecilenId("");
                  setArama("");
                }}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Değiştir
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-600">
                Eğitmen Ara<span className="ml-0.5 text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  autoFocus
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder="İsim veya eğitmen ID ile ara..."
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-100">
                {sonuclar.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-zinc-400">
                    Eşleşen eğitmen yok.
                  </p>
                )}
                {sonuclar.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSecilenId(a.id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-zinc-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-zinc-50"
                  >
                    <span className="font-medium text-zinc-800">
                      {a.ad} {a.soyad}
                    </span>
                    <span className="text-xs text-zinc-400">{a.kulup}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {secilenId && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Sebep</label>
                <select
                  value={sebep}
                  onChange={(e) => setSebep(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {IZIN_SEBEPLERI.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {sebep === "Diğer" && (
                <input
                  value={digerSebep}
                  onChange={(e) => setDigerSebep(e.target.value)}
                  placeholder="Sebep açıklaması"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Çıkartılacak Dönem
                </label>
                <select
                  value={hedefDonem}
                  onChange={(e) => setHedefDonem(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {donemSecenekleri.map((d) => (
                    <option key={d} value={d}>
                      {donemEtiketi(d)}
                      {d === aktifDonem ? " (güncel)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={suresiz}
                  onChange={(e) => setSuresiz(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <span>
                  Devam eden süreçte çıkarma devam etsin mi? (işaretlenmezse sadece{" "}
                  {donemEtiketi(hedefDonem)} için geçerli olur)
                </span>
              </label>
              <p className="text-xs text-zinc-400">
                {suresiz
                  ? "Eğitmen, elle \"Geri Dahil Et\" yapılana kadar tüm dönemlerde karneden çıkarılmış kalır."
                  : `Eğitmen sadece ${donemEtiketi(hedefDonem)} için karneden çıkarılır.`}
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
          >
            Vazgeç
          </button>
          <button
            onClick={kaydet}
            disabled={!secilenId}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mevcutKayit ? "Güncelle" : "Karneden Çıkar"}
          </button>
        </div>
      </div>
    </div>
  );
}
