import { and, asc, lt, gt, ne } from 'drizzle-orm';

import { db } from '@/db';
import { reservas, unidades } from '@/db/schema';
import { loadPage } from '@/lib/load-page';
import { EXTRAS_TOTAL, noches, TIPOS, type Tipo } from '@/lib/cabanas';

/** Una sola lectura: unidades + reservas activas (Pendiente/Confirmada) que tocan alguna noche del rango. */
export async function leerOcupacion(llegada: string, salida: string) {
  const { data } = await loadPage(() => [
    db.select().from(unidades).orderBy(asc(unidades.codigo)),
    db
      .select()
      .from(reservas)
      .where(and(ne(reservas.estado, 'Cancelada'), lt(reservas.llegada, salida), gt(reservas.salida, llegada))),
  ] as const);
  return { unidades: data[0], activas: data[1] };
}

type Ocupacion = Awaited<ReturnType<typeof leerOcupacion>>;

/** Primera unidad del tipo libre todas las noches, o null. Una estadía nunca se parte entre unidades. */
export function unidadLibre(o: Ocupacion, tipo: Tipo, llegada: string, salida: string) {
  return (
    o.unidades.find(
      (u) => u.tipo === tipo && !o.activas.some((r) => r.unidadId === u.id && r.llegada < salida && r.salida > llegada),
    ) ?? null
  );
}

/** Stock mínimo de un extra a lo largo de las noches: total − reservas activas que lo usan esa noche. */
export function stockExtra(o: Ocupacion, extra: 'cuna' | 'banera', llegada: string, salida: string) {
  let min = EXTRAS_TOTAL[extra];
  for (const n of noches(llegada, salida)) {
    const usados = o.activas.filter((r) => r[extra] && r.llegada <= n && r.salida > n).length;
    min = Math.min(min, EXTRAS_TOTAL[extra] - usados);
  }
  return Math.max(0, min);
}

export const capacidad = (tipo: Tipo) => TIPOS[tipo].cap;
