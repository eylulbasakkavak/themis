"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, FileSignature, FileText, Lock, RotateCw, Send, Upload, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import {
  belgeSetiTamamMi,
  ikinciBelgeSetiOnaylanmisMi,
  ilkBelgeSetiOnaylanmisMi,
  surecDurduruldu,
} from "@/lib/belgeKurallari";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { belgeDurumuBilgi } from "@/lib/status";
import type { AdayEgitmen, Belge } from "@/lib/types";
import { MulakatFormuModal } from "./MulakatFormuModal";

const MULAKAT_FORMU_ADI = "Mülakat Formu";

function BelgeGrubu({
  baslik,
  onaylandi,
  reddedildi,
  belgeler,
  kilitli,
  kilitMesaji,
  onYukle,
  altBolum,
  araBolum,
  ozelSatir,
}: {
  baslik: string;
  onaylandi?: boolean;
  reddedildi?: boolean;
  belgeler: Belge[];
  kilitli?: boolean;
  kilitMesaji?: string;
  onYukle: (index: number) => void;
  altBolum?: ReactNode;
  araBolum?: ReactNode;
  ozelSatir?: (belge: Belge, index: number) => ReactNode | null;
}) {
  const [onizleme, setOnizleme] = useState<Belge | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{baslik}</h3>
        {onaylandi && <Badge label="Onaylandı" tone="green" />}
        {reddedildi && <Badge label="Reddedildi" tone="red" />}
      </div>

      {kilitli ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-400">
          <Lock className="h-4 w-4 shrink-0" />
          {kilitMesaji}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {belgeler.map((b, i) => {
            const durum = belgeDurumuBilgi[b.durum];
            return (
              <div key={b.ad} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <div>
                    <div className="text-sm font-medium text-zinc-800">{b.ad}</div>
                    {b.tarih && <div className="text-xs text-zinc-400">{b.tarih}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={durum.label} tone={durum.tone} />
                  {ozelSatir?.(b, i) ?? (
                    <>
                      {b.durum === "yuklenmedi" && (
                        <button
                          onClick={() => onYukle(i)}
                          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Yükle
                        </button>
                      )}
                      {b.durum === "yuklendi" && (
                        <>
                          <button
                            onClick={() => setOnizleme(b)}
                            title="Görüntüle"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onYukle(i)}
                            title="Yeniden Yükle"
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!kilitli && araBolum && <div className="mt-3">{araBolum}</div>}

      {!kilitli && altBolum && <div className="mt-3">{altBolum}</div>}

      {onizleme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOnizleme(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">{onizleme.ad}</h3>
              <button
                onClick={() => setOnizleme(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 py-10 text-zinc-400">
              <FileText className="h-10 w-10" />
              <p className="text-xs">{onizleme.tarih} tarihinde yüklendi</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BelgeYonetimi({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const girmeYetkisiVar = ikYetkisiVarMi(currentUser.rol);
  // Sadece İlk Belge Seti'nin "Onaylandı" rozetini gizlemek için: mülakatını İK yapan
  // adaylarda o sette gerçek bir onay adımı hiç yaşanmadığından rozet yanıltıcı olur.
  // İkinci Belge Seti'nin onay gerekip gerekmediği artık buna değil, belgeyi şu an kimin
  // tamamladığına (girmeYetkisiVar) bakar — bkz. ikinciYukle.
  const mulakatOtonom = aday.mulakatiYapanRol === "İK";
  const sonlandi = surecDurduruldu(aday.gorusmeSonucu);
  const [mulakatFormuAcik, setMulakatFormuAcik] = useState(false);

  const ilkOnaylanmis = ilkBelgeSetiOnaylanmisMi(aday);

  const ikinciTamam = belgeSetiTamamMi(aday.ikinciBelgeSeti);
  const ikinciOnaylanmis = ikinciBelgeSetiOnaylanmisMi(aday);
  const ikinciBeklemede =
    aday.surecDurumu === "ik_onayi_bekliyor" && ilkOnaylanmis && !ikinciOnaylanmis;
  const ikinciGonderilebilir =
    !girmeYetkisiVar &&
    ilkOnaylanmis &&
    ikinciTamam &&
    !ikinciOnaylanmis &&
    !ikinciBeklemede &&
    !sonlandi;

  const ilkYukle = (i: number) => {
    const yeniIlkSet = aday.ilkBelgeSeti.map((b, idx) =>
      idx === i ? { ...b, durum: "yuklendi" as const, tarih: "Bugün" } : b
    );
    const yeniSurecDurumu = belgeSetiTamamMi(yeniIlkSet)
      ? "ikinci_belge_seti_bekleniyor"
      : aday.surecDurumu;
    onAdayGuncelle?.({ ...aday, ilkBelgeSeti: yeniIlkSet, surecDurumu: yeniSurecDurumu });
  };

  const mulakatFormuBelge = aday.ilkBelgeSeti.find((b) => b.ad === MULAKAT_FORMU_ADI);

  const mulakatFormuKaydet = (veri: {
    kulup: string;
    tarih: string;
    adSoyad: string;
    cinsiyet: NonNullable<AdayEgitmen["cinsiyet"]>;
    egitimBilgisi: string;
    federasyonKademeDurumu: string;
    denklikMezuniyetTarihi: string;
    antrenorlukGecmisiVarMi: NonNullable<AdayEgitmen["antrenorlukGecmisiVarMi"]>;
    antrenorlukGecmisiDetay: string;
    akademiMulakatTipi: NonNullable<AdayEgitmen["akademiMulakatTipi"]>;
  }) => {
    const yeniIlkSet = aday.ilkBelgeSeti.map((b) =>
      b.ad === MULAKAT_FORMU_ADI ? { ...b, durum: "yuklendi" as const, tarih: "Bugün" } : b
    );
    const yeniSurecDurumu = belgeSetiTamamMi(yeniIlkSet)
      ? "ikinci_belge_seti_bekleniyor"
      : aday.surecDurumu;
    onAdayGuncelle?.({
      ...aday,
      ilkBelgeSeti: yeniIlkSet,
      formKulup: veri.kulup,
      formTarih: veri.tarih,
      formAdSoyad: veri.adSoyad,
      cinsiyet: veri.cinsiyet,
      egitimBilgisi: veri.egitimBilgisi,
      federasyonKademeDurumu: veri.federasyonKademeDurumu,
      denklikMezuniyetTarihi: veri.denklikMezuniyetTarihi || undefined,
      antrenorlukGecmisiVarMi: veri.antrenorlukGecmisiVarMi,
      antrenorlukGecmisiDetay: veri.antrenorlukGecmisiDetay || undefined,
      akademiMulakatTipi: veri.akademiMulakatTipi,
      surecDurumu: yeniSurecDurumu,
    });
    setMulakatFormuAcik(false);
  };

  // Belgeyi tamamlayan İK/Sistem Yöneticisi ise ayrı bir onay adımına gerek yok: tüm belgeler
  // yüklenip dijital oryantasyon da işaretlendiğinde (hangisi sonra olursa) set kendi kendine
  // onaylanmış sayılır. Dijital oryantasyon tamamlanmadan set ilerlemez.
  const ikinciSetiGuncelle = (yeni: AdayEgitmen) => {
    const otonomTamamlaniyor =
      girmeYetkisiVar &&
      yeni.surecDurumu === "ikinci_belge_seti_bekleniyor" &&
      ilkOnaylanmis &&
      belgeSetiTamamMi(yeni.ikinciBelgeSeti) &&
      !!yeni.dijitalOryantasyonTamamlandi;
    onAdayGuncelle?.({
      ...yeni,
      ...(otonomTamamlaniyor
        ? { ikinciBelgeSetiOnaylandi: true, surecDurumu: "mulakat_sonucu_bekleniyor" as const }
        : {}),
    });
  };

  const ikinciYukle = (i: number) =>
    ikinciSetiGuncelle({
      ...aday,
      ikinciBelgeSeti: aday.ikinciBelgeSeti.map((b, idx) =>
        idx === i ? { ...b, durum: "yuklendi" as const, tarih: "Bugün" } : b
      ),
    });

  const ikinciOnayinaGonder = () => {
    if (!aday.dijitalOryantasyonTamamlandi) return;
    onAdayGuncelle?.({
      ...aday,
      surecDurumu: "ik_onayi_bekliyor",
      ikinciBelgeSetiRedSebebi: undefined,
    });
    bildirimEkle({
      aliciRol: "İK",
      aliciAd: KULLANICILAR["İK"].ad,
      baslik: `${aday.ad} ${aday.soyad} için belge seti onay bekliyor`,
      mesaj: "Belge seti onaya gönderildi, incelemeniz gerekiyor.",
      planlayan: `${currentUser.ad} (${currentUser.rol})`,
      tarih: "Bugün",
      adayId: aday.id,
      link: `/onay-bekleyenler?aday=${aday.id}`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <BelgeGrubu
        baslik="İlk Belge Seti"
        onaylandi={!mulakatOtonom && !sonlandi && ilkOnaylanmis}
        belgeler={aday.ilkBelgeSeti}
        onYukle={ilkYukle}
        ozelSatir={(b) =>
          b.ad === MULAKAT_FORMU_ADI ? (
            <button
              onClick={() => setMulakatFormuAcik(true)}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <FileSignature className="h-3.5 w-3.5" />
              {b.durum === "yuklendi" ? "Formu Görüntüle" : "Formu Doldur"}
            </button>
          ) : null
        }
      />

      <BelgeGrubu
        baslik="İkinci Belge Seti"
        onaylandi={!sonlandi && ikinciOnaylanmis}
        reddedildi={!!aday.ikinciBelgeSetiRedSebebi}
        belgeler={aday.ikinciBelgeSeti}
        kilitli={!ilkOnaylanmis}
        kilitMesaji="Önce ilk belge setinin tamamlanması gerekiyor."
        onYukle={ikinciYukle}
        araBolum={
          !sonlandi &&
          !ikinciBeklemede &&
          !ikinciOnaylanmis && (
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={!!aday.dijitalOryantasyonTamamlandi}
                onChange={(e) =>
                  ikinciSetiGuncelle({ ...aday, dijitalOryantasyonTamamlandi: e.target.checked })
                }
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              Dijital oryantasyon tamamlandı mı?
            </label>
          )
        }
        altBolum={
          sonlandi || ikinciOnaylanmis ? undefined : girmeYetkisiVar &&
            ilkOnaylanmis &&
            ikinciTamam &&
            !aday.dijitalOryantasyonTamamlandi ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Tüm belgeler yüklendi. Dijital oryantasyon tamamlandı olarak işaretlenince set
              tamamlanır.
            </div>
          ) : ikinciBeklemede ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <span className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 shrink-0" />
                Onay Bekleniyor
              </span>
              {girmeYetkisiVar && (
                <Link
                  href={`/onay-bekleyenler?aday=${aday.id}&talep=${aday.id}-belge`}
                  className="shrink-0 font-semibold text-amber-800 underline hover:text-amber-900"
                >
                  Onay Talepleri&apos;nde İncele
                </Link>
              )}
            </div>
          ) : ikinciGonderilebilir ? (
            <div className="flex flex-col gap-2">
              {aday.ikinciBelgeSetiRedSebebi && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <span className="font-semibold">Belge seti reddedildi:</span>{" "}
                  {aday.ikinciBelgeSetiRedSebebi}. Düzelt ve yeniden gönder.
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={ikinciOnayinaGonder}
                  disabled={!aday.dijitalOryantasyonTamamlandi}
                  className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Onaya Gönder
                </button>
                {!aday.dijitalOryantasyonTamamlandi && (
                  <span className="text-xs text-amber-700">
                    Göndermek için dijital oryantasyonu tamamlandı olarak işaretleyin.
                  </span>
                )}
              </div>
            </div>
          ) : undefined
        }
      />

      {mulakatFormuAcik && (
        <MulakatFormuModal
          aday={aday}
          dahaOnceDolduruldu={mulakatFormuBelge?.durum === "yuklendi"}
          onClose={() => setMulakatFormuAcik(false)}
          onKaydet={mulakatFormuKaydet}
        />
      )}
    </div>
  );
}
