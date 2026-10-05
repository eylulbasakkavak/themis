"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { MulakatPlanlaModal } from "@/components/aday/MulakatPlanlaModal";
import { MulakatSonucuModal } from "@/components/aday/MulakatSonucuModal";
import { SurecSonlandirModal } from "@/components/aday/SurecSonlandirModal";
import { SozlesmeTipiSecimi } from "@/components/egitmen/SozlesmeTipiSecimi";
import { bugun, inputTarihindenCevir, tarihCoz, yoklamaAlinabilirMi } from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { useAkademiSinavSonuclari } from "@/lib/AkademiSinavSonuclariContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";
import { egitmenBilgileriEksikMi, egitmeneGecir, sureceYenidenDahilEt } from "@/lib/egitmenGecis";
import { degerlendirmeyiUygula } from "@/lib/mulakatDegerlendirme";
import { enAcilSertifika, vizeDurumu, vizeKalanGun } from "@/lib/sertifika";
import type { AdayEgitmen, IstihdamTipi } from "@/lib/types";

/** Kartın sekme değiştirerek yönlendirdiği yerler (AdayDetayIcerik sekme kimlikleri). */
export type ProfilSekmesi = "genel" | "belgeler" | "kademe-federasyon" | "akademi-sinav";

type Buton =
  | { tur: "islem"; label: string; onClick: () => void; tehlikeli?: boolean; pasif?: boolean }
  | { tur: "link"; label: string; href: string };

type Kart = {
  // "aksiyon": kullanıcının yapacağı iş · "bekleme": başkası/tarih bekleniyor · "bitti": iş yok.
  tip: "aksiyon" | "bekleme" | "bitti";
  baslik: string;
  aciklama: string;
  bilgi?: { etiket: string; deger: string; uyari?: boolean };
  buton?: Buton;
  ikincil?: Buton;
  ek?: ReactNode;
};

type Pencere = "planla" | "sonuc" | "sonlandir" | null;

// Sitedeki özet kartlarıyla aynı dil: başlığın önündeki nokta kartın durumunu gösterir.
const UST_BASLIK: Record<Kart["tip"], { metin: string; nokta: string }> = {
  aksiyon: { metin: "Sonraki Aksiyon", nokta: "bg-brand" },
  bekleme: { metin: "Bekleniyor", nokta: "bg-amber-500" },
  bitti: { metin: "Sonraki Aksiyon", nokta: "bg-emerald-500" },
};

/**
 * Profilde Genel Bilgi'nin yanında duran büyük "Sonraki Aksiyon" kartı: eğitmenin sürecinde
 * sıradaki işi, kimin yapacağını ve tek bir ana butonu gösterir.
 */
export function SonrakiAksiyonKarti({
  aday,
  onAdayGuncelle,
  onSekmeAc,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
  onSekmeAc: (sekme: ProfilSekmesi) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { donemler } = useAkademiDonemleri();
  const { sinavSonuclari } = useAkademiSinavSonuclari();
  const [pencere, setPencere] = useState<Pencere>(null);
  const [tip, setTip] = useState<IstihdamTipi | "">(aday.istihdamTipi ?? "");
  const [altTip, setAltTip] = useState(aday.altSozlesmeTipi ?? "");

  const ik = ikYetkisiVarMi(currentUser.rol);
  const yapan = `${currentUser.ad} (${currentUser.rol})`;
  const duzenlenebilir = !!onAdayGuncelle;
  const donem = donemler.find((d) => d.id === aday.akademiDonemiId);
  const sinavSonucu = sinavSonuclari.find(
    (s) =>
      s.egitmenId === aday.id && (!s.akademiDonemiId || s.akademiDonemiId === aday.akademiDonemiId)
  )?.genelSonuc;

  const ac = (p: Pencere) => () => setPencere(p);
  const sekme = (s: ProfilSekmesi) => () => onSekmeAc(s);
  const sonlandirIkincil: Buton | undefined =
    ik && duzenlenebilir
      ? { tur: "islem", label: "Süreci sonlandır", onClick: ac("sonlandir"), tehlikeli: true }
      : undefined;
  const ikBekleniyor = (baslik: string, aciklama: string, bilgi?: Kart["bilgi"]): Kart => ({
    tip: "bekleme",
    baslik,
    aciklama,
    bilgi,
  });
  const mulakatTarihi = aday.mulakatPlanlananTarihi
    ? `${inputTarihindenCevir(aday.mulakatPlanlananTarihi)}${
        aday.mulakatPlanlananSaat ? ` · ${aday.mulakatPlanlananSaat}` : ""
      }`
    : undefined;
  const akademiBilgisi = donem
    ? { etiket: donem.ad, deger: `${donem.baslangicTarihi} – ${donem.bitisTarihi}` }
    : undefined;

  const kart = ((): Kart => {
    switch (aday.surecDurumu) {
      case "ilk_belge_seti_bekleniyor":
      case "ikinci_belge_seti_bekleniyor": {
        const ilk = aday.surecDurumu === "ilk_belge_seti_bekleniyor";
        const set = ilk ? aday.ilkBelgeSeti : aday.ikinciBelgeSeti;
        const eksik = set.filter((b) => b.durum === "yuklenmedi");
        return {
          tip: "aksiyon",
          baslik: ilk ? "Birinci belge setini yükle" : "İkinci belge setini yükle",
          aciklama: ilk
            ? "Mülakat formu ve CV (KM mülakatında bölge müdürü onayı da) yüklendiğinde ikinci belge setine geçilir."
            : "Adli sicil, öğrenim durumu ve fiziki oryantasyon formu yüklenip İK onayına gönderilir.",
          bilgi:
            eksik.length > 0
              ? { etiket: "Eksik belgeler", deger: eksik.map((b) => b.ad).join(", ") }
              : !ilk && !aday.dijitalOryantasyonTamamlandi
                ? { etiket: "Eksik", deger: "Dijital oryantasyon tamamlanmadı", uyari: true }
                : { etiket: "Belgeler", deger: "Tümü yüklendi" },
          buton: { tur: "islem", label: "Belgeleri yükle", onClick: sekme("belgeler") },
        };
      }
      case "ik_onayi_bekliyor":
        return ik
          ? {
              tip: "aksiyon",
              baslik: "İkinci belge setini onayla",
              aciklama:
                "Kulüp müdürü belgeleri yükleyip onaya gönderdi. Onaylandığında akademi mülakatı planlanabilir.",
              buton: {
                tur: "link",
                label: "Onay talebini incele",
                href: `/onay-bekleyenler?aday=${aday.id}&talep=${aday.id}-belge`,
              },
            }
          : ikBekleniyor(
              "İK belge onayı bekleniyor",
              "İkinci belge seti İK onayına gönderildi. Onaylandığında İK akademi mülakatını planlar."
            );
      case "mulakat_sonucu_bekleniyor":
        if (!aday.mulakatPlanlananTarihi) {
          return ik
            ? {
                tip: "aksiyon",
                baslik: "Akademi mülakatını planla",
                aciklama:
                  "Belge setleri tamamlandı ve onaylandı. Tarih planlandığında adayı ekleyen kulüp müdürüne bildirim gider.",
                buton: { tur: "islem", label: "Mülakatı planla", onClick: ac("planla") },
              }
            : ikBekleniyor(
                "İK mülakatı planlayacak",
                "Belgeler tamam. Akademi mülakatının tarihi İK tarafından belirlenecek; planlandığında bildirim alırsınız."
              );
        }
        return ik
          ? {
              tip: "aksiyon",
              baslik: "Akademi mülakatı sonucunu gir",
              aciklama:
                "6 kriteri 1 / 0 olarak değerlendirin; en az 4 kriteri karşılayan aday olumlu sonuçlanır.",
              bilgi: { etiket: "Mülakat tarihi", deger: mulakatTarihi! },
              buton: { tur: "islem", label: "Mülakat formunu aç", onClick: ac("sonuc") },
            }
          : ikBekleniyor(
              "Akademi mülakatı planlandı",
              "Mülakat sonrası sonuç İK tarafından girilecek.",
              { etiket: "Mülakat tarihi", deger: mulakatTarihi! }
            );
      case "mulakata_katilmadi":
        return ik
          ? {
              tip: "aksiyon",
              baslik: "Mülakatı yeniden planla",
              aciklama:
                "Aday planlanan akademi mülakatına katılmadı. Yeni tarih planlandığında kulüp müdürüne bildirim gider.",
              buton: { tur: "islem", label: "Yeniden planla", onClick: ac("planla") },
            }
          : ikBekleniyor("Aday mülakata katılmadı", "İK mülakatı yeniden planlayacak.");
      case "akademi_egitimine_hazir":
        return {
          tip: "aksiyon",
          baslik: "Akademi davet bilgilerini gir",
          aciklama: ik
            ? "Akademi dönemini, vergi levhasını ve kıyafet bedenlerini girip kaydedin; aday Akademi Eğitmeni olur."
            : "Akademi dönemini, vergi levhasını ve kıyafet bedenlerini girip İK onayına gönderin.",
          buton: { tur: "islem", label: "Davet formunu aç", onClick: sekme("akademi-sinav") },
        };
      case "akademi_daveti_onayi_bekliyor":
        return ik
          ? {
              tip: "aksiyon",
              baslik: "Akademi davetini onayla",
              aciklama:
                "Kulüp müdürü davet bilgilerini gönderdi. Onaylandığında aday Akademi Eğitmeni olur ve akademiye kaydedilir.",
              bilgi: akademiBilgisi,
              buton: {
                tur: "link",
                label: "Onay talebini incele",
                href: `/onay-bekleyenler?aday=${aday.id}&talep=${aday.id}-akademi-daveti`,
              },
            }
          : ikBekleniyor(
              "Akademi daveti İK onayında",
              "Onaylandığında aday Akademi Eğitmeni olur ve seçilen akademiye kaydedilir.",
              akademiBilgisi
            );
      case "akademiye_katilmadi": {
        const son = aday.katilmadigiAkademiler?.at(-1);
        return {
          tip: "aksiyon",
          baslik: "Başka bir akademiye davet et",
          aciklama:
            "Aday yoklamada gelmedi olarak işaretlendi; Akademi Eğitmeni sözleşmesi kapatıldı. Yeni bir akademiye davet edilebilir ya da süreç sonlandırılabilir.",
          bilgi: son
            ? {
                etiket: "Katılmadığı akademi",
                deger: `${son.akademiAdi} · ${son.tarih}`,
                uyari: true,
              }
            : undefined,
          buton: { tur: "islem", label: "Yeniden davet et", onClick: sekme("akademi-sinav") },
          ikincil: sonlandirIkincil,
        };
      }
      case "akademi_egitmeni": {
        if (sinavSonucu === "Kaldı") {
          return ik
            ? {
                tip: "aksiyon",
                baslik: "Süreci sonlandır",
                aciklama:
                  "Genel akademi sınav sonucu Kaldı; aday eğitmen statüsüne geçirilemez. Süreç sonlandırıldığında kulüp müdürüne bildirim gider.",
                bilgi: { etiket: "Akademi sınavı", deger: "Kaldı", uyari: true },
                buton: {
                  tur: "islem",
                  label: "Süreci sonlandır",
                  onClick: ac("sonlandir"),
                  tehlikeli: true,
                },
              }
            : ikBekleniyor("Akademi sınavından kaldı", "Süreç İK tarafından sonlandırılacak.");
        }
        if (donem && ik && yoklamaAlinabilirMi(donem)) {
          return {
            tip: "aksiyon",
            baslik: "Akademi yoklamasını al",
            aciklama:
              "Akademinin ilk günü geldi. Gelmeyen adaylar işaretlendiğinde sözleşmeleri kapatılır.",
            bilgi: akademiBilgisi,
            buton: { tur: "link", label: "Akademiye git", href: `/akademi/${donem.id}` },
          };
        }
        const bitis = donem && tarihCoz(donem.bitisTarihi);
        if (bitis && bugun() > bitis) {
          return ik
            ? {
                tip: "aksiyon",
                baslik: "Akademi sınav sonucunu yükle",
                aciklama:
                  "Akademi tamamlandı. Sınav sonuçları Excel şablonuyla toplu yüklenir; geçen aday eğitmenliğe geçişe hazır olur.",
                bilgi: akademiBilgisi,
                buton: {
                  tur: "link",
                  label: "Sınav sonucu yükle",
                  href: "/toplu-islemler/akademi-sinav-sonucu",
                },
              }
            : ikBekleniyor(
                "Akademi sınav sonucu bekleniyor",
                "Sonuç İK tarafından yüklenecek.",
                akademiBilgisi
              );
        }
        const baslangic = donem && tarihCoz(donem.baslangicTarihi);
        return {
          tip: "bekleme",
          baslik:
            baslangic && bugun() < baslangic
              ? "Akademi başlangıcı bekleniyor"
              : "Akademi devam ediyor",
          aciklama: "Akademi bittiğinde sınav sonucu yüklenir; geçen aday eğitmenliğe geçirilir.",
          bilgi: akademiBilgisi,
          ikincil: sonlandirIkincil,
        };
      }
      case "akademiyi_tamamladi": {
        if (!ik) {
          return ikBekleniyor(
            "Eğitmenliğe geçiş bekleniyor",
            "Aday akademi sınavını geçti. İK sözleşme tipini seçip eğitmen statüsüne geçirecek."
          );
        }
        const eksik = egitmenBilgileriEksikMi(aday);
        return {
          tip: "aksiyon",
          baslik: "Eğitmenliğe geçir",
          aciklama:
            "Akademi Eğitmeni sözleşmesi kapatılır, seçilen sözleşme tipiyle Eğitmen Self-Employee sözleşmesi tanımlanır; PGM/Flyby ve CMS otomatik güncellenir.",
          ek: eksik ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-white p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Ayakkabı numarası, üst ve alt beden eksik. Kişisel bilgilerdeki Kıyafet Beden
              Bilgisi&apos;ni doldurun.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-500">
                Sözleşme tipi ve alt sözleşme tipi<span className="ml-0.5 text-rose-500">*</span>
              </span>
              <SozlesmeTipiSecimi
                tip={tip}
                altTip={altTip}
                onChange={(t, a) => {
                  setTip(t);
                  setAltTip(a);
                }}
              />
            </div>
          ),
          buton: {
            tur: "islem",
            label: "Eğitmenliğe geçir",
            pasif: eksik || !tip || !altTip,
            onClick: () => tip && onAdayGuncelle?.(egitmeneGecir(aday, tip, altTip, yapan)),
          },
        };
      }
      case "ileride_degerlendirilebilir":
        return {
          tip: "aksiyon",
          baslik: "Sürece yeniden dahil et",
          aciklama: aday.mulakatDegerlendirmesi?.altiAySonraBasvurabilir
            ? "Akademi mülakatı olumsuz sonuçlandı; aday 6 ay sonra tekrar değerlendirilebilir. Dahil edildiğinde İK mülakatı yeniden planlar."
            : "Aday yeniden değerlendirilebilir olarak işaretlendi. Dahil edildiğinde İK mülakatı yeniden planlar.",
          bilgi: aday.gorusmeSonucuTarihi
            ? { etiket: "Değerlendirme tarihi", deger: aday.gorusmeSonucuTarihi }
            : undefined,
          buton: {
            tur: "islem",
            label: "Yeniden dahil et",
            onClick: () => onAdayGuncelle?.(sureceYenidenDahilEt(aday, yapan)),
          },
        };
      case "egitmen": {
        const s = enAcilSertifika(aday);
        const durum = s && vizeDurumu(s);
        if (s && (durum === "gecmis" || durum === "yaklasiyor")) {
          const kalan = vizeKalanGun(s) ?? 0;
          return {
            tip: "aksiyon",
            baslik: "Sertifika vizesini yenile",
            aciklama:
              "Yeni vize bilgisi ve belgesi girilip İK onayına gönderildiğinde uyarı kalkar.",
            bilgi: {
              etiket: `${s.brans} vize bitişi`,
              deger: `${s.vizeBitisTarihi} · ${kalan < 0 ? `${-kalan} gün önce doldu` : `${kalan} gün kaldı`}`,
              uyari: durum === "gecmis",
            },
            buton: {
              tur: "islem",
              label: "Sertifikalara git",
              onClick: sekme("kademe-federasyon"),
            },
          };
        }
        return {
          tip: "bitti",
          baslik: "Bekleyen işlem yok",
          aciklama: "Eğitmen aktif; sertifika vizeleri geçerli.",
        };
      }
      case "reddedildi":
        return {
          tip: "bitti",
          baslik: "Süreç tamamlandı",
          aciklama: "Akademi mülakatı olumsuz sonuçlandı.",
          bilgi: aday.olumsuzOlmaNedeni
            ? { etiket: "Açıklama", deger: aday.olumsuzOlmaNedeni }
            : undefined,
        };
      case "surec_sonlandirildi":
        return {
          tip: "bitti",
          baslik: "Süreç sonlandırıldı",
          aciklama: aday.surecSonlandirma?.aciklama ?? "Adayın süreci sonlandırıldı.",
          bilgi: aday.surecSonlandirma
            ? {
                etiket: aday.surecSonlandirma.neden,
                deger: `${aday.surecSonlandirma.tarih} · ${aday.surecSonlandirma.yapan}`,
              }
            : undefined,
        };
      case "pasif":
        return {
          tip: "bitti",
          baslik: "Pasif eğitmen",
          aciklama: aday.fesihSekli ?? "Eğitmenin çıkışı yapıldı.",
          bilgi: aday.cikisTarihi ? { etiket: "Çıkış tarihi", deger: aday.cikisTarihi } : undefined,
        };
      default:
        return { tip: "bitti", baslik: "Bekleyen işlem yok", aciklama: "" };
    }
  })();

  const ust = UST_BASLIK[kart.tip];
  const BilgiIkonu = kart.tip === "bekleme" ? Clock : CalendarDays;

  const butonCiz = (b: Buton, ana: boolean) => {
    const sinif = ana
      ? `flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          b.tur === "islem" && b.tehlikeli
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "bg-brand text-white hover:bg-brand-dark"
        } disabled:cursor-not-allowed disabled:opacity-40`
      : `text-sm font-semibold hover:underline ${
          b.tur === "islem" && b.tehlikeli ? "text-rose-600" : "text-zinc-600"
        }`;
    const icerik = (
      <>
        {b.label}
        {ana && <ArrowRight className="h-4 w-4" />}
      </>
    );
    return b.tur === "link" ? (
      <Link href={b.href} className={sinif}>
        {icerik}
      </Link>
    ) : (
      <button onClick={b.onClick} disabled={b.pasif} className={sinif}>
        {icerik}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <span className={`h-2 w-2 shrink-0 rounded-full ${ust.nokta}`} />
        {ust.metin}
      </div>
      <div className="flex items-start gap-2">
        {kart.tip === "bitti" && (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        )}
        <h3 className="text-base font-semibold text-zinc-900">{kart.baslik}</h3>
      </div>
      {kart.aciklama && <p className="text-sm text-zinc-500">{kart.aciklama}</p>}
      {kart.bilgi && (
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2.5">
          <BilgiIkonu
            className={`h-4 w-4 shrink-0 ${kart.bilgi.uyari ? "text-rose-600" : "text-zinc-400"}`}
          />
          <div className="min-w-0">
            <div className="text-xs text-zinc-400">{kart.bilgi.etiket}</div>
            <div
              className={`text-sm font-medium ${kart.bilgi.uyari ? "text-rose-600" : "text-zinc-800"}`}
            >
              {kart.bilgi.deger}
            </div>
          </div>
        </div>
      )}
      {duzenlenebilir && kart.ek}
      {duzenlenebilir && kart.buton && butonCiz(kart.buton, true)}
      {duzenlenebilir && kart.ikincil && (
        <div className="text-center">{butonCiz(kart.ikincil, false)}</div>
      )}

      {pencere === "planla" && onAdayGuncelle && (
        <MulakatPlanlaModal
          aday={aday}
          onClose={() => setPencere(null)}
          onAdayGuncelle={onAdayGuncelle}
        />
      )}
      {pencere === "sonuc" && onAdayGuncelle && (
        <MulakatSonucuModal
          aday={aday}
          kisiselNotGorunur={ik}
          onClose={() => setPencere(null)}
          onKaydet={(d) => {
            onAdayGuncelle(degerlendirmeyiUygula(aday, d, yapan));
            setPencere(null);
          }}
        />
      )}
      {pencere === "sonlandir" && onAdayGuncelle && (
        <SurecSonlandirModal
          aday={aday}
          varsayilanNeden={
            sinavSonucu === "Kaldı"
              ? "Akademi sınavlarından başarısız"
              : aday.surecDurumu === "akademiye_katilmadi"
                ? "Akademiye katılmadı"
                : undefined
          }
          onClose={() => setPencere(null)}
          onAdayGuncelle={onAdayGuncelle}
        />
      )}
    </div>
  );
}
