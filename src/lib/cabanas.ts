// Reglas del complejo: tipos, temporadas, tarifas y fechas. Todo dato de ejemplo vive en este archivo. Funciones puras.
export type Tipo = 'Familiar' | 'Compacta';
export const TIPOS: Record<Tipo, { cap: number; detalle: string }> = {
  Familiar: { cap: 6, detalle: '2 dormitorios, living, cocina, lavadero y baño' },
  Compacta: { cap: 4, detalle: 'Dormitorio matrimonial, 2 camas en el living, cocina y baño' },
};
export type Estado = 'Pendiente' | 'Confirmada' | 'Cancelada';
/** Las seis cabañas del complejo (dato de ejemplo): F1–F3 Familiares, C1–C3 Compactas. */
export const UNIDADES: { codigo: string; tipo: Tipo }[] = [
  { codigo: 'F1', tipo: 'Familiar' },
  { codigo: 'F2', tipo: 'Familiar' },
  { codigo: 'F3', tipo: 'Familiar' },
  { codigo: 'C1', tipo: 'Compacta' },
  { codigo: 'C2', tipo: 'Compacta' },
  { codigo: 'C3', tipo: 'Compacta' },
];
/** Una reserva guardada. Fechas 'AAAA-MM-DD'; las noches ocupadas van de llegada (incluida) a salida (excluida). */
export type Reserva = {
  id: string;
  codigo: string;
  nombre: string;
  celular: string; // solo dígitos
  tipo: Tipo;
  unidad: string; // 'F1'…'C3'
  llegada: string;
  salida: string;
  adultos: number;
  chicos: number;
  bebes: number;
  cuna: boolean;
  banera: boolean;
  precio: number;
  estado: Estado;
  creadaEn: number;
};
export const EN_COMUN = 'Cochera, galería y parrilla';
export const EXTRAS_TOTAL = { cuna: 2, banera: 2 };
export const HORA_LLEGADA = '13:00';
export const HORA_SALIDA = '10:00';
export const HORAS_CANCELACION = 72;
// Alias de ejemplo: cambialo por el real en este archivo.
export const ALIAS_PAGO = 'cabanas.sierra.pago';

type Temporada = { nombre: string; familiar: number; compacta: number; minimo: number };
const VERANO: Temporada = { nombre: 'Verano', familiar: 150000, compacta: 110000, minimo: 4 };
const INVIERNO: Temporada = { nombre: 'Invierno', familiar: 125000, compacta: 92000, minimo: 3 };
const OCTUBRE: Temporada = { nombre: 'Fiesta de octubre', familiar: 170000, compacta: 125000, minimo: 3 };
const BAJA: Temporada = { nombre: 'Baja', familiar: 95000, compacta: 70000, minimo: 2 };

/** Temporada de una fecha 'AAAA-MM-DD'. */
export function temporadaDe(fecha: string): Temporada {
  const mmdd = fecha.slice(5);
  if (mmdd >= '12-20' || mmdd <= '02-28') return VERANO;
  if (mmdd >= '07-01' && mmdd <= '07-31') return INVIERNO;
  if (mmdd >= '10-01' && mmdd <= '10-15') return OCTUBRE;
  return BAJA;
}

export const fechaValida = (f: unknown): f is string =>
  typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && !Number.isNaN(Date.parse(f + 'T00:00:00Z')) &&
  new Date(f + 'T00:00:00Z').toISOString().slice(0, 10) === f;

export function sumarDias(f: string, n: number): string {
  const d = new Date(f + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Noches ocupadas: de la llegada (incluida) a la salida (excluida). */
export function noches(llegada: string, salida: string): string[] {
  const out: string[] = [];
  for (let f = llegada; f < salida && out.length < 400; f = sumarDias(f, 1)) out.push(f);
  return out;
}

/** Hoy en Argentina (UTC-3). */
export const hoyAR = () => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);

export function cotizar(tipo: Tipo, llegada: string, salida: string) {
  const ns = noches(llegada, salida);
  const t = temporadaDe(llegada);
  const tarifa = (f: string) => {
    const s = temporadaDe(f);
    return tipo === 'Familiar' ? s.familiar : s.compacta;
  };
  return {
    noches: ns.length,
    minimo: t.minimo,
    temporada: t.nombre,
    tarifaLlegada: tipo === 'Familiar' ? t.familiar : t.compacta,
    total: ns.reduce((a, f) => a + tarifa(f), 0),
  };
}

/** Desglose del precio: noches agrupadas por temporada (cada noche con la tarifa de su fecha). */
export function desglose(tipo: Tipo, llegada: string, salida: string) {
  const filas: { temporada: string; noches: number; tarifa: number; subtotal: number }[] = [];
  for (const f of noches(llegada, salida)) {
    const t = temporadaDe(f);
    const tarifa = tipo === 'Familiar' ? t.familiar : t.compacta;
    const fila = filas.find((x) => x.temporada === t.nombre);
    if (fila) {
      fila.noches += 1;
      fila.subtotal += tarifa;
    } else filas.push({ temporada: t.nombre, noches: 1, tarifa, subtotal: tarifa });
  }
  return filas;
}

/** ¿Se puede cancelar desde la web? Hasta 72 h antes de la llegada (13:00, hora argentina). */
export function puedeCancelar(llegada: string, ahora = Date.now()) {
  const [y, m, d] = llegada.split('-').map(Number);
  const llegadaTs = Date.UTC(y, m - 1, d, 13 + 3);
  return llegadaTs - ahora >= HORAS_CANCELACION * 3_600_000;
}

export const soloDigitos = (s: string) => s.replace(/\D/g, '');
export const pesos = (n: number) => '$' + n.toLocaleString('es-AR');
