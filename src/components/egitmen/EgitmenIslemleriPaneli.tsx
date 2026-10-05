"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Building2, FileSignature, LogOut, X } from "lucide-react";
import { SozlesmeTipiSecimi } from "@/components/egitmen/SozlesmeTipiSecimi";
import { bugun, inputTarihindenCevir, inputTarihine, tarihYaz } from "@/lib/akademi";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { sozlesmeDegistir, sozlesmeleriKapat } from "@/lib/egitmenGecis";
import { FESIH_SEKLI_SECENEKLERI } from "@/lib/egitmenSecenekleri";
import { KULUPLER } from "@/lib/kulupler";
import type { AdayEgitmen, IstihdamTipi } from "@/lib/types";

const girdi =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type Islem = "kulup" | "sozlesme" | "cikis";

const BASLIK: Record<Islem, string> = {
  kulup: "Kulüp Değiştir",
  sozlesme: "Sözleşme Tipini Değiştir",
  cikis: "İşten Çıkar",
};

function Alan({
  label,
  zorunlu,
  children,
}: {
  label: string;
  zorunlu?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-600">
        {label}
        {zorunlu && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </div>
  );
}

/**
 * Aktif eğitmenin profilinde, Sonraki Aksiyon kartının altında her zaman duran eğitmen
 * işlemleri (PRD §11): kulüp değişikliği, sözleşme tipi değişikliği ve işten çıkış. Her işlem
 * sözleşme ve kulüp geçmişine tarihiyle yazılır, ilgili kulüp müdürlerine bildirim gider.
 */
export function EgitmenIslemleriPaneli({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const [acik, setAcik] = useState<Islem | null>(null);
  const [tarih, setTarih] = useState(inputTarihine(tarihYaz(bugun())));
  const [yeniKulup, setYeniKulup] = useState("");
  const [neden, setNeden] = useState("");
  const [tip, setTip] = useState<IstihdamTipi | "">("");
  const [altTip, setAltTip] = useState("");
  const [fesihSekli, setFesihSekli] = useState("");
  const yapan = `${currentUser.ad} (${currentUser.rol})`;
  const adSoyad = `${aday.ad} ${aday.soyad}`;

  const ac = (i: Islem) => {
    setTarih(inputTarihine(tarihYaz(bugun())));
    setYeniKulup("");
    setNeden("");
    setTip(aday.istihdamTipi ?? "");
    setAltTip(aday.altSozlesmeTipi ?? "");
    setFesihSekli("");
    setAcik(i);
  };
  const kapat = () => setAcik(null);

  const kmBildirimi = (kulup: string, baslik: string, mesaj: string, gecerlilik: string) =>
    bildirimEkle({
      // Prototipte tek bir KM kullanıcısı var; bildirim başlığı ilgili kulübü belirtir.
      aliciRol: "Kulüp Müdürü",
      aliciAd: KULLANICILAR["Kulüp Müdürü"].ad,
      baslik: `${kulup}: ${baslik}`,
      mesaj,
      planlayan: yapan,
      tarih: gecerlilik,
      adayId: aday.id,
    });

  const gecerlilik = tarih ? inputTarihindenCevir(tarih) : "";

  const kulupDegistir = () => {
    const eski = aday.kulup;
    onAdayGuncelle({
      ...aday,
      kulup: yeniKulup,
      sozlesmeGecmisi: sozlesmeDegistir(
        aday,
        {
          kulup: yeniKulup,
          sozlesmeTipi: aday.istihdamTipi ?? "Tam Zamanlı",
          altSozlesmeTipi: aday.altSozlesmeTipi,
        },
        gecerlilik,
        `Kulüp değişikliği: ${neden.trim()}`
      ),
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih: tarihYaz(bugun()),
          aksiyon: `Kulüp değiştirildi: ${eski} → ${yeniKulup} (geçerlilik ${gecerlilik}); Flyby ve CMS'e yansıtıldı`,
          yapan,
          detay: neden.trim(),
        },
      ],
    });
    // PRD 11.1: eski ve yeni kulübün KM/KMY'lerine bilgi bildirimi.
    const mesaj = `${eski} → ${yeniKulup}, geçerlilik tarihi ${gecerlilik}. Neden: ${neden.trim()}`;
    kmBildirimi(eski, `${adSoyad} kulübünüzden ayrılıyor`, mesaj, gecerlilik);
    kmBildirimi(yeniKulup, `${adSoyad} kulübünüze katılıyor`, mesaj, gecerlilik);
    kapat();
  };

  const sozlesmeTipiDegistir = () => {
    if (!tip) return;
    onAdayGuncelle({
      ...aday,
      istihdamTipi: tip,
      altSozlesmeTipi: altTip,
      sozlesmeGecmisi: sozlesmeDegistir(
        aday,
        { kulup: aday.kulup, sozlesmeTipi: tip, altSozlesmeTipi: altTip },
        gecerlilik,
        "Sözleşme tipi değişikliği"
      ),
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih: tarihYaz(bugun()),
          aksiyon: `Sözleşme tipi değiştirildi: ${aday.altSozlesmeTipi ?? aday.istihdamTipi ?? "—"} → ${altTip} (${tip}, geçerlilik ${gecerlilik}); Flyby'daki sözleşmeye yansıtıldı`,
          yapan,
        },
      ],
    });
    kapat();
  };

  const istenCikar = () => {
    // PRD §11.3: statü Pasif olur; kayıt, belgeler ve geçmiş Themis'te saklanmaya devam eder.
    onAdayGuncelle({
      ...aday,
      surecDurumu: "pasif",
      cikisTarihi: gecerlilik,
      fesihSekli,
      fesihNedeni: neden.trim() || undefined,
      sozlesmeGecmisi: sozlesmeleriKapat(aday.sozlesmeGecmisi, gecerlilik, fesihSekli),
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih: tarihYaz(bugun()),
          aksiyon: `İşten çıkış yapıldı (${fesihSekli}, çıkış tarihi ${gecerlilik}); Eğitmen Self-Employee sözleşmesi deaktive edildi, statü Pasif Eğitmen oldu`,
          yapan,
          detay: neden.trim() || undefined,
        },
      ],
    });
    kmBildirimi(
      aday.kulup,
      `${adSoyad} için işten çıkış yapıldı`,
      `Çıkış tarihi ${gecerlilik}. Fesih şekli: ${fesihSekli}.${neden.trim() ? ` ${neden.trim()}` : ""}`,
      gecerlilik
    );
    kapat();
  };

  const kaydedilebilir =
    !!tarih &&
    (acik === "kulup"
      ? !!yeniKulup && !!neden.trim()
      : acik === "sozlesme"
        ? !!tip && !!altTip && (tip !== aday.istihdamTipi || altTip !== aday.altSozlesmeTipi)
        : !!fesihSekli);

  const buton =
    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-zinc-900">Eğitmen İşlemleri</div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => ac("kulup")}
          className={`${buton} border-zinc-200 text-zinc-700 hover:bg-zinc-50`}
        >
          <Building2 className="h-4 w-4 text-zinc-400" />
          Kulüp Değiştir
        </button>
        <button
          onClick={() => ac("sozlesme")}
          className={`${buton} border-zinc-200 text-zinc-700 hover:bg-zinc-50`}
        >
          <FileSignature className="h-4 w-4 text-zinc-400" />
          Sözleşme Tipini Değiştir
        </button>
        <button
          onClick={() => ac("cikis")}
          className={`${buton} border-rose-200 text-rose-600 hover:bg-rose-50`}
        >
          <LogOut className="h-4 w-4" />
          İşten Çıkar
        </button>
      </div>

      {acik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={kapat}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{BASLIK[acik]}</h2>
                <p className="text-xs text-zinc-400">
                  {adSoyad} · {aday.kulup} · {aday.altSozlesmeTipi ?? aday.istihdamTipi ?? "—"}
                </p>
              </div>
              <button onClick={kapat} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              {acik === "kulup" && (
                <>
                  <p className="text-sm text-zinc-500">
                    Geçerlilik tarihinde kulüp bilgisi Flyby ve CMS&apos;te güncellenir; eski ve
                    yeni kulübün müdürlerine bildirim gider.
                  </p>
                  <Alan label="Yeni kulüp" zorunlu>
                    <select
                      value={yeniKulup}
                      onChange={(e) => setYeniKulup(e.target.value)}
                      className={girdi}
                    >
                      <option value="">Seçiniz</option>
                      {KULUPLER.filter((k) => k !== aday.kulup).map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </Alan>
                  <Alan label="Geçerlilik tarihi" zorunlu>
                    <input
                      type="date"
                      value={tarih}
                      onChange={(e) => setTarih(e.target.value)}
                      className={girdi}
                    />
                  </Alan>
                  <Alan label="Değişiklik nedeni" zorunlu>
                    <textarea
                      value={neden}
                      onChange={(e) => setNeden(e.target.value)}
                      rows={2}
                      className={girdi}
                    />
                  </Alan>
                </>
              )}

              {acik === "sozlesme" && (
                <>
                  <p className="text-sm text-zinc-500">
                    Değişiklik geçerlilik tarihinde Flyby&apos;daki sözleşmeye yansır; sözleşme
                    geçmişine tarihiyle yazılır.
                  </p>
                  <Alan label="Yeni sözleşme tipi ve alt sözleşme tipi" zorunlu>
                    <SozlesmeTipiSecimi
                      tip={tip}
                      altTip={altTip}
                      onChange={(t, a) => {
                        setTip(t);
                        setAltTip(a);
                      }}
                    />
                  </Alan>
                  <Alan label="Geçerlilik tarihi" zorunlu>
                    <input
                      type="date"
                      value={tarih}
                      onChange={(e) => setTarih(e.target.value)}
                      className={girdi}
                    />
                  </Alan>
                </>
              )}

              {acik === "cikis" && (
                <>
                  <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Bu işlem geri alınamaz. Çıkış tarihinde Eğitmen Self-Employee sözleşmesi
                    deaktive edilir, eğitmen Pasif olur; kulüp müdürüne bildirim gider.
                  </div>
                  <Alan label="İşten çıkış tarihi" zorunlu>
                    <input
                      type="date"
                      value={tarih}
                      onChange={(e) => setTarih(e.target.value)}
                      className={girdi}
                    />
                  </Alan>
                  <Alan label="Fesih şekli" zorunlu>
                    <select
                      value={fesihSekli}
                      onChange={(e) => setFesihSekli(e.target.value)}
                      className={girdi}
                    >
                      <option value="">Seçiniz</option>
                      {FESIH_SEKLI_SECENEKLERI.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Alan>
                  <Alan label="Fesih nedeni">
                    <textarea
                      value={neden}
                      onChange={(e) => setNeden(e.target.value)}
                      rows={2}
                      placeholder="İsteğe bağlı"
                      className={girdi}
                    />
                  </Alan>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button
                onClick={kapat}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                onClick={
                  acik === "kulup"
                    ? kulupDegistir
                    : acik === "sozlesme"
                      ? sozlesmeTipiDegistir
                      : istenCikar
                }
                disabled={!kaydedilebilir}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                  acik === "cikis"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-brand hover:bg-brand-dark"
                }`}
              >
                {acik === "cikis" ? "İşten Çıkarmayı Onayla" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
