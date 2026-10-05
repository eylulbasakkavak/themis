"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Pin, Search, X } from "lucide-react";
import { LIG_SIRASI, LIG_TONU, SABITLEME_SEBEPLERI, type SabitlemeSebebi } from "@/lib/karne";
import { toneTextClasses } from "@/lib/status";
import type { AdayEgitmen, EgitmenLig, KarneSabitlemeKaydi } from "@/lib/types";

function sabitlemeSebebiMi(deger: string): deger is SabitlemeSebebi {
  return (SABITLEME_SEBEPLERI as readonly string[]).includes(deger);
}

export function LigSabitleModal({
  adaylar,
  mevcutKayit,
  ligHesapla,
  onKaydet,
  onClose,
}: {
  adaylar: AdayEgitmen[];
  mevcutKayit?: KarneSabitlemeKaydi;
  ligHesapla: (egitmenId: string) => EgitmenLig | null;
  onKaydet: (veri: { egitmenId: string; lig: EgitmenLig; sebep: string }) => void;
  onClose: () => void;
}) {
  const mevcutSebep: SabitlemeSebebi =
    mevcutKayit && sabitlemeSebebiMi(mevcutKayit.sebep) ? mevcutKayit.sebep : "Diğer";

  const [secilenId, setSecilenId] = useState(mevcutKayit?.egitmenId ?? "");
  const [arama, setArama] = useState("");
  const [sebep, setSebep] = useState<SabitlemeSebebi>(mevcutSebep);
  const [ekAciklama, setEkAciklama] = useState(
    mevcutKayit && mevcutSebep === "Diğer" && !sabitlemeSebebiMi(mevcutKayit.sebep)
      ? mevcutKayit.sebep
      : ""
  );
  const [lig, setLig] = useState<EgitmenLig>(mevcutKayit?.lig ?? "Silver");

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

  const guncelLig = secilenId ? ligHesapla(secilenId) : null;

  const secEt = (id: string) => {
    setSecilenId(id);
    setArama("");
    if (!mevcutKayit) {
      setLig(sebep === "Fraud" ? "Silver" : ligHesapla(id) ?? "Silver");
    }
  };

  const sebepDegistir = (yeni: SabitlemeSebebi) => {
    setSebep(yeni);
    if (yeni === "Fraud") {
      setLig("Silver");
    } else if (secilenId) {
      const oneri = ligHesapla(secilenId);
      if (oneri) setLig(oneri);
    }
  };

  const kaydet = () => {
    if (!secilenId) return;
    const sebepMetni = sebep === "Diğer" && ekAciklama.trim() ? ekAciklama.trim() : sebep;
    onKaydet({ egitmenId: secilenId, lig, sebep: sebepMetni });
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
            <Pin className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900">
              {mevcutKayit ? "Sabitleme Kaydını Düzenle" : "Eğitmenin Ligini Sabitle"}
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
                    onClick={() => secEt(a.id)}
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
                  onChange={(e) => sebepDegistir(e.target.value as SabitlemeSebebi)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {SABITLEME_SEBEPLERI.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {sebep === "Diğer" && (
                <input
                  value={ekAciklama}
                  onChange={(e) => setEkAciklama(e.target.value)}
                  placeholder="Sebep açıklaması (isteğe bağlı)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              )}

              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-zinc-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="font-medium leading-relaxed">
                  {guncelLig ? (
                    <>
                      Geçmiş dönem ligi{" "}
                      <span className={`font-semibold ${toneTextClasses[LIG_TONU[guncelLig]]}`}>
                        {guncelLig}
                      </span>
                      , şu an{" "}
                      <span className={`font-semibold ${toneTextClasses[LIG_TONU[lig]]}`}>
                        {lig}
                      </span>{" "}
                      ligine sabitlensin mi?
                    </>
                  ) : (
                    <>
                      Bu eğitmen şu an{" "}
                      <span className={`font-semibold ${toneTextClasses[LIG_TONU[lig]]}`}>
                        {lig}
                      </span>{" "}
                      ligine sabitlensin mi?
                    </>
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Sabitlenecek Lig<span className="ml-0.5 text-rose-500">*</span>
                </label>
                <select
                  value={lig}
                  disabled={sebep === "Fraud"}
                  onChange={(e) => setLig(e.target.value as EgitmenLig)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  {(sebep === "Fraud" ? (["Silver"] as const) : LIG_SIRASI).map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-400">
                  {sebep === "Fraud"
                    ? "Fraud sebebiyle lig her zaman Silver olarak sabitlenir."
                    : "Varsayılan olarak eğitmenin güncel ligi önerildi, gerekirse değiştirebilirsin."}
                </p>
              </div>
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
            {mevcutKayit ? "Güncelle" : "Ligi Sabitle"}
          </button>
        </div>
      </div>
    </div>
  );
}
