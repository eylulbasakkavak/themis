import type { ReactNode } from "react";

/** Profil sekmelerinde etiket / değer satırlarından oluşan sade tablo. */
export function BilgiTablosu({ satirlar }: { satirlar: [string, ReactNode][] }) {
  return (
    <table className="w-full text-[13px]">
      <tbody>
        {satirlar.map(([etiket, deger]) => (
          <tr key={etiket} className="border-b border-zinc-100 last:border-0">
            <th className="w-56 py-1.5 pr-4 text-left align-top font-normal text-zinc-500">
              {etiket}
            </th>
            <td className="py-1.5 text-zinc-900">{deger}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Sonuç metni: rozet yerine yalnızca renkli yazı. */
export function SonucMetni({ label, olumlu }: { label: string; olumlu: boolean | null }) {
  const renk = olumlu === null ? "text-amber-700" : olumlu ? "text-emerald-700" : "text-rose-700";
  return <span className={`font-semibold ${renk}`}>{label}</span>;
}

/** Excel'deki gibi geçti / kaldı hücre boyası: soft yeşil veya soft kırmızı; null boyasız. */
export function puanRengi(gecti: boolean | null): string {
  if (gecti === null) return "text-zinc-800";
  return gecti ? "bg-emerald-100/70 text-emerald-900" : "bg-rose-100/70 text-rose-900";
}
