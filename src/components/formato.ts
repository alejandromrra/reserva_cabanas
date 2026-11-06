// Formato es-AR: precios «$150.000» y fechas «vie 13/11/2026».
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const pesos = (n: number) => '$' + n.toLocaleString('es-AR');

/** 'AAAA-MM-DD' → 'vie 13/11/2026' */
export function fechaLegible(f: string) {
  const [y, m, d] = f.split('-').map(Number);
  if (!y || !m || !d) return f;
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function sumarDias(f: string, n: number) {
  const d = new Date(f + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Hoy en Argentina (UTC-3), 'AAAA-MM-DD'. */
export const hoyArgentina = () => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** 'u-f1' → 'F1' */
export const unidadCorta = (id: string) => id.replace(/^u-/, '').toUpperCase();
