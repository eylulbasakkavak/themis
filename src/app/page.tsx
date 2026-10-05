import Link from "next/link";
import { ArrowRight, Award, BarChart3, LayoutGrid, School, UserPlus } from "lucide-react";

export default function AnasayfaPage() {
  // Sıra yan menüyle aynı.
  const kartlar = [
    {
      href: "/adaylar",
      icon: UserPlus,
      title: "Eğitmenler",
      desc: "Aday, akademi, aktif ve pasif eğitmenlerin tüm sürecini tek yerden yönetin.",
    },
    {
      href: "/akademi",
      icon: School,
      title: "Akademi",
      desc: "Akademi dönemlerini oluşturun, kayıtları ve yoklamayı takip edin, sınav sonuçlarını görün.",
    },
    {
      href: "/egitmen-karnesi",
      icon: Award,
      title: "Eğitmen Karne",
      desc: "Dönem sonu performans karnesini, ligleri ve istisnaları yönetin.",
    },
    {
      href: "/toplu-islemler",
      icon: LayoutGrid,
      title: "Toplu İşlemler",
      desc: "Toplu aday ekleme, akademi mülakatı değerlendirme, sınav sonucu ve vizeletme.",
    },
    {
      href: "/raporlama",
      icon: BarChart3,
      title: "Raporlama",
      desc: "Filtre ve kolon seçerek esnek rapor oluşturun, Excel olarak indirin.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kartlar.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.href}
              href={k.href}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-900">{k.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{k.desc}</p>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                Git <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
