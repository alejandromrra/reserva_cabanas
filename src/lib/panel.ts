import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

// Clave del panel: variable PANEL_CLAVE; si no existe, la de ejemplo de abajo (cambiala, ver README).
const clave = () => process.env.PANEL_CLAVE || 'sierra2026';
const token = () => createHmac('sha256', clave()).update('panel-v1').digest('hex');

export function claveCorrecta(intento: string) {
  const a = createHmac('sha256', 'x').update(intento).digest();
  const b = createHmac('sha256', 'x').update(clave()).digest();
  return timingSafeEqual(a, b);
}
export async function iniciarPanel() {
  (await cookies()).set('panel', token(), { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 12 });
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
