"use client";

import { EgitmenDetayIcerik } from "@/components/egitmen/EgitmenDetayIcerik";
import type { AdayEgitmen } from "@/lib/types";

export function GenelBilgi({
  aday,
  onAdayGuncelle,
}: {
  aday: AdayEgitmen;
  onAdayGuncelle?: (yeni: AdayEgitmen) => void;
}) {
  return <EgitmenDetayIcerik aday={aday} onAdayGuncelle={onAdayGuncelle} />;
}
