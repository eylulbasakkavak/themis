"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, FileText, Inbox, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useAdaylar } from "@/lib/AdaylarContext";
import { akademiDavetiOnayKaydi, kontenjanDoluMu } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { bekleyenBelgeSeti } from "@/lib/belgeKurallari";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import {
  ihtarKimligi,
  ihtarOnayla,
  ihtarReddet,
  sertifikaOnayla,
  sertifikaReddet,
  temelEgitimOnayla,
  temelEgitimReddet,
  vizeOnayla,
  vizeReddet,
} from "@/lib/sertifikaOnay";
import type { AdayEgitmen, Belge } from "@/lib/types";

type Durum = "bekleyen" | "onaylanan" | "reddedilen";

const DURUM_SEKMELERI: { deger: Durum; label: string }[] = [
  { deger: "bekleyen", label: "Onay Bekleyen" },
  { deger: "onaylanan", label: "Onaylanan" },
  { deger: "reddedilen", label: "Reddedilen" },
];

type TalepKaynagi =
  "belge-seti" | "akademi-daveti" | "kademe-sertifikasi" | "vize" | "temel-egitim" | "ihtar";

type Talep = {
  id: string;
  aday: AdayEgitmen;
  kaynak: TalepKaynagi;
  sertifikaId?: string;
  // Vize ve temel eğitim kayıtlarının kimliği.
  kayitId?: string;
  // Talebin özeti (sertifika / vize / temel eğitim ayrıntıları).
  ozet?: string;
  belge: Belge;
  tip: string;
  hedefTab: string;
  durum: Durum;
  gonderen: string;
};

const ONAYLANAN_GOSTERIM_SINIRI = 250;

/** "DD.MM.YYYY" tarihini sıralama için sayıya çevirir; tarihsiz kayıtlar en sona düşer. */
function tarihSirasi(tarih?: string): number {
  const [g, a, y] = (tarih ?? "").split(".").map(Number);
  return g && a && y ? y * 10000 + a * 100 + g : 0;
}

export default function OnayBekleyenlerPage() {
  const { adaylar, guncelleAday } = useAdaylar();
  const { donemler, adayKaydet } = useAkademiDonemleri();
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const searchParams = useSearchParams();
  const vurgulananId = searchParams.get("aday");
  const talepIdParam = searchParams.get("talep");
  const ikMi = ikYetkisiVarMi(currentUser.rol);

  const [reddetAcik, setReddetAcik] = useState(false);
  const [redSebebi, setRedSebebi] = useState("");
  const [onizleme, setOnizleme] = useState<Belge | null>(null);
  const kartRefleri = useRef<Record<string, HTMLButtonElement | null>>({});

  const talepler = useMemo(() => {
    const liste: Talep[] = [];

    for (const a of adaylar) {
      const gonderen = `${a.mulakatiYapan} (${a.mulakatiYapanRol})`;

      const belgeSetiBelge: Belge = { ad: "İkinci Belge Seti", durum: "yuklendi", tarih: "Bugün" };
      if (bekleyenBelgeSeti(a) === "ikinci") {
        liste.push({
          id: `${a.id}-belge`,
          aday: a,
          kaynak: "belge-seti",
          belge: belgeSetiBelge,
          tip: "Belge Seti Onayı",
          hedefTab: "belgeler",
          durum: "bekleyen",
          gonderen,
        });
      } else if (a.ikinciBelgeSetiOnaylandi) {
        liste.push({
          id: `${a.id}-belge`,
          aday: a,
          kaynak: "belge-seti",
          belge: belgeSetiBelge,
          tip: "Belge Seti Onayı",
          hedefTab: "belgeler",
          durum: "onaylanan",
          gonderen,
        });
      } else if (a.ikinciBelgeSetiRedSebebi && a.surecDurumu === "ikinci_belge_seti_bekleniyor") {
        liste.push({
          id: `${a.id}-belge`,
          aday: a,
          kaynak: "belge-seti",
          belge: belgeSetiBelge,
          tip: "Belge Seti Onayı",
          hedefTab: "belgeler",
          durum: "reddedilen",
          gonderen,
        });
      }

      if (a.surecDurumu === "akademi_daveti_onayi_bekliyor") {
        liste.push({
          id: `${a.id}-akademi-daveti`,
          aday: a,
          kaynak: "akademi-daveti",
          belge: { ad: "Akademi Daveti Onayı", durum: "yuklendi", tarih: "Bugün" },
          tip: "Akademi Daveti Onayı",
          hedefTab: "akademi-sinav",
          durum: "bekleyen",
          gonderen,
        });
      } else if (a.akademiDavetiRedSebebi && a.surecDurumu === "akademi_egitimine_hazir") {
        liste.push({
          id: `${a.id}-akademi-daveti`,
          aday: a,
          kaynak: "akademi-daveti",
          belge: { ad: "Akademi Daveti Onayı", durum: "yuklendi", tarih: "Bugün" },
          tip: "Akademi Daveti Onayı",
          hedefTab: "akademi-sinav",
          durum: "reddedilen",
          gonderen,
        });
      }

      // PRD 12: kademe belgeleri, vize kayıtları ve temel eğitim sonuçları.
      const durumu = (k: { onaylandi: boolean; redSebebi?: string }): Durum =>
        k.onaylandi ? "onaylanan" : k.redSebebi ? "reddedilen" : "bekleyen";
      for (const s of a.sertifikalar ?? []) {
        if (s.belge && s.yukleyen) {
          liste.push({
            id: `${a.id}-sertifika-${s.id}`,
            aday: a,
            kaynak: "kademe-sertifikasi",
            sertifikaId: s.id,
            belge: s.belge,
            tip: `Kademe Belgesi Onayı (${s.brans} ${s.kademe}. Kademe)`,
            ozet: `${s.brans} · ${s.kademe}. Kademe · belge tarihi ${s.belgeTarihi}`,
            hedefTab: "kademe-federasyon",
            durum: durumu(s),
            gonderen: s.yukleyen,
          });
        }
        for (const v of s.vizeler ?? []) {
          liste.push({
            id: `${a.id}-vize-${s.id}-${v.id}`,
            aday: a,
            kaynak: "vize",
            sertifikaId: s.id,
            kayitId: v.id,
            belge: v.belge,
            tip: `Vize Onayı (${s.brans})`,
            ozet: `${s.brans} ${s.kademe}. Kademe · ${v.donem} · geçerlilik bitişi ${v.bitisTarihi} — tarihi vize belgesiyle karşılaştırın`,
            hedefTab: "kademe-federasyon",
            durum: durumu(v),
            gonderen: v.yukleyen,
          });
        }
      }
      for (const t of a.temelEgitimSonuclari ?? []) {
        const kalan = Object.values(t.dersler).filter((d) => d === "Kaldı").length;
        liste.push({
          id: `${a.id}-temel-${t.id}`,
          aday: a,
          kaynak: "temel-egitim",
          kayitId: t.id,
          belge: {
            ad: `${t.hedefKademe}. Kademe Temel Eğitim Sonucu`,
            durum: "yuklendi",
            tarih: t.tarih,
          },
          tip: `Temel Eğitim Sonucu (${t.brans} ${t.hedefKademe}. Kademe)`,
          ozet:
            t.sonuc === "Katılmadı"
              ? `Sınav ${t.sinavTarihi} · Katılmadı · mazeret: ${t.mazeret ?? "—"}`
              : `Sınav ${t.sinavTarihi} · ${t.sonuc} · kaldığı ders sayısı: ${kalan}`,
          hedefTab: "kademe-federasyon",
          durum: durumu(t),
          gonderen: t.yukleyen,
        });
      }
      // PRD 11.4: KM/KMY'nin girdiği ihtar kayıtları (onay alanı olmayan eski kayıtlar hariç).
      (a.ihtarKayitlari ?? []).forEach((k, i) => {
        if (k.onaylandi === undefined) return;
        const kimlik = ihtarKimligi(k.id, i);
        liste.push({
          id: `${a.id}-ihtar-${kimlik}`,
          aday: a,
          kaynak: "ihtar",
          kayitId: kimlik,
          belge: { ad: "İhtar Kaydı", durum: "yuklendi", tarih: k.tarih },
          tip: "İhtar Kaydı Onayı",
          ozet: `${k.tarih} · ${k.sebep}`,
          hedefTab: "ihtar",
          durum: durumu(k as { onaylandi: boolean; redSebebi?: string }),
          gonderen: k.kaydeden,
        });
      });
    }

    return liste;
  }, [adaylar]);

  // Aday detay sayfasındaki "Onay Talepleri'nde İncele" linkinden dönüldüğünde, ilgili
  // talebi doğrudan popup olarak açar — onay mekanizması yalnızca burada var. Bu sayfaya
  // her dönüş ayrı bir navigasyon olduğundan (farklı route), tembel başlangıç değeri yeterli.
  const talepIdenEslesen = talepIdParam
    ? (talepler.find((t) => t.id === talepIdParam) ?? null)
    : null;
  const [durum, setDurum] = useState<Durum>(talepIdenEslesen?.durum ?? "bekleyen");
  const [acikTalep, setAcikTalep] = useState<Talep | null>(talepIdenEslesen);
  const davetAkademisi =
    acikTalep?.kaynak === "akademi-daveti"
      ? donemler.find((d) => d.id === acikTalep.aday.akademiDonemiId)
      : undefined;
  const davetAkademisiDolu = !!davetAkademisi && kontenjanDoluMu(davetAkademisi);

  const gruplar = {
    bekleyen: talepler.filter((t) => t.durum === "bekleyen"),
    // Eski onaylı kayıtların hepsi gösterilmez; en yeni 250 onay listelenir.
    onaylanan: talepler
      .filter((t) => t.durum === "onaylanan")
      .sort((x, y) => tarihSirasi(y.belge.tarih) - tarihSirasi(x.belge.tarih))
      .slice(0, ONAYLANAN_GOSTERIM_SINIRI),
    reddedilen: talepler.filter((t) => t.durum === "reddedilen"),
  };
  const rows = gruplar[durum];

  useEffect(() => {
    if (!vurgulananId) return;
    const key = Object.keys(kartRefleri.current).find((k) => k.startsWith(`${vurgulananId}-`));
    if (key) kartRefleri.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [vurgulananId, durum]);

  const talebiKapat = () => {
    setAcikTalep(null);
    setReddetAcik(false);
    setRedSebebi("");
  };

  const onayla = (t: Talep) => {
    if (!ikMi) return;
    const planlayan = `${currentUser.ad} (${currentUser.rol})`;
    if (t.kaynak === "belge-seti") {
      guncelleAday({
        ...t.aday,
        ikinciBelgeSetiOnaylandi: true,
        surecDurumu: "mulakat_sonucu_bekleniyor",
        aksiyonGecmisi: [
          ...t.aday.aksiyonGecmisi,
          { tarih: "Bugün", aksiyon: "Belge seti İK tarafından onaylandı", yapan: planlayan },
        ],
      });
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad} belge seti onaylandı`,
        mesaj: "Belge seti İK tarafından onaylandı, süreç mülakat aşamasına geçti.",
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
      });
    } else if (
      t.kaynak === "kademe-sertifikasi" ||
      t.kaynak === "vize" ||
      t.kaynak === "temel-egitim" ||
      t.kaynak === "ihtar"
    ) {
      guncelleAday(
        t.kaynak === "kademe-sertifikasi"
          ? sertifikaOnayla(t.aday, t.sertifikaId!)
          : t.kaynak === "vize"
            ? vizeOnayla(t.aday, t.sertifikaId!, t.kayitId!)
            : t.kaynak === "ihtar"
              ? ihtarOnayla(t.aday, t.kayitId!)
              : temelEgitimOnayla(t.aday, t.kayitId!)
      );
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad}: ${t.tip} onaylandı`,
        mesaj: t.ozet ?? "İK tarafından onaylandı.",
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
      });
    } else {
      if (t.aday.akademiDonemiId) adayKaydet(t.aday.akademiDonemiId, t.aday.id);
      guncelleAday({
        ...t.aday,
        surecDurumu: "akademi_egitmeni",
        aksiyonGecmisi: [
          ...t.aday.aksiyonGecmisi,
          {
            tarih: "Bugün",
            aksiyon: akademiDavetiOnayKaydi(
              donemler.find((d) => d.id === t.aday.akademiDonemiId)?.ad
            ),
            yapan: planlayan,
          },
        ],
      });
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad} akademi daveti onaylandı`,
        mesaj: "Akademi daveti İK tarafından onaylandı, Akademi Eğitmeni statüsüne geçirildi.",
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
        link: `/adaylar/${t.aday.id}?tab=akademi-sinav`,
      });
    }
    talebiKapat();
  };

  const reddet = (t: Talep) => {
    if (!ikMi) return;
    // PRD 4.3: ret nedeni zorunludur ve talebi oluşturan KM/KMY'ye geri döner.
    const sebep = redSebebi.trim();
    if (!sebep) return;
    const planlayan = `${currentUser.ad} (${currentUser.rol})`;
    if (t.kaynak === "belge-seti") {
      guncelleAday({
        ...t.aday,
        ikinciBelgeSetiRedSebebi: sebep,
        surecDurumu: "ikinci_belge_seti_bekleniyor",
        aksiyonGecmisi: [
          ...t.aday.aksiyonGecmisi,
          {
            tarih: "Bugün",
            aksiyon: "Belge seti İK tarafından reddedildi",
            yapan: planlayan,
            detay: sebep,
          },
        ],
      });
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad} belge seti reddedildi`,
        mesaj: sebep,
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
      });
    } else if (
      t.kaynak === "kademe-sertifikasi" ||
      t.kaynak === "vize" ||
      t.kaynak === "temel-egitim" ||
      t.kaynak === "ihtar"
    ) {
      guncelleAday(
        t.kaynak === "kademe-sertifikasi"
          ? sertifikaReddet(t.aday, t.sertifikaId!, sebep)
          : t.kaynak === "vize"
            ? vizeReddet(t.aday, t.sertifikaId!, t.kayitId!, sebep)
            : t.kaynak === "ihtar"
              ? ihtarReddet(t.aday, t.kayitId!, sebep)
              : temelEgitimReddet(t.aday, t.kayitId!, sebep)
      );
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad}: ${t.tip} reddedildi`,
        mesaj: sebep,
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
      });
    } else {
      guncelleAday({
        ...t.aday,
        surecDurumu: "akademi_egitimine_hazir",
        akademiDavetiRedSebebi: sebep,
        aksiyonGecmisi: [
          ...t.aday.aksiyonGecmisi,
          {
            tarih: "Bugün",
            aksiyon: "Akademi daveti İK tarafından reddedildi",
            yapan: planlayan,
            detay: sebep,
          },
        ],
      });
      bildirimEkle({
        aliciRol: t.aday.mulakatiYapanRol,
        aliciAd: KULLANICILAR[t.aday.mulakatiYapanRol].ad,
        baslik: `${t.aday.ad} ${t.aday.soyad} akademi daveti reddedildi`,
        mesaj: sebep,
        planlayan,
        tarih: "Bugün",
        adayId: t.aday.id,
        link: `/adaylar/${t.aday.id}?tab=akademi-sinav`,
      });
    }
    talebiKapat();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Onay Talepleri</h1>
        <p className="text-xs text-zinc-400">
          KM ve KMY tarafından gönderilen belge/sertifika onay talepleri burada listelenir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DURUM_SEKMELERI.map((s) => (
          <button
            key={s.deger}
            onClick={() => setDurum(s.deger)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              durum === s.deger
                ? "border-brand bg-brand-soft text-brand"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {s.label}
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-500">
              {gruplar[s.deger].length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              kartRefleri.current[t.id] = el;
            }}
            onClick={() => setAcikTalep(t)}
            className={`flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-zinc-50 ${
              t.aday.id === vurgulananId ? "border-brand ring-2 ring-brand/30" : "border-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {t.aday.ad[0]}
                {t.aday.soyad[0]}
              </span>
              <div>
                <span className="font-medium text-zinc-900">
                  {t.aday.ad} {t.aday.soyad}
                </span>
                <p className="mt-0.5 text-xs text-zinc-400">{t.aday.kulup}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                label={t.tip}
                tone={
                  t.durum === "onaylanan" ? "green" : t.durum === "reddedilen" ? "red" : "orange"
                }
              />
              <ArrowRight className="h-4 w-4 text-zinc-300" />
            </div>
          </button>
        ))}

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
            <Inbox className="h-6 w-6 text-zinc-300" />
            {durum === "bekleyen" && "Onay bekleyen talep bulunmuyor."}
            {durum === "onaylanan" && "Onaylanan talep bulunmuyor."}
            {durum === "reddedilen" && "Reddedilen talep bulunmuyor."}
          </div>
        )}
      </div>

      {acikTalep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={talebiKapat}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Talep Detayı</h3>
              <button onClick={talebiKapat} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <div className="text-xs text-zinc-400">Talep Tipi</div>
                <div className="mt-0.5 font-medium text-zinc-800">{acikTalep.tip}</div>
              </div>
              {acikTalep.ozet && (
                <div>
                  <div className="text-xs text-zinc-400">Ayrıntı</div>
                  <div className="mt-0.5 font-medium text-zinc-800">{acikTalep.ozet}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-zinc-400">Talebi Oluşturan</div>
                <div className="mt-0.5 font-medium text-zinc-800">{acikTalep.gonderen}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Kulüp</div>
                <div className="mt-0.5 font-medium text-zinc-800">{acikTalep.aday.kulup}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Eğitmen</div>
                <Link
                  href={`/adaylar/${acikTalep.aday.id}?tab=${acikTalep.hedefTab}&donus=onay-bekleyenler&talep=${acikTalep.id}`}
                  className="mt-0.5 flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  {acikTalep.aday.ad} {acikTalep.aday.soyad}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {acikTalep.kaynak === "belge-seti" ? (
                <div className="mt-1 flex flex-col gap-2">
                  <div className="text-xs text-zinc-400">Belgeler</div>
                  <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                    {acikTalep.aday.ikinciBelgeSeti.map((b) => (
                      <div key={b.ad} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-800">{b.ad}</span>
                        </div>
                        <button
                          onClick={() => setOnizleme(b)}
                          className="rounded-lg border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-50"
                          title="Görüntüle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : acikTalep.kaynak === "akademi-daveti" ? (
                <div className="mt-1 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-zinc-400">Vergi Levhası</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-medium text-zinc-800">
                        {acikTalep.aday.vergiLevhasi?.durum === "yuklendi"
                          ? "Yüklendi"
                          : "Yüklenmedi"}
                      </span>
                      {acikTalep.aday.vergiLevhasi?.durum === "yuklendi" && (
                        <button
                          onClick={() => setOnizleme(acikTalep.aday.vergiLevhasi!)}
                          className="rounded-lg border border-zinc-200 p-1 text-zinc-500 hover:bg-zinc-50"
                          title="Görüntüle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">BM Onaylı Konaklama</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {acikTalep.aday.bmOnayliKonaklama ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Akademi Hesabı</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {acikTalep.aday.akademiHesabiAcildiMi
                        ? `Açıldı (${acikTalep.aday.akademiHesapUserId})`
                        : "Açılmadı"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Akademi Başlangıç Tarihi</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {acikTalep.aday.yonlendirilecekAkademiTarihi ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Ayakkabı Numarası</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {acikTalep.aday.ayakkabiNo ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Üst / Alt Beden</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {acikTalep.aday.ustBeden ?? "—"} / {acikTalep.aday.altBeden ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Dahil Edilecek Akademi</div>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {donemler.find((d) => d.id === acikTalep.aday.akademiDonemiId)?.ad ?? "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setOnizleme(acikTalep.belge)}
                  className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Belgeyi Görüntüle
                </button>
              )}

              {acikTalep.durum === "bekleyen" && ikMi && (
                <div className="mt-1 border-t border-zinc-100 pt-3">
                  {reddetAcik ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={redSebebi}
                        onChange={(e) => setRedSebebi(e.target.value)}
                        rows={2}
                        placeholder="Ret nedeni (zorunlu)"
                        className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReddetAcik(false)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                        >
                          Vazgeç
                        </button>
                        <button
                          onClick={() => reddet(acikTalep)}
                          disabled={!redSebebi.trim()}
                          className="rounded-lg bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Reddi Onayla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReddetAcik(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reddet
                      </button>
                      {davetAkademisiDolu && (
                        <span className="mr-auto text-xs text-rose-600">
                          Seçilen akademinin kontenjanı doldu; talebi reddedip başka akademi
                          seçilmesini isteyin.
                        </span>
                      )}
                      <button
                        onClick={() => onayla(acikTalep)}
                        disabled={davetAkademisiDolu}
                        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {acikTalep.kaynak === "akademi-daveti"
                          ? "Onayla ve Akademi Eğitmeni Yap"
                          : "Onayla"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {onizleme && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
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
