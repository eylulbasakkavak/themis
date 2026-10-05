"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Save } from "lucide-react";
import {
  AKADEMI_MULAKAT_SECENEKLERI,
  ALT_SOZLESME_TIPLERI,
  AYAKKABI_NUMARALARI,
  BEDENLER,
  CINSIYET_SECENEKLERI,
  EGITIM_BILGISI_SECENEKLERI,
  FEDERASYON_KADEME_SECENEKLERI,
  ISTIHDAM_TIPLERI,
  telefonMaskele,
} from "@/lib/egitmenSecenekleri";
import { fitnessSertifikasi, VIZE_DURUMU_BILGI, vizeDurumu } from "@/lib/sertifika";
import type { AdayEgitmen } from "@/lib/types";

function Bolum({
  baslik,
  aksiyon,
  children,
}: {
  baslik: string;
  aksiyon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{baslik}</h3>
        {aksiyon}
      </div>
      {children}
    </div>
  );
}

function Alan({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-zinc-900">{children}</div>
    </div>
  );
}

function DuzenlenebilirMetin({
  label,
  value,
  onChange,
  type = "text",
  duzenle,
  goster,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  duzenle: boolean;
  goster?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      {duzenle ? (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
        />
      ) : (
        <p className="mt-1 text-sm font-semibold text-zinc-900">{goster ?? value ?? "—"}</p>
      )}
    </div>
  );
}

function DuzenlenebilirSecim({
  label,
  value,
  secenekler,
  onChange,
  duzenle,
}: {
  label: string;
  value?: string;
  secenekler: string[];
  onChange: (v: string) => void;
  duzenle: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      {duzenle ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="">Seçiniz</option>
          {secenekler.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-1 text-sm font-semibold text-zinc-900">{value || "—"}</p>
      )}
    </div>
  );
}

export function EgitmenDetayIcerik({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  const [duzenle, setDuzenle] = useState(false);
  const [taslak, setTaslak] = useState(aday);

  const duzenlemeyeBasla = () => {
    setTaslak(aday);
    setDuzenle(true);
  };

  const kaydet = () => {
    onAdayGuncelle?.(taslak);
    setDuzenle(false);
  };

  const fitness = fitnessSertifikasi(aday);
  const grid = "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2";
  const altBaslik = "mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400";

  return (
    <div className="flex flex-col gap-4">
      <Bolum
        baslik="Kişisel ve Mesleki Bilgiler"
        aksiyon={
          !duzenle && onAdayGuncelle ? (
            <button
              onClick={duzenlemeyeBasla}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Düzenle
            </button>
          ) : undefined
        }
      >
        <h4 className={altBaslik}>Kişisel</h4>
        {/* İşe alım ve ders verebilme buna bağlı olduğu için bölümün en başında (PRD 12.1). */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <DuzenlenebilirSecim
              label="Federasyon Durumu"
              value={taslak.federasyonKademeDurumu}
              secenekler={FEDERASYON_KADEME_SECENEKLERI}
              duzenle={duzenle}
              onChange={(v) => setTaslak({ ...taslak, federasyonKademeDurumu: v || undefined })}
            />
          </div>
          {fitness ? (
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Onaylı Fitness Kademesi
              </div>
              <div className="mt-1 flex items-center justify-end gap-1.5 text-sm font-semibold text-zinc-900">
                <span
                  className={`h-2 w-2 rounded-full ${VIZE_DURUMU_BILGI[vizeDurumu(fitness)].nokta}`}
                  title={VIZE_DURUMU_BILGI[vizeDurumu(fitness)].label}
                />
                {fitness.kademe}. Kademe
              </div>
            </div>
          ) : null}
        </div>
        <div className={grid}>
          <Alan label="Themis ID">
            <span className="font-mono">{aday.themisId}</span>
          </Alan>
          <Alan label="Ad Soyad">
            {aday.ad} {aday.soyad}
          </Alan>
          <DuzenlenebilirMetin
            label="TC Kimlik No"
            value={taslak.tcKimlikNo}
            goster={aday.tcKimlikNo}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, tcKimlikNo: v || undefined })}
          />
          <DuzenlenebilirMetin
            label="Doğum Tarihi"
            type="date"
            value={taslak.dogumTarihi}
            goster={aday.dogumTarihi}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, dogumTarihi: v || undefined })}
          />
          <DuzenlenebilirSecim
            label="Cinsiyet"
            value={taslak.cinsiyet}
            secenekler={CINSIYET_SECENEKLERI}
            duzenle={duzenle}
            onChange={(v) =>
              setTaslak({ ...taslak, cinsiyet: (v as AdayEgitmen["cinsiyet"]) || undefined })
            }
          />
          <Alan label="Telefon">{telefonMaskele(aday.telefon)}</Alan>
          <Alan label="E-posta">{aday.eposta || "—"}</Alan>
        </div>

        <h4 className={`${altBaslik} mt-6 border-t border-zinc-100 pt-5`}>Sözleşme ve Akademi</h4>
        <div className={grid}>
          <DuzenlenebilirSecim
            label="Sözleşme Tipi"
            value={taslak.istihdamTipi}
            secenekler={[...ISTIHDAM_TIPLERI]}
            duzenle={duzenle}
            onChange={(v) =>
              setTaslak({
                ...taslak,
                istihdamTipi: (v as AdayEgitmen["istihdamTipi"]) || undefined,
              })
            }
          />
          <DuzenlenebilirSecim
            label="Alt Sözleşme Tipi"
            value={taslak.altSozlesmeTipi}
            secenekler={ALT_SOZLESME_TIPLERI}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, altSozlesmeTipi: v || undefined })}
          />
          <Alan label="Branş (Flyby)">{aday.sozlesmeTipi ?? "—"}</Alan>
          <DuzenlenebilirSecim
            label="Akademi Tipi"
            value={taslak.akademiMulakatTipi}
            secenekler={AKADEMI_MULAKAT_SECENEKLERI}
            duzenle={duzenle}
            onChange={(v) =>
              setTaslak({
                ...taslak,
                akademiMulakatTipi: (v as AdayEgitmen["akademiMulakatTipi"]) || undefined,
              })
            }
          />
          <Alan label="Akademi Başlangıç Tarihi">{aday.yonlendirilecekAkademiTarihi || "—"}</Alan>
        </div>
        <h4 className={`${altBaslik} mt-6 border-t border-zinc-100 pt-5`}>Mesleki</h4>
        <div className={grid}>
          <Alan label="Görev Alacağı Kulüp">{aday.kulup}</Alan>
          <DuzenlenebilirMetin
            label="MAC Campus / CMS ID"
            value={taslak.macCampusId}
            goster={aday.macCampusId}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, macCampusId: v || undefined })}
          />
          <DuzenlenebilirSecim
            label="Öğrenim Durumu"
            value={taslak.egitimBilgisi}
            secenekler={EGITIM_BILGISI_SECENEKLERI}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, egitimBilgisi: v || undefined })}
          />
          <DuzenlenebilirMetin
            label="Mezuniyet Tarihi"
            type="date"
            value={taslak.mezuniyetTarihi}
            goster={aday.mezuniyetTarihi}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, mezuniyetTarihi: v || undefined })}
          />
          <Alan label="Antrenörlük Geçmişi">{aday.antrenorlukGecmisiVarMi || "—"}</Alan>
        </div>
      </Bolum>

      <Bolum baslik="Kıyafet Beden Bilgisi">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <DuzenlenebilirSecim
            label="Üst Beden"
            value={taslak.ustBeden}
            secenekler={BEDENLER}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, ustBeden: v || undefined })}
          />
          <DuzenlenebilirSecim
            label="Alt Beden"
            value={taslak.altBeden}
            secenekler={BEDENLER}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, altBeden: v || undefined })}
          />
          <DuzenlenebilirSecim
            label="Ayakkabı Numarası"
            value={taslak.ayakkabiNo}
            secenekler={AYAKKABI_NUMARALARI}
            duzenle={duzenle}
            onChange={(v) => setTaslak({ ...taslak, ayakkabiNo: v || undefined })}
          />
        </div>
      </Bolum>

      {duzenle && (
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            onClick={() => setDuzenle(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
          >
            Vazgeç
          </button>
          <button
            onClick={kaydet}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Save className="h-3.5 w-3.5" />
            Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
