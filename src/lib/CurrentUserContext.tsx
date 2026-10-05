"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type UygulamaRolu = "Kulüp Müdürü" | "İK" | "Sistem Yöneticisi";

export type CurrentUser = { ad: string; rol: UygulamaRolu; kulup: string };

export const KULLANICILAR: Record<UygulamaRolu, CurrentUser> = {
  "Kulüp Müdürü": { ad: "Mert Aydın", rol: "Kulüp Müdürü", kulup: "Beşiktaş" },
  İK: { ad: "Elif Su", rol: "İK", kulup: "Merkez Ofis" },
  "Sistem Yöneticisi": { ad: "Deniz Aksoy", rol: "Sistem Yöneticisi", kulup: "Merkez Ofis" },
};

/** İK'nın yaptığı onay/geçiş işlemlerini Sistem Yöneticisi de yapabilir (üst düzey yetki). */
export function ikYetkisiVarMi(rol: UygulamaRolu): boolean {
  return rol === "İK" || rol === "Sistem Yöneticisi";
}

type CurrentUserContextValue = {
  currentUser: CurrentUser;
  setRol: (rol: UygulamaRolu) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<UygulamaRolu>("İK");

  return (
    <CurrentUserContext.Provider value={{ currentUser: KULLANICILAR[rol], setRol }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser, CurrentUserProvider içinde kullanılmalı");
  return ctx;
}
