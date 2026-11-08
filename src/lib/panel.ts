import { createHmac, timingSafeEqual } from 'node:crypto';

import { eq, sql } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';

import { db } from '@/db';
import { rateLimits } from '@/db/schema';

// Clave del panel: variable PANEL_CLAVE; si no existe, la de ejemplo de abajo (cambiala, ver README).
const clave = () => process.env.PANEL_CLAVE || 'sierra2026';
const token = () => createHmac('sha256', clave()).update('panel-v1').digest('hex');

export function claveCorrecta(intento: string) {
  const a = createHmac('sha256', 'x').update(intento).digest();
  const b = createHmac('sha256', 'x').update(clave()).digest();
  return timingSafeEqual(a, b);
}
export async function iniciarPanel() {
  (await cookies()).set('panel', token(), { httpOnly: true, sameSite: 'none', secure: true, partitioned: true, path: '/', maxAge: 60 * 60 * 12 });
}
export async function cerrarPanel() {
  (await cookies()).delete('panel');
}
export async function esPanel() {
  const c = (await cookies()).get('panel')?.value;
  if (!c) return false;
  const t = token();
  return c.length === t.length && timingSafeEqual(Buffer.from(c), Buffer.from(t));
}

// Freno a las claves al azar: 8 fallos desde la misma IP bloquean el ingreso 15 minutos (cuentan desde el último fallo).
// Si la tabla no responde, el freno se omite: el panel nunca queda cerrado por un problema del contador.
const MAX_FALLOS = 8;
const BLOQUEO_MS = 15 * 60_000;

async function claveIp() {
  const h = await headers();
  const ip = h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return `lock:panel:${ip}`;
}
export async function panelBloqueado() {
  try {
    const fila = (await db.select().from(rateLimits).where(eq(rateLimits.key, await claveIp())).limit(1)).at(0);
    return !!fila && fila.lastRequest > Date.now() && fila.count >= MAX_FALLOS;
  } catch {
    return false;
  }
}
export async function registrarFallo() {
  try {
    const ahora = Date.now();
    await db.batch([
      db
        .insert(rateLimits)
        .values({ id: crypto.randomUUID(), key: await claveIp(), count: 1, lastRequest: ahora + BLOQUEO_MS })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`CASE WHEN ${rateLimits.lastRequest} > ${ahora} THEN ${rateLimits.count} + 1 ELSE 1 END`,
            lastRequest: ahora + BLOQUEO_MS,
          },
        }),
    ]);
  } catch {
    /* sin contador, sin freno */
  }
}
export async function limpiarFallos() {
  try {
    await db.batch([db.delete(rateLimits).where(eq(rateLimits.key, await claveIp()))]);
  } catch {
    /* nada que limpiar */
  }
}
