"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

type Kategori = "Aday & Eğitmen" | "Akademi & Sınav";

type Islem = {
  id: string;
  kategori: Kategori;
  baslik: string;
  aciklama: string;
  icon: typeof Users;
  href: string;
  etiket: string;
};

const ISLEMLER: Islem[] = [
  {
    id: "aday-ekle",
    kategori: "Aday & Eğitmen",
    baslik: "Toplu Aday Ekle",
    aciklama: "Excel şablonundaki adayları tek işlemle Themis'e aktarın.",
    icon: Users,
    href: "/toplu-islemler/aday-ekle",
    etiket: "Excel · Aday bazlı",
  },
  {
    id: "mulakat-sonucu",
    kategori: "Aday & Eğitmen",
    baslik: "Toplu Akademi Mülakatı Sonucu Gir",
    aciklama:
      "Mülakatı planlanmış adayların 6 kriterini tablo üzerinde işaretleyin; puan ve sonuç otomatik hesaplanır.",
    icon: ClipboardCheck,
    href: "/toplu-islemler/mulakat-sonucu",
    etiket: "Tablo · Mülakat tarihi bazlı",
  },
  {
    id: "temel-egitim-sonucu",
    kategori: "Aday & Eğitmen",
    baslik: "Toplu Temel Eğitim Sonucu Gir",
    aciklama:
      "Anadolu Üniversitesi temel eğitim sınavı sonuçlarını ders bazında tablo üzerinde girin; sonuç ve kaldığı ders sayısı otomatik hesaplanır.",
    icon: BookOpen,
    href: "/toplu-islemler/temel-egitim-sonucu",
    etiket: "Tablo · Eğitmen bazlı",
  },
  {
    id: "vizeletme",
    kategori: "Aday & Eğitmen",
    baslik: "Toplu Vizeletme (Gelişim Semineri)",
    aciklama:
      "Vizesi geçmiş ya da 30 gün içinde bitecek sertifikalara gelişim semineri vizesini toplu ekleyin.",
    icon: ShieldCheck,
    href: "/toplu-islemler/vizeletme",
    etiket: "Excel · Eğitmen bazlı",
  },
  {
    id: "akademi-sinav-sonucu",
    kategori: "Akademi & Sınav",
    baslik: "Toplu Akademi Sınav Sonucu Gir",
    aciklama: "Bir akademi dönemindeki tüm eğitmenlerin sınav sonuçlarını birlikte kaydedin.",
    icon: GraduationCap,
    href: "/toplu-islemler/akademi-sinav-sonucu",
    etiket: "Excel · Akademi bazlı",
  },
  {
    id: "egitmenlige-gecis",
    kategori: "Akademi & Sınav",
    baslik: "Toplu Eğitmenliğe Geçiş",
    aciklama:
      "Akademi sınavını geçen adayları sözleşme tipiyle birlikte tek seferde eğitmen statüsüne geçirin.",
    icon: UserCheck,
    href: "/toplu-islemler/egitmenlige-gecis",
    etiket: "Tablo · Akademi bazlı",
  },
];

const KATEGORI_RENK: Record<Kategori, { icon: string; badge: string }> = {
  "Aday & Eğitmen": {
    icon: "bg-violet-100 text-violet-600",
    badge: "bg-violet-50 text-violet-600",
  },
  "Akademi & Sınav": { icon: "bg-amber-100 text-amber-600", badge: "bg-amber-50 text-amber-700" },
};

export default function TopluIslemlerPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Merkezi İşlem Alanı
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">Toplu İşlemler</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Excel ile yapılan toplu işlemleri kategorilerine göre tek noktadan yönetin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ISLEMLER.map((islem) => {
          const Icon = islem.icon;
          const renk = KATEGORI_RENK[islem.kategori];
          return (
            <div
              key={islem.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${renk.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${renk.badge}`}
                >
                  {islem.kategori}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">{islem.baslik}</h3>
              <p className="mt-1 text-sm text-zinc-500">{islem.aciklama}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <FileText className="h-3.5 w-3.5" />
                  {islem.etiket}
                </span>
                <Link
                  href={islem.href}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  İşlemi Başlat
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
