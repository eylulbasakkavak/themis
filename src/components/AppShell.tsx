"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AdaylarProvider } from "@/lib/AdaylarContext";
import { AkademiDonemleriProvider } from "@/lib/AkademiDonemleriContext";
import { AkademiSinavSonuclariProvider } from "@/lib/AkademiSinavSonuclariContext";
import { BildirimlerProvider } from "@/lib/BildirimlerContext";
import { CurrentUserProvider } from "@/lib/CurrentUserContext";
import { KarnelerProvider } from "@/lib/KarnelerContext";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <CurrentUserProvider>
      <AdaylarProvider>
        <KarnelerProvider>
          <AkademiDonemleriProvider>
            <AkademiSinavSonuclariProvider>
              <BildirimlerProvider>
                <div className="flex h-full min-h-full">
                  <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto bg-zinc-100 p-2 sm:p-4 md:p-8">
                      {children}
                    </main>
                  </div>
                </div>
              </BildirimlerProvider>
            </AkademiSinavSonuclariProvider>
          </AkademiDonemleriProvider>
        </KarnelerProvider>
      </AdaylarProvider>
    </CurrentUserProvider>
  );
}
