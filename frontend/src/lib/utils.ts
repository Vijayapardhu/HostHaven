import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCity(city?: string) {
  if (!city) return "";
  const displayMap: Record<string, string> = {
    VIJAYAWADA: "Vijayawada",
    NANDIYALA: "Nandyal",
    NANDYALA: "Nandyal",
    VETLAPALEM: "Vetapalem",
    VETAPALEM: "Vetapalem",
  };
  const normalized = city.toUpperCase();
  if (displayMap[normalized]) return displayMap[normalized];
  return city
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
