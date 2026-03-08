import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retourne le samedi de la semaine courante (ou le samedi précédent si on n'est pas samedi).
 * La semaine va du samedi au vendredi.
 */
export function getCurrentWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=dimanche, 6=samedi
  const diff = day === 6 ? 0 : day + 1; // nb jours depuis le samedi précédent
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Retourne les 7 jours de la semaine à partir du samedi
 */
export function getWeekDays(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
