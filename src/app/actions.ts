'use server';

import { randomInt } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { reservas } from '@/db/schema';
import {
  ALIAS_PAGO, cotizar, fechaValida, hoyAR, noches, pesos, puedeCancelar, soloDigitos, TIPOS, type Tipo,
} from '@/lib/cabanas';
import { leerOcupacion, stockExtra, unidadLibre } from '@/lib/disponibilidad';
import { loadPage } from '@/lib/load-page';
import { claveCorrecta, cerrarPanel, esPanel, iniciarPanel } from '@/lib/panel';

type Consulta = { llegada: string; salida: string; adultos: number; chicos: number; bebes: number };
const entero = (n: unknown, max = 20) => (Number.isInteger(n) && (n as number) >= 0 && (n as number) <= max ? (n as number) : null);

function validar(c: Consulta) {
  const adultos = entero(c.adultos), chicos = entero(c.chicos), bebes = entero(c.bebes);
  if (adultos === null || chicos === null || bebes === null) return { error: 'Revisá la cantidad de personas.' };
  if (adultos < 1) return { error: 'Tiene que viajar al menos un adulto.' };
  if (!fechaValida(c.llegada) || !fechaValida(c.salida)) return { error: 'Elegí la fecha de llegada y la de salida.' };
  if (c.llegada < hoyAR()) return { error: 'La llegada no puede ser en el pasado.' };
  if (c.salida <= c.llegada) return { error: 'La salida tiene que ser después de la llegada.' };
  if (noches(c.llegada, c.salida).length > 60) return { error: 'La estadía máxima es de 60 noches.' };
  return { adultos, chicos, bebes };
}

const textoExtra = (stock: number, singular: string, plural: string, art: string) =>
  stock === 0 ? `${singular[0].toUpperCase() + singular.slice(1)} ${art === 'la' ? 'agotada' : 'agotado'} para estas fechas`
  : stock === 1 ? `Queda 1 ${singular}` : `Hay ${stock} ${plural} disponibles`;

/** Comparación de los dos tipos para unas fechas y un grupo. */
export async function consultar(c: Consulta) {
  const v = validar(c);
  if ('error' in v) return { ok: false as const, error: v.error };
  const o = await leerOcupacion(c.llegada, c.salida);
  const personas = v.adultos + v.chicos;
  const tipos = (Object.keys(TIPOS) as Tipo[]).map((tipo) => {
    const q = cotizar(tipo, c.llegada, c.salida);
    let motivo: string | null = null;
    if (personas > TIPOS[tipo].cap) motivo = `No entra: tiene lugar para ${TIPOS[tipo].cap} personas y son ${personas}`;
    else if (q.noches < q.minimo) motivo = `Mínimo ${q.minimo} noches en ${q.temporada.toLowerCase()}`;
    else if (!unidadLibre(o, tipo, c.llegada, c.salida)) motivo = 'Sin lugar en esas fechas';
    return { tipo, cap: TIPOS[tipo].cap, detalle: TIPOS[tipo].detalle, ...q, precioTotalTexto: pesos(q.total), motivo };
  });
  const cuna = stockExtra(o, 'cuna', c.llegada, c.salida);
  const banera = stockExtra(o, 'banera', c.llegada, c.salida);
  return {
    ok: true as const,
    tipos,
    extras: {
      hayBebes: v.bebes > 0,
      cuna: { stock: cuna, texto: textoExtra(cuna, 'cuna', 'cunas', 'la') },
      banera: { stock: banera, texto: textoExtra(banera, 'bañera', 'bañeras', 'la') },
    },
  };
}

const nuevoCodigo = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'CS-' + Array.from({ length: 5 }, () => abc[randomInt(abc.length)]).join('');
};

export async function reservar(c: Consulta & { tipo: Tipo; nombre: string; celular: string; cuna: boolean; banera: boolean }) {
  console.log('reservar: intento', c.tipo, c.llegada, c.salida);
  const v = validar(c);
  if ('error' in v) return { ok: false as const, error: v.error };
  if (c.tipo !== 'Familiar' && c.tipo !== 'Compacta') return { ok: false as const, error: 'Elegí un tipo de cabaña.' };
  const nombre = String(c.nombre ?? '').trim().slice(0, 80);
  const celular = soloDigitos(String(c.celular ?? ''));
  if (!nombre) return { ok: false as const, error: 'Escribí tu nombre.' };
  if (celular.length < 8 || celular.length > 15) return { ok: false as const, error: 'Revisá el celular.' };
  if (v.adultos + v.chicos > TIPOS[c.tipo].cap) return { ok: false as const, error: 'Esa cabaña no tiene lugar para tantas personas.' };
  const q = cotizar(c.tipo, c.llegada, c.salida);
  if (q.noches < q.minimo) return { ok: false as const, error: `El mínimo es de ${q.minimo} noches para esas fechas.` };
  const o = await leerOcupacion(c.llegada, c.salida);
  const cuna = !!c.cuna && v.bebes > 0, banera = !!c.banera && v.bebes > 0;
  if (cuna && stockExtra(o, 'cuna', c.llegada, c.salida) < 1) return { ok: false as const, error: 'La cuna se agotó para esas fechas.' };
  if (banera && stockExtra(o, 'banera', c.llegada, c.salida) < 1) return { ok: false as const, error: 'La bañera se agotó para esas fechas.' };

  // Insert protegido: solo entra si la unidad sigue libre todas las noches (dos reservas nunca comparten noche).
  const candidatas = o.unidades.filter(
    (u) => u.tipo === c.tipo && !o.activas.some((r) => r.unidadId === u.id && r.llegada < c.salida && r.salida > c.llegada),
  );
  for (const u of candidatas) {
    const codigo = nuevoCodigo();
    const [res] = await db.batch([
      db.run(sql`INSERT INTO reservas (id, codigo, nombre, celular, tipo, unidad_id, llegada, salida, adultos, chicos, bebes, cuna, banera, precio, estado, creada_en)
        SELECT ${crypto.randomUUID()}, ${codigo}, ${nombre}, ${celular}, ${c.tipo}, ${u.id}, ${c.llegada}, ${c.salida}, ${v.adultos}, ${v.chicos}, ${v.bebes}, ${cuna ? 1 : 0}, ${banera ? 1 : 0}, ${q.total}, 'Pendiente', ${Date.now()}
        WHERE NOT EXISTS (SELECT 1 FROM reservas WHERE unidad_id = ${u.id} AND estado != 'Cancelada' AND llegada < ${c.salida} AND salida > ${c.llegada})`),
    ]);
    const cambios = (res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
    if (cambios > 0) {
      console.log('reservar: creada', codigo, u.codigo);
      revalidatePath('/admin');
      return { ok: true as const, codigo, alias: ALIAS_PAGO, precio: q.total, noches: q.noches };
    }
  }
  return { ok: false as const, error: 'Sin lugar en esas fechas' };
}

const NO_COINCIDE = 'No encontramos una reserva con ese código y ese celular. Revisá los datos.';

async function buscarReserva(codigo: string, celular: string) {
  const cod = String(codigo ?? '').trim().toUpperCase();
  const cel = soloDigitos(String(celular ?? ''));
  if (!cod || !cel) return null;
  const { data } = await loadPage(() => [
    db.select().from(reservas).where(and(eq(reservas.codigo, cod), eq(reservas.celular, cel))).limit(1),
  ] as const);
  return data[0][0] ?? null;
}

function vista(r: typeof reservas.$inferSelect) {
  return {
    codigo: r.codigo, nombre: r.nombre, tipo: r.tipo, llegada: r.llegada, salida: r.salida,
    adultos: r.adultos, chicos: r.chicos, bebes: r.bebes, cuna: r.cuna, banera: r.banera,
    precio: r.precio, estado: r.estado, noches: noches(r.llegada, r.salida).length,
    puedeCancelar: r.estado !== 'Cancelada' && puedeCancelar(r.llegada),
  };
}

export async function verMiReserva(codigo: string, celular: string) {
  const r = await buscarReserva(codigo, celular);
  return r ? { ok: true as const, reserva: vista(r) } : { ok: false as const, error: NO_COINCIDE };
}

export async function cancelarMiReserva(codigo: string, celular: string) {
  const r = await buscarReserva(codigo, celular);
  if (!r) return { ok: false as const, error: NO_COINCIDE };
  if (r.estado === 'Cancelada') return { ok: false as const, error: 'Esta reserva ya estaba cancelada.' };
  if (!puedeCancelar(r.llegada)) return { ok: false as const, error: 'Ya faltan menos de 72 horas: para cancelar escribinos por WhatsApp.' };
  await db.batch([db.update(reservas).set({ estado: 'Cancelada' }).where(eq(reservas.id, r.id))]);
  console.log('cancelada por la familia', r.codigo);
  revalidatePath('/admin');
  return { ok: true as const, reserva: vista({ ...r, estado: 'Cancelada' }) };
}

// ---- Panel de la dueña ----
export async function entrarPanel(clave: string) {
  if (!claveCorrecta(String(clave ?? ''))) return { ok: false as const, error: 'Clave incorrecta.' };
  await iniciarPanel();
  revalidatePath('/admin');
  return { ok: true as const };
}
export async function salirPanel() {
  await cerrarPanel();
  revalidatePath('/admin');
}
export async function cambiarEstado(id: string, estado: 'Confirmada' | 'Cancelada') {
  if (!(await esPanel())) return { ok: false as const, error: 'Sin acceso.' };
  if (estado !== 'Confirmada' && estado !== 'Cancelada') return { ok: false as const, error: 'Estado inválido.' };
  const cond = estado === 'Confirmada' ? and(eq(reservas.id, String(id)), eq(reservas.estado, 'Pendiente')) : eq(reservas.id, String(id));
  await db.batch([db.update(reservas).set({ estado }).where(cond)]);
  console.log('panel: reserva', id, estado);
  revalidatePath('/admin');
  return { ok: true as const };
}
export async function listarReservas() {
  if (!(await esPanel())) return null;
  const { data } = await loadPage(() => [
    db.select().from(reservas).orderBy(desc(reservas.creadaEn)).limit(200),
  ] as const);
  return data[0];
}
