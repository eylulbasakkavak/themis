"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  ChevronDown,
  Home,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useBildirimler } from "@/lib/BildirimlerContext";
import { ikYetkisiVarMi, useCurrentUser } from "@/lib/CurrentUserContext";

type NavLeaf = { label: string; href: string; ikGerekli?: boolean };
type NavGroup = { label: string; icon: typeof Home; children: NavLeaf[] };
type NavItem = (NavLeaf & { icon: typeof Home }) | NavGroup;

const NAV_ITEMS: NavItem[] = [
  { label: "Anasayfa", href: "/", icon: Home },
  { label: "Bildirimler", href: "/bildirimler", icon: Bell },
  {
    label: "Aday Süreci",
    icon: UserPlus,
    children: [
      { label: "Eğitmenler", href: "/adaylar" },
      { label: "Onay Talepleri", href: "/onay-bekleyenler", ikGerekli: true },
    ],
  },
  { label: "Akademi", href: "/akademi", icon: School },
  {
    label: "Eğitmen Karne",
    icon: Award,
    children: [
      { label: "Karne", href: "/egitmen-karnesi" },
      { label: "Karneye Dahil Olmayan Eğitmenler", href: "/egitmen-karnesi/karneye-dahil-olmayanlar" },
      { label: "Dönem Sonu Metrik Limitleri", href: "/egitmen-karnesi/metrik-limitleri" },
      { label: "GX Stüdyo Sayıları", href: "/egitmen-karnesi/gx-studyolari" },
    ],
  },
  { label: "Toplu İşlemler", href: "/toplu-islemler", icon: LayoutGrid },
  { label: "Raporlama", href: "/raporlama", icon: BarChart3 },
];

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { currentUser } = useCurrentUser();
  const { bildirimler } = useBildirimler();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Aday Süreci": true,
  });
  const okunmamisBildirimSayisi = bildirimler.filter(
    (b) => !b.okundu && b.aliciRol === currentUser.rol && b.aliciAd === currentUser.ad
  ).length;

  return (
    <aside
      className={`flex h-full shrink-0 flex-col bg-sidebar text-base text-zinc-300 transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className={`flex items-center gap-3 px-6 py-6 ${collapsed ? "justify-center px-0" : ""}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
          Th
        </div>
        {!collapsed && (
          <span className="text-xl font-semibold tracking-tight text-white">Themis</span>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3">
        {NAV_ITEMS.map((item) => {
          if (isGroup(item)) {
            const Icon = item.icon;
            const isOpen = openGroups[item.label];
            const gorunurCocuklar = item.children.filter(
              (c) => !c.ikGerekli || ikYetkisiVarMi(currentUser.rol)
            );
            const groupActive = gorunurCocuklar.some((c) => pathname.startsWith(c.href));

            if (collapsed) {
              return (
                <Link
                  key={item.label}
                  href={gorunurCocuklar[0].href}
                  title={item.label}
                  className={`flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                    groupActive
                      ? "bg-sidebar-active text-white ring-1 ring-inset ring-brand/40"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            }

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                    groupActive ? "text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5 pl-6">
                    {gorunurCocuklar.map((child) => {
                      const active = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-lg px-3.5 py-2.5 text-base transition-colors ${
                            active
                              ? "bg-sidebar-active font-semibold text-white ring-1 ring-inset ring-brand/40"
                              : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                collapsed ? "justify-center px-3 py-2.5" : ""
              } ${
                active
                  ? "bg-sidebar-active text-white ring-1 ring-inset ring-brand/40"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between">
                  {item.label}
                  {item.href === "/bildirimler" && okunmamisBildirimSayisi > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
                      {okunmamisBildirimSayisi}
                    </span>
                  )}
                </span>
              )}
              {collapsed && item.href === "/bildirimler" && okunmamisBildirimSayisi > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggleCollapsed}
        title={collapsed ? "Navigasyonu Genişlet" : "Navigasyonu Daralt"}
        className={`flex items-center gap-2 border-t border-white/10 px-4 py-3.5 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        {!collapsed && "Navigasyonu Daralt"}
      </button>
    </aside>
  );
}
