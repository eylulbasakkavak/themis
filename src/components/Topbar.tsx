"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronDown, Phone } from "lucide-react";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { useCurrentUser, type UygulamaRolu } from "@/lib/CurrentUserContext";

const ROLLER: UygulamaRolu[] = ["Kulüp Müdürü", "İK", "Sistem Yöneticisi"];

export function Topbar() {
  const { currentUser, setRol } = useCurrentUser();
  const { bildirimler, bildirimOkunduIsaretle } = useBildirimler();
  const [menuAcik, setMenuAcik] = useState(false);
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const initials = currentUser.ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const kullanicininBildirimleri = bildirimler.filter(
    (b) => b.aliciRol === currentUser.rol && b.aliciAd === currentUser.ad
  );
  const okunmamisSayisi = kullanicininBildirimleri.filter((b) => !b.okundu).length;
  return (
    <header className="flex h-[4.5rem] shrink-0 items-center justify-end border-b border-black/20 bg-sidebar px-6">
      <div className="flex items-center gap-5 text-base text-zinc-300">
        <Phone className="h-5 w-5" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setBildirimAcik((a) => !a)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {okunmamisSayisi > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                {okunmamisSayisi}
              </span>
            )}
          </button>
          {bildirimAcik && (
            <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm text-zinc-700 shadow-lg">
              <p className="px-2.5 py-1.5 text-xs font-semibold text-zinc-400">Bildirimler</p>
              <div className="max-h-80 overflow-y-auto">
                {kullanicininBildirimleri.length === 0 && (
                  <p className="px-2.5 py-4 text-center text-xs text-zinc-400">
                    Bildirim bulunmuyor.
                  </p>
                )}
                {kullanicininBildirimleri.map((b) => {
                  const sinif = `flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-50 ${
                    b.okundu ? "" : "bg-brand-soft/40"
                  }`;
                  const icerik = (
                    <>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                        {!b.okundu && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        {b.baslik}
                      </span>
                      <span className="text-xs text-zinc-500">{b.mesaj}</span>
                      <span className="text-[11px] text-zinc-400">
                        {b.planlayan} · {b.tarih}
                      </span>
                    </>
                  );
                  const hedef = b.link ?? (b.adayId ? `/adaylar/${b.adayId}` : undefined);
                  return hedef ? (
                    <Link
                      key={b.id}
                      href={hedef}
                      onClick={() => {
                        bildirimOkunduIsaretle(b.id);
                        setBildirimAcik(false);
                      }}
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
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAcik((a) => !a)}
            className="flex items-center gap-2.5 rounded-full border border-white/10 py-1.5 pl-1.5 pr-3 text-base"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              {initials}
            </span>
            {currentUser.ad}
            <span className="text-zinc-500">· {currentUser.rol}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {menuAcik && (
            <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm text-zinc-700 shadow-lg">
              <p className="px-2.5 py-1.5 text-xs font-semibold text-zinc-400">
                Rol olarak görüntüle
              </p>
              {ROLLER.map((rol) => (
                <button
                  key={rol}
                  onClick={() => {
                    setRol(rol);
                    setMenuAcik(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-zinc-50 ${
                    rol === currentUser.rol ? "font-semibold text-brand" : ""
                  }`}
                >
                  {rol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
