// Almacén de reservas en localStorage. Los datos solo se ven en el mismo navegador (así lo pide el encargo).
// Si el navegador no deja usar localStorage (modo privado, bloqueado), la app sigue andando con memoria de la pestaña.
import { useSyncExternalStore } from 'react';

import type { Reserva } from '@/lib/cabanas';

const CLAVE = 'cabanas-del-sendero:reservas:v1';
const EVENTO = 'cabanas:cambio';

let usaMemoria = false;
let memoria: string | null = null;

function leerCrudo(): string | null {
  if (!usaMemoria) {
    try {
      return globalThis.localStorage.getItem(CLAVE);
    } catch {
      usaMemoria = true;
    }
  }
  return memoria;
}

function notificar() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO));
}

function escribirCrudo(v: string) {
  if (!usaMemoria) {
    try {
      globalThis.localStorage.setItem(CLAVE, v);
      notificar();
      return;
    } catch {
      usaMemoria = true;
    }
  }
  memoria = v;
  notificar();
}

const esReserva = (r: unknown): r is Reserva => {
  if (typeof r !== 'object' || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === 'string' && typeof x.codigo === 'string' && typeof x.celular === 'string' &&
    (x.tipo === 'Familiar' || x.tipo === 'Compacta') && typeof x.unidad === 'string' &&
    typeof x.llegada === 'string' && typeof x.salida === 'string' &&
    typeof x.adultos === 'number' && typeof x.precio === 'number' &&
    (x.estado === 'Pendiente' || x.estado === 'Confirmada' || x.estado === 'Cancelada')
  );
};

// La lista se vuelve a armar solo cuando cambia el texto guardado: así React recibe siempre la misma referencia.
let cacheCrudo: string | null | undefined;
let cacheLista: Reserva[] = [];

/** Todas las reservas guardadas (las filas dañadas se ignoran). */
export function leer(): Reserva[] {
  const crudo = leerCrudo();
  if (crudo === cacheCrudo) return cacheLista;
  cacheCrudo = crudo;
  try {
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    cacheLista = Array.isArray(datos) ? datos.filter(esReserva) : [];
  } catch {
    cacheLista = [];
  }
  return cacheLista;
}

export function guardar(lista: Reserva[]) {
  escribirCrudo(JSON.stringify(lista));
}

// ---- Datos iniciales: se cargan una sola vez, la primera vez que se abre la app en este navegador ----
const MARCA = 'cabanas-del-sendero:inicializado:v1';
let marcaMemoria = false;

/** ¿Ya se cargaron los datos de ejemplo alguna vez? (así «Borrar todo» no los vuelve a cargar solo). */
export function yaInicializado(): boolean {
  try {
    return globalThis.localStorage.getItem(MARCA) === '1';
  } catch {
    return marcaMemoria;
  }
}
export function marcarInicializado() {
  marcaMemoria = true;
  try {
    globalThis.localStorage.setItem(MARCA, '1');
  } catch {
    /* queda en memoria */
  }
}
/** ¿Hay algo guardado? (sin leer: distingue «nunca se guardó» de «lista vacía»). */
export const hayDatosGuardados = () => leerCrudo() !== null;

export function borrarTodo() {
  guardar([]);
}

/**
 * Ejecuta un cambio leyendo y escribiendo sin que otra pestaña se meta en el medio (Web Locks).
 * Sin soporte de locks, el cambio igual es de una sola vuelta: leer, decidir y escribir sin esperas.
 */
export async function conBloqueo<T>(fn: () => T): Promise<T> {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  if (locks) return locks.request('cabanas-reservas', () => fn());
  return fn();
}

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener('storage', cb); // cambios hechos desde otra pestaña
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Las reservas como estado de React: se actualiza solo cuando algo cambia, también desde otra pestaña. */
export function useReservas(): Reserva[] {
  return useSyncExternalStore(suscribir, leer, leer);
}

// ---- Sesión del panel (solo mientras la pestaña esté abierta) ----
const SESION = 'cabanas-del-sendero:panel';
const EVENTO_SESION = 'cabanas:sesion';
let sesionMemoria = false;

export function panelAbierto(): boolean {
  try {
    return sessionStorage.getItem(SESION) === '1';
  } catch {
    return sesionMemoria;
  }
}
export function abrirPanel(abierto: boolean) {
  sesionMemoria = abierto;
  try {
    if (abierto) sessionStorage.setItem(SESION, '1');
    else sessionStorage.removeItem(SESION);
  } catch {
    /* la sesión queda en memoria */
  }
  window.dispatchEvent(new Event(EVENTO_SESION));
}
export function usePanelAbierto(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENTO_SESION, cb);
      return () => window.removeEventListener(EVENTO_SESION, cb);
    },
    panelAbierto,
    panelAbierto,
  );
}
