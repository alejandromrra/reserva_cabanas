// Archivo .ics (iCalendar) de una reserva y texto para compartir por WhatsApp. Funciones puras.
import { HORA_LLEGADA, HORA_SALIDA, noches, pesos, type Tipo } from '@/lib/cabanas';

export type DatosReserva = {
  codigo: string;
  tipo: Tipo;
  llegada: string;
  salida: string;
  adultos: number;
  chicos: number;
  bebes: number;
  cuna: boolean;
  banera: boolean;
  precio: number;
};

const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Corta las líneas largas como pide el formato (75 caracteres, continuación con un espacio). */
function plegar(linea: string) {
  const partes: string[] = [];
  let resto = linea;
  while (resto.length > 74) {
    partes.push(resto.slice(0, 74));
    resto = ' ' + resto.slice(74);
  }
  partes.push(resto);
  return partes.join('\r\n');
}

/** 'AAAA-MM-DD' + 'HH:MM' en hora argentina (UTC-3, sin horario de verano) → 'AAAAMMDDTHHMMSSZ' en UTC. */
function enUtc(fecha: string, hora: string) {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h + 3, mi)).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function personasTexto(r: Pick<DatosReserva, 'adultos' | 'chicos' | 'bebes'>) {
  const p = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  return [p(r.adultos, 'adulto', 'adultos'), r.chicos ? p(r.chicos, 'chico', 'chicos') : '', r.bebes ? p(r.bebes, 'bebé', 'bebés') : '']
    .filter(Boolean)
    .join(', ');
}

const extrasTexto = (r: Pick<DatosReserva, 'cuna' | 'banera'>) => [r.cuna && 'cuna', r.banera && 'bañera'].filter(Boolean).join(' y ');

export function crearIcs(r: DatosReserva, negocio: string, ahora = new Date()) {
  const n = noches(r.llegada, r.salida).length;
  const extras = extrasTexto(r);
  const descripcion = [
    `Código de reserva: ${r.codigo}`,
    `Cabaña ${r.tipo}, ${n} ${n === 1 ? 'noche' : 'noches'}`,
    personasTexto(r) + (extras ? `, con ${extras}` : ''),
    `Total: ${pesos(r.precio)}`,
    `Ingreso desde las ${HORA_LLEGADA}, salida hasta las ${HORA_SALIDA}.`,
  ].join('\n');
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${negocio}//Reservas//ES`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${r.codigo}@cabanas-del-sendero`,
    `DTSTAMP:${ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${enUtc(r.llegada, HORA_LLEGADA)}`,
    `DTEND:${enUtc(r.salida, HORA_SALIDA)}`,
    `SUMMARY:${escapar(`${negocio}: cabaña ${r.tipo}`)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

/** Mensaje prearmado para compartir la reserva por WhatsApp. */
export function textoWhatsapp(r: DatosReserva, negocio: string, alias: string) {
  const n = noches(r.llegada, r.salida).length;
  const dm = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}`;
  const extras = extrasTexto(r);
  return [
    `¡Hola! Reservé en ${negocio}: cabaña ${r.tipo}, del ${dm(r.llegada)} al ${dm(r.salida)} (${n} ${n === 1 ? 'noche' : 'noches'}).`,
    `Somos ${personasTexto(r)}${extras ? ` y pedimos ${extras}` : ''}.`,
    `Mi código es ${r.codigo}. Total: ${pesos(r.precio)}.`,
    `Alias para el pago: ${alias}`,
  ].join('\n');
}

export const enlaceWhatsapp = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

/** Descarga el .ics desde el navegador. */
export function descargarIcs(contenido: string, codigo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `reserva-${codigo}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
