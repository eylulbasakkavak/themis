"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useAdaylar } from "@/lib/AdaylarContext";
import { bugun, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import {
  aktifSertifikalar,
  VIZE_DURUMU_BILGI,
  vizeAciklamasi,
  vizeDurumu,
  vizeKalanGun,
  vizeRozetMetni,
} from "@/lib/sertifika";
import { vizeOnayla } from "@/lib/sertifikaOnay";
import type { AdayEgitmen, EgitmenSertifikasi, SertifikaVizesi } from "@/lib/types";

type Satir = { aday: AdayEgitmen; sertifika: EgitmenSertifikasi; bekleyenVize?: SertifikaVizesi };

type Filtre = "hepsi" | "gecmis" | "yaklasiyor";

/**
 * Toplu vizeletme (gelişim semineri): Eğitmenler ekranıyla aynı kuralla (PRD 12.5) vizesi
 * geçmiş ya da 30 gün içinde bitecek sertifikalar listelenir; seminer katılım Excel'i
 * yüklendiğinde vize kayıtları toplu eklenir. KM'nin yüklediği kayıtlar İK onayına düşer.
 */
export default function TopluVizeletmePage() {
  const { adaylar, setAdaylar } = useAdaylar();
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const ik = ikYetkisiVarMi(currentUser.rol);

  const satirlar = useMemo(() => {
    const liste: Satir[] = [];
    for (const aday of adaylar) {
      if (aday.surecDurumu !== "egitmen") continue;
      for (const s of aktifSertifikalar(aday)) {
        const d = vizeDurumu(s);
        if (d !== "gecmis" && d !== "yaklasiyor") continue;
        liste.push({
          aday,
          sertifika: s,
          bekleyenVize: s.vizeler?.find((v) => !v.onaylandi && !v.redSebebi),
        });
      }
    }
    // En acil olan en üstte: vizesi en önce dolmuş olan.
    return liste.sort(
      (x, y) => (vizeKalanGun(x.sertifika) ?? 0) - (vizeKalanGun(y.sertifika) ?? 0)
    );
  }, [adaylar]);

  const sayilar = {
    gecmis: satirlar.filter((s) => vizeDurumu(s.sertifika) === "gecmis").length,
    yaklasiyor: satirlar.filter((s) => vizeDurumu(s.sertifika) === "yaklasiyor").length,
  };
  const gorunenler =
    filtre === "hepsi" ? satirlar : satirlar.filter((s) => vizeDurumu(s.sertifika) === filtre);
  const islenecekler = gorunenler.filter((s) => !s.bekleyenVize);

  const exceldenYukle = () => {
    if (islenecekler.length === 0) return;
    setYukleniyor(true);
    setTimeout(() => {
      const tarih = tarihYaz(bugun());
      const yil = bugun().getFullYear();
      const donem = `${yil}-${yil + 1} Sezonu`;
      const bitis = tarihYaz(new Date(yil + 1, 8, 30));
      const yapan = `${currentUser.ad} (${currentUser.rol})`;
      const hedef = new Map<string, string[]>(); // aday id → sertifika id'leri
      for (const s of islenecekler) {
        hedef.set(s.aday.id, [...(hedef.get(s.aday.id) ?? []), s.sertifika.id]);
      }
      setAdaylar((prev) =>
        prev.map((a) => {
          const sertifikaIdleri = hedef.get(a.id);
          if (!sertifikaIdleri) return a;
          let guncel: AdayEgitmen = {
            ...a,
            sertifikalar: (a.sertifikalar ?? []).map((s) =>
              sertifikaIdleri.includes(s.id)
                ? {
                    ...s,
                    vizeler: [
                      ...(s.vizeler ?? []),
                      {
                        id: `v-toplu-${s.id}-${Date.now()}`,
                        donem,
                        bitisTarihi: bitis,
                        belge: {
                          ad: `Gelişim Semineri Katılım Belgesi ${yil}.pdf`,
                          durum: "yuklendi",
                          tarih,
                        },
                        onaylandi: false,
                        yukleyen: `${yapan} — Excel toplu vizeletme`,
                        tarih,
                      },
                    ],
                  }
                : s
            ),
          };
          // İK'nın yüklediği vize doğrudan onaylıdır; uyarı hemen kalkar.
          if (ik) {
            for (const s of guncel.sertifikalar ?? []) {
              const yeni = s.vizeler?.find((v) => v.id.startsWith("v-toplu-") && !v.onaylandi);
              if (yeni) guncel = vizeOnayla(guncel, s.id, yeni.id);
            }
          }
          return guncel;
        })
      );
      if (!ik) {
        bildirimEkle({
          aliciRol: "İK",
          aliciAd: KULLANICILAR["İK"].ad,
          baslik: `${islenecekler.length} vize kaydı onay bekliyor (toplu vizeletme)`,
          mesaj: "Gelişim semineri Excel'i ile yüklenen vize belgeleri incelemenizi bekliyor.",
          planlayan: yapan,
          tarih,
          link: "/onay-bekleyenler",
        });
      }
      setMesaj(
        `${islenecekler.length} sertifika için ${donem} vizesi eklendi${
          ik ? " ve onaylandı; uyarılar kalktı." : ", İK onayına gönderildi."
        }`
      );
      setYukleniyor(false);
    }, 400);
  };

  const filtreButonu = (deger: Filtre, label: string, sayi: number, renk: string) => (
    <button
      key={deger}
      onClick={() => setFiltre(deger)}
      aria-pressed={filtre === deger}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${
        filtre === deger
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {renk && <span className={`h-2 w-2 rounded-full ${renk}`} />}
      {label}
      <span className="opacity-60">{sayi}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/toplu-islemler"
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Toplu İşlemler
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Toplu Vizeletme (Gelişim Semineri)</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vizesi geçmiş ya da 30 gün içinde bitecek sertifikalar aşağıda listelenir (Eğitmenler
          ekranındaki uyarılarla aynı). Gelişim semineri katılım Excel&apos;i yüklendiğinde
          listelenen sertifikalara yeni sezon vizesi eklenir.
        </p>
      </div>

      {mesaj && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {mesaj}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          type="button"
          onClick={() => dosyaInputRef.current?.click()}
          disabled={yukleniyor || islenecekler.length === 0}
          className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <FileSpreadsheet className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-zinc-800">
            {yukleniyor ? "Yükleniyor..." : "Seminer katılım Excel'ini seçmek için tıklayın"}
          </span>
          <span className="text-xs text-zinc-400">
            .xlsx, .xls veya .csv · listede görünen {islenecekler.length} sertifikaya vize eklenir
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Vize Uyarısı Olan Sertifikalar</h2>
          <div className="flex flex-wrap gap-2">
            {filtreButonu("hepsi", "Tümü", satirlar.length, "")}
            {filtreButonu("gecmis", "Vizesi Geçmiş", sayilar.gecmis, "bg-rose-600")}
            {filtreButonu(
              "yaklasiyor",
              "30 Gün İçinde Bitecek",
              sayilar.yaklasiyor,
              "bg-amber-500"
            )}
          </div>
        </div>

        {gorunenler.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-zinc-400">
            Vize uyarısı olan sertifika bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400">
                  <th className="px-4 py-2.5">Eğitmen ID</th>
                  <th className="px-4 py-2.5">Ad Soyad</th>
                  <th className="px-4 py-2.5">Kulüp</th>
                  <th className="px-4 py-2.5">Sertifika</th>
                  <th className="px-4 py-2.5">Vize Dönemi</th>
                  <th className="px-4 py-2.5">Vize Durumu</th>
                </tr>
              </thead>
              <tbody>
                {gorunenler.map(({ aday, sertifika: s, bekleyenVize }, i) => {
                  const durum = VIZE_DURUMU_BILGI[vizeDurumu(s)];
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-zinc-50 last:border-0 ${i % 2 === 1 ? "bg-zinc-50/50" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{aday.themisId}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {aday.ad} {aday.soyad}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{aday.kulup}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {s.brans} · {s.kademe}. Kademe
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{s.vizeDonemi ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge label={vizeRozetMetni(s)} tone={durum.tone} />
                        <div className="mt-1 text-xs text-zinc-400">{vizeAciklamasi(s)}</div>
                        {bekleyenVize && (
                          <div className="mt-1 text-xs font-medium text-amber-700">
                            Yeni vize ({bekleyenVize.bitisTarihi}) İK onayında
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
