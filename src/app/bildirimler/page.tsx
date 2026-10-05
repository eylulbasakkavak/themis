"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { useCurrentUser } from "@/lib/CurrentUserContext";

export default function BildirimlerPage() {
  const { currentUser } = useCurrentUser();
  const { bildirimler, bildirimOkunduIsaretle } = useBildirimler();

  const kullanicininBildirimleri = bildirimler.filter(
    (b) => b.aliciRol === currentUser.rol && b.aliciAd === currentUser.ad
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bildirimler</h1>
        <p className="text-xs text-zinc-400">
          {currentUser.ad} ({currentUser.rol}) için gelen bildirimler.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {kullanicininBildirimleri.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-14 text-center text-sm text-zinc-400 shadow-sm">
            <Bell className="h-6 w-6 text-zinc-300" />
            Bildirim bulunmuyor.
          </div>
        )}
        {kullanicininBildirimleri.map((b) => {
          const sinif = `flex flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
            b.okundu ? "border-zinc-200 bg-white" : "border-brand/30 bg-brand-soft/40"
          }`;
          const icerik = (
            <>
              <div className="flex items-center gap-2">
                {!b.okundu && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                <span className="text-sm font-semibold text-zinc-900">{b.baslik}</span>
              </div>
              <span className="text-sm text-zinc-600">{b.mesaj}</span>
              <span className="text-xs text-zinc-400">
                {b.planlayan} · {b.tarih}
              </span>
            </>
          );
          const hedef = b.link ?? (b.adayId ? `/adaylar/${b.adayId}` : undefined);
          return hedef ? (
            <Link
              key={b.id}
              href={hedef}
              onClick={() => bildirimOkunduIsaretle(b.id)}
              className={sinif}
            >
              {icerik}
            </Link>
          ) : (
            <button key={b.id} onClick={() => bildirimOkunduIsaretle(b.id)} className={sinif}>
              {icerik}
            </button>
          );
        })}
      </div>
    </div>
  );
}
