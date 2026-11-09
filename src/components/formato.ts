// Formato es-AR: precios «$150.000» y fechas «vie 13/11/2026».
import { hoyAR, pesos, sumarDias } from '@/lib/cabanas';

export { pesos, sumarDias };
export const hoyArgentina = hoyAR;

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** 'AAAA-MM-DD' → 'vie 13/11/2026' */
export function fechaLegible(f: string) {
  const [y, m, d] = f.split('-').map(Number);
  if (!y || !m || !d) return f;
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
