"use client";

import { useState, type ReactNode } from "react";
import { Lock, Receipt, Upload } from "lucide-react";
import { Badge } from "@/components/Badge";
import {
  akademiDavetiOnayKaydi,
  bugun,
  kontenjanDoluMu as kontenjanDolu,
  tarihCoz,
} from "@/lib/akademi";
import { useAkademiDonemleri } from "@/lib/AkademiDonemleriContext";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, KULLANICILAR, useCurrentUser } from "@/lib/CurrentUserContext";
import { AYAKKABI_NUMARALARI, BEDENLER } from "@/lib/egitmenSecenekleri";
import { belgeDurumuBilgi } from "@/lib/status";
import type { AdayEgitmen, SurecDurumu } from "@/lib/types";

const EGITMEN_ASAMALARI: SurecDurumu[] = [
  "akademi_egitmeni",
  "akademiyi_tamamladi",
  "egitmen",
  "pasif",
];

function bugununTarihi() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function Etiket({ children, zorunlu = true }: { children: ReactNode; zorunlu?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-zinc-600">
      {children}
      {zorunlu && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

function Secim({
  value,
  onChange,
  secenekler,
}: {
  value: string;
  onChange: (v: string) => void;
  secenekler: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
    >
      <option value="">Seçiniz</option>
      {secenekler.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-0.5 font-medium text-zinc-800">{children}</div>
    </div>
  );
}

/** Akademiye Davet (PRD 6) — mülakatı olumlu sonuçlanan adayın akademiye giriş bilgileri. */
export function AkademiEgitimineDavet({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const { currentUser } = useCurrentUser();
  const { bildirimEkle } = useBildirimler();
  const { donemler, adayKaydet } = useAkademiDonemleri();
  // İK (ve üst yetkili roller) kaydettiğinde ayrı onay gerekmez; KM/KMY onaya gönderir.
  const girmeYetkisiVar = ikYetkisiVarMi(currentUser.rol);
  const [bmKonaklama, setBmKonaklama] = useState<"Evet" | "Hayır" | "">(
    aday.bmOnayliKonaklama ?? ""
  );
  const [akademiHesabiAcik, setAkademiHesabiAcik] = useState(!!aday.akademiHesabiAcildiMi);
  const [akademiUserId, setAkademiUserId] = useState(aday.akademiHesapUserId ?? "");
  // Akademiye katılmayan aday yeni bir akademiye davet edilir; eski seçim taşınmaz.
  const yenidenDavet = aday.surecDurumu === "akademiye_katilmadi";
  const [akademiDonemiId, setAkademiDonemiId] = useState(
    yenidenDavet ? "" : (aday.akademiDonemiId ?? "")
  );
  const [ayakkabiNo, setAyakkabiNo] = useState(aday.ayakkabiNo ?? "");
  const [ustBeden, setUstBeden] = useState(aday.ustBeden ?? "");
  const [altBeden, setAltBeden] = useState(aday.altBeden ?? "");

  const akademiDavetiDuzenlenebilir =
    aday.surecDurumu === "akademi_egitimine_hazir" || yenidenDavet;
  const akademiDavetiOnayBekliyor = aday.surecDurumu === "akademi_daveti_onayi_bekliyor";
  const akademiDavetiTamamlandi = EGITMEN_ASAMALARI.includes(aday.surecDurumu);
  const uygunDonemler = donemler.filter(
    (d) =>
      !d.iptal &&
      // Başlamış ya da tamamlanmış akademiye davet edilemez.
      (tarihCoz(d.baslangicTarihi) ?? bugun()) > bugun() &&
      (!aday.akademiMulakatTipi || d.tip === aday.akademiMulakatTipi) &&
      !aday.katilmadigiAkademiler?.some((k) => k.akademiId === d.id)
  );
  const seciliDonem = donemler.find((d) => d.id === akademiDonemiId);
  const kayitliDonem = donemler.find((d) => d.id === aday.akademiDonemiId);

  const zorunlularTamam =
    aday.vergiLevhasi?.durum === "yuklendi" &&
    !!bmKonaklama &&
    (!akademiHesabiAcik || !!akademiUserId.trim()) &&
    !!seciliDonem &&
    !kontenjanDolu(seciliDonem) &&
    !!ayakkabiNo &&
    !!ustBeden &&
    !!altBeden;

  const vergiLevhasiYukle = () => {
    onAdayGuncelle?.({
      ...aday,
      vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: bugununTarihi() },
    });
  };

  const davetBilgileri = (): Partial<AdayEgitmen> => ({
    bmOnayliKonaklama: bmKonaklama || undefined,
    akademiHesabiAcildiMi: akademiHesabiAcik,
    akademiHesapUserId: akademiHesabiAcik ? akademiUserId.trim() : undefined,
    akademiDonemiId,
    // Seçilen akademinin tarihi "Akademi Başlangıç Tarihi"ne otomatik yansır.
    yonlendirilecekAkademiTarihi: seciliDonem?.baslangicTarihi,
    ayakkabiNo,
    ustBeden,
    altBeden,
    akademiDavetiRedSebebi: undefined,
  });

  const kaydet = () => {
    if (!zorunlularTamam || !seciliDonem) return;
    const yapan = `${currentUser.ad} (${currentUser.rol})`;

    if (girmeYetkisiVar) {
      adayKaydet(seciliDonem.id, aday.id);
      onAdayGuncelle?.({
        ...aday,
        ...davetBilgileri(),
        surecDurumu: "akademi_egitmeni",
        aksiyonGecmisi: [
          ...aday.aksiyonGecmisi,
          { tarih: bugununTarihi(), aksiyon: akademiDavetiOnayKaydi(seciliDonem.ad), yapan },
        ],
      });
      return;
    }

    onAdayGuncelle?.({
      ...aday,
      ...davetBilgileri(),
      surecDurumu: "akademi_daveti_onayi_bekliyor",
      aksiyonGecmisi: [
        ...aday.aksiyonGecmisi,
        {
          tarih: bugununTarihi(),
          aksiyon: `Akademi daveti bilgileri girildi (${seciliDonem.ad}) ve İK onayına gönderildi`,
          yapan,
        },
      ],
    });
    bildirimEkle({
      aliciRol: "İK",
      aliciAd: KULLANICILAR["İK"].ad,
      baslik: `${aday.ad} ${aday.soyad} için akademi daveti onay bekliyor`,
      mesaj: `${seciliDonem.ad} için akademi davet bilgileri onaya gönderildi, incelemeniz gerekiyor.`,
      planlayan: yapan,
      tarih: bugununTarihi(),
      adayId: aday.id,
      link: `/onay-bekleyenler?aday=${aday.id}`,
    });
  };

  const davetIcerigi = (
    <>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Receipt className="h-4 w-4 text-zinc-400" />
            <div>
              <div className="text-sm font-medium text-zinc-800">
                Vergi Levhası
                {akademiDavetiDuzenlenebilir && <span className="ml-0.5 text-rose-500">*</span>}
              </div>
              {aday.vergiLevhasi?.tarih && (
                <div className="text-xs text-zinc-400">{aday.vergiLevhasi.tarih}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              label={belgeDurumuBilgi[aday.vergiLevhasi?.durum ?? "yuklenmedi"].label}
              tone={belgeDurumuBilgi[aday.vergiLevhasi?.durum ?? "yuklenmedi"].tone}
            />
            {akademiDavetiDuzenlenebilir && (
              <button
                onClick={vergiLevhasiYukle}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {aday.vergiLevhasi?.durum === "yuklendi" ? "Yeniden Yükle" : "Yükle"}
              </button>
            )}
          </div>
        </div>
      </div>

      {!!aday.katilmadigiAkademiler?.length && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {aday.katilmadigiAkademiler.map((k) => (
            <span key={k.akademiId}>
              <span className="font-semibold">Akademiye katılmadı – {k.tarih}</span> ({k.akademiAdi}
              )
            </span>
          ))}
          {yenidenDavet && <span>Yeni bir akademiye davet etmek için bilgileri güncelleyin.</span>}
        </div>
      )}

      {akademiDavetiDuzenlenebilir ? (
        <div className="mt-4 flex flex-col gap-4">
          {aday.akademiDavetiRedSebebi && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <span className="font-semibold">Reddedildi:</span> {aday.akademiDavetiRedSebebi}.
              Düzelt ve yeniden gönder.
            </div>
          )}

          <div>
            <Etiket>BM onaylı kulüp bütçesinden konaklama yapılacak mı?</Etiket>
            <div className="flex gap-2">
              {(["Evet", "Hayır"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setBmKonaklama(v)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    bmKonaklama === v
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex w-fit items-center gap-2 text-sm font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={akademiHesabiAcik}
                onChange={(e) => setAkademiHesabiAcik(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Akademi hesabı açıldı mı?
            </label>
            {akademiHesabiAcik && (
              <div className="mt-2">
                <Etiket>Akademi User ID</Etiket>
                <input
                  value={akademiUserId}
                  onChange={(e) => setAkademiUserId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            )}
          </div>

          <div>
            <Etiket>Hangi akademiye dahil edilecek?</Etiket>
            <select
              value={akademiDonemiId}
              onChange={(e) => setAkademiDonemiId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Seçiniz</option>
              {uygunDonemler.map((d) => (
                <option key={d.id} value={d.id} disabled={kontenjanDolu(d)}>
                  {d.ad} · {d.baslangicTarihi}
                  {kontenjanDolu(d)
                    ? " — Kontenjan Dolu"
                    : ` (${d.kayitlilar.length}/${d.kontenjan})`}
                </option>
              ))}
            </select>
            {seciliDonem && (
              <p className="mt-1 text-xs text-zinc-500">
                Akademi Başlangıç Tarihi:{" "}
                <span className="font-semibold text-zinc-700">{seciliDonem.baslangicTarihi}</span>
              </p>
            )}
            {uygunDonemler.length === 0 && (
              <p className="mt-1 text-xs text-rose-500">
                {aday.akademiMulakatTipi ?? "Bu"} tipinde tanımlı akademi yok; Akademi menüsünden
                yeni akademi eklenmeli.
              </p>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs text-zinc-400">
              Ayakkabı ve kıyafet teslimatı akademiden mezun olmadan önce yapılır.
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Etiket>Ayakkabı Numarası</Etiket>
                <Secim
                  value={ayakkabiNo}
                  onChange={setAyakkabiNo}
                  secenekler={AYAKKABI_NUMARALARI}
                />
              </div>
              <div>
                <Etiket>Üst Beden</Etiket>
                <Secim value={ustBeden} onChange={setUstBeden} secenekler={BEDENLER} />
              </div>
              <div>
                <Etiket>Alt Beden</Etiket>
                <Secim value={altBeden} onChange={setAltBeden} secenekler={BEDENLER} />
              </div>
            </div>
          </div>

          <button
            onClick={kaydet}
            disabled={!zorunlularTamam}
            className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {girmeYetkisiVar ? "Kaydet" : "Onaya Gönder"}
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm sm:grid-cols-3">
          <Bilgi label="BM Onaylı Konaklama">{aday.bmOnayliKonaklama ?? "—"}</Bilgi>
          <Bilgi label="Akademi Hesabı">
            {aday.akademiHesabiAcildiMi ? `Açıldı (${aday.akademiHesapUserId})` : "Açılmadı"}
          </Bilgi>
          <Bilgi label="Akademi">{kayitliDonem?.ad ?? "—"}</Bilgi>
          <Bilgi label="Akademi Tipi">{aday.akademiMulakatTipi ?? "—"}</Bilgi>
          <Bilgi label="Akademi Başlangıç Tarihi">{aday.yonlendirilecekAkademiTarihi ?? "—"}</Bilgi>
          <Bilgi label="Ayakkabı / Beden">
            {aday.ayakkabiNo ?? "—"} · Üst {aday.ustBeden ?? "—"} · Alt {aday.altBeden ?? "—"}
          </Bilgi>
        </div>
      )}
    </>
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">Akademiye Davet</h3>
        {aday.gorusmeSonucu === "Olumlu" && (
          <div className="flex items-center gap-2">
            {akademiDavetiTamamlandi && <Badge label="Onaylandı" tone="green" />}
            {akademiDavetiOnayBekliyor && <Badge label="Onay Bekliyor" tone="orange" />}
            {!akademiDavetiTamamlandi &&
              !akademiDavetiOnayBekliyor &&
              aday.akademiDavetiRedSebebi && <Badge label="Reddedildi" tone="red" />}
          </div>
        )}
      </div>

      {aday.gorusmeSonucu !== "Olumlu" ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-400">
          <Lock className="h-4 w-4 shrink-0" />
          Bu adım, akademi mülakatı sonucu &quot;Olumlu&quot; olduğunda açılır.
        </div>
      ) : (
        davetIcerigi
      )}
    </div>
  );
}
