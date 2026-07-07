export type StreakActivityType = 'coito' | 'entreno';

export function localDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCoitoTier(streak: number): string {
  if (streak <= 3) return 'Virgen';
  if (streak <= 10) return 'Gallo follador';
  return 'Gigolo';
}

export function getEntrenoTier(streak: number): string {
  if (streak <= 3) return 'Enquelnque';
  if (streak <= 10) return 'Medio fuerte';
  return 'Goku';
}

export function getStreakTier(type: StreakActivityType, streak: number): string {
  return type === 'coito' ? getCoitoTier(streak) : getEntrenoTier(streak);
}
