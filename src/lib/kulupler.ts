export const KULUPLER = [
  "Ataşehir",
  "Bahçeşehir",
  "Bakırköy",
  "Beşiktaş",
  "Bostancı",
  "Etiler",
  "Kadıköy",
  "Levent",
  "Maslak",
  "Şişli",
  "Ümraniye",
];

export type KulupMarkasi = "MAC One" | "MACFit";

// Premium (MAC One) kulüpler; listede olmayan kulüpler MACFit'tir.
const MAC_ONE_KULUPLERI = ["Etiler", "Levent"];

export function kulupMarkasi(kulup: string): KulupMarkasi {
  return MAC_ONE_KULUPLERI.includes(kulup) ? "MAC One" : "MACFit";
}
