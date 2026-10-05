"use client";

import { useState, type ReactNode } from "react";

export function AdayDetayTabs({
  tabs,
  baslangicTab,
  aktif,
  onDegistir,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  baslangicTab?: string;
  // Verilirse sekme dışarıdan yönetilir (ör. Sonraki Aksiyon kartının yönlendirmesi).
  aktif?: string;
  onDegistir?: (id: string) => void;
}) {
  const [icAktif, setIcAktif] = useState(
    baslangicTab && tabs.some((t) => t.id === baslangicTab) ? baslangicTab : tabs[0]?.id
  );
  const active = aktif ?? icAktif;
  const setActive = onDegistir ?? setIcAktif;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex gap-1 border-b border-zinc-100 px-4 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
              active === t.id
                ? "border-brand text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
