// Las reglas del negocio sobre las reservas guardadas: comparar tipos, reservar, consultar, cancelar y el panel.
// Todo se calcula con la lista de reservas y la fecha de hoy: las fechas se liberan solas cuando pasan.
import {
  ALIAS_PAGO, cotizar, EXTRAS_TOTAL, fechaValida, hoyAR, noches, pesos, puedeCancelar, soloDigitos, sumarDias,
  TIPOS, UNIDADES, type Estado, type Reserva, type Tipo,
} from '@/lib/cabanas';
import { borrarTodo, conBloqueo, guardar, leer } from '@/lib/store';

export type Consulta = { llegada: string; salida: string; adultos: number; chicos: number; bebes: number };

const entero = (n: unknown, max = 20) =>
  Number.isInteger(n) && (n as number) >= 0 && (n as number) <= max ? (n as number) : null;

type Validada = { error: string } | { error?: never; adultos: number; chicos: number; bebes: number };

function validar(c: Consulta): Validada {
  const adultos = entero(c.adultos), chicos = entero(c.chicos), bebes = entero(c.bebes);
  if (adultos === null || chicos === null || bebes === null) return { error: 'Revisá la cantidad de personas.' };
  if (adultos < 1) return { error: 'Tiene que viajar al menos un adulto.' };
  if (!fechaValida(c.llegada) || !fechaValida(c.salida)) return { error: 'Elegí la fecha de llegada y la de salida.' };
  if (c.llegada < hoyAR()) return { error: 'La llegada no puede ser en el pasado.' };
  if (c.salida <= c.llegada) return { error: 'La salida tiene que ser después de la llegada.' };
  if (noches(c.llegada, c.salida).length > 60) return { error: 'La estadía máxima es de 60 noches.' };
  return { adultos, chicos, bebes };
}

// ---- Cupo ----
const activas = (lista: Reserva[]) => lista.filter((r) => r.estado !== 'Cancelada');
const seSolapan = (r: Reserva, llegada: string, salida: string) => r.llegada < salida && r.salida > llegada;

/** Primera unidad del tipo libre todas las noches, o null. Una estadía nunca se parte entre unidades. */
export function unidadLibre(lista: Reserva[], tipo: Tipo, llegada: string, salida: string) {
  const ocupadas = activas(lista).filter((r) => seSolapan(r, llegada, salida));
  return UNIDADES.find((u) => u.tipo === tipo && !ocupadas.some((r) => r.unidad === u.codigo)) ?? null;
}

/** Stock mínimo de un extra a lo largo de las noches: total − reservas activas que lo usan esa noche. */
export function stockExtra(lista: Reserva[], extra: 'cuna' | 'banera', llegada: string, salida: string) {
  const act = activas(lista);
  let min = EXTRAS_TOTAL[extra];
  for (const n of noches(llegada, salida)) {
    const usados = act.filter((r) => r[extra] && r.llegada <= n && r.salida > n).length;
    min = Math.min(min, EXTRAS_TOTAL[extra] - usados);
  }
  return Math.max(0, min);
}

const textoExtra = (stock: number, singular: string, plural: string) =>
  stock === 0 ? `${singular[0].toUpperCase() + singular.slice(1)} agotada para estas fechas`
  : stock === 1 ? `Queda 1 ${singular}` : `Hay ${stock} ${plural} disponibles`;

// ---- Comparar los dos tipos ----
export function comparar(c: Consulta, lista: Reserva[]) {
  const v = validar(c);
  if (v.error !== undefined) return { ok: false as const, error: v.error };
  const personas = v.adultos + v.chicos; // los bebés no cuentan como plaza
  const cabe = (t: Tipo) => personas <= TIPOS[t].cap;
  const hayLugar = (t: Tipo) => !!unidadLibre(lista, t, c.llegada, c.salida);
  const otro = (t: Tipo): Tipo => (t === 'Familiar' ? 'Compacta' : 'Familiar');
  const tipos = (Object.keys(TIPOS) as Tipo[]).map((tipo) => {
    const q = cotizar(tipo, c.llegada, c.salida);
    const qOtro = cotizar(otro(tipo), c.llegada, c.salida);
    let motivo: string | null = null;
    // Cuando algo no se puede: el porqué y, si existe, la otra opción.
    if (!cabe(tipo)) {
      motivo = `No entra: tiene lugar para ${TIPOS[tipo].cap} personas y son ${personas}.${cabe(otro(tipo)) ? ` Les entra la ${otro(tipo)}.` : ''}`;
    } else if (q.noches < q.minimo) {
      const s = sumarDias(c.llegada, q.minimo);
      motivo = `Mínimo ${q.minimo} noches en ${q.temporada.toLowerCase()}. Probá con salida el ${s.slice(8)}/${s.slice(5, 7)}.`;
    } else if (!hayLugar(tipo)) {
      const sirve = cabe(otro(tipo)) && qOtro.noches >= qOtro.minimo && hayLugar(otro(tipo));
      motivo = `Sin lugar en esas fechas.${sirve ? ` La ${otro(tipo)} sí tiene.` : ''}`;
    }
    return { tipo, cap: TIPOS[tipo].cap, detalle: TIPOS[tipo].detalle, ...q, precioTotalTexto: pesos(q.total), motivo };
  });
  const cuna = stockExtra(lista, 'cuna', c.llegada, c.salida);
  const banera = stockExtra(lista, 'banera', c.llegada, c.salida);
  return {
    ok: true as const,
    tipos,
    extras: {
      hayBebes: v.bebes > 0,
      cuna: { stock: cuna, texto: textoExtra(cuna, 'cuna', 'cunas') },
      banera: { stock: banera, texto: textoExtra(banera, 'bañera', 'bañeras') },
    },
  };
}
export type Comparacion = Extract<ReturnType<typeof comparar>, { ok: true }>;

// ---- Reservar ----
const nuevoCodigo = (existentes: Set<string>) => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const codigo = 'CS-' + Array.from(bytes, (b) => abc[b % abc.length]).join('');
    if (!existentes.has(codigo)) return codigo;
  }
};

export type PedidoReserva = Consulta & { tipo: Tipo; nombre: string; celular: string; cuna: boolean; banera: boolean };

/** Crea la reserva (Pendiente). Lee, decide y escribe en un solo paso, bajo bloqueo, para no pisar a otra pestaña. */
export function reservar(c: PedidoReserva) {
  return conBloqueo(() => {
    const v = validar(c);
    if (v.error !== undefined) return { ok: false as const, error: v.error };
    if (c.tipo !== 'Familiar' && c.tipo !== 'Compacta') return { ok: false as const, error: 'Elegí un tipo de cabaña.' };
    const nombre = String(c.nombre ?? '').trim().slice(0, 80);
    const celular = soloDigitos(String(c.celular ?? ''));
    if (!nombre) return { ok: false as const, error: 'Escribí tu nombre.' };
    if (celular.length < 8 || celular.length > 15) return { ok: false as const, error: 'Revisá el celular.' };
    if (v.adultos + v.chicos > TIPOS[c.tipo].cap) return { ok: false as const, error: 'Esa cabaña no tiene lugar para tantas personas.' };
    const q = cotizar(c.tipo, c.llegada, c.salida);
    if (q.noches < q.minimo) return { ok: false as const, error: `El mínimo es de ${q.minimo} noches para esas fechas.` };

    const lista = leer();
    const cuna = !!c.cuna && v.bebes > 0, banera = !!c.banera && v.bebes > 0;
    if (cuna && stockExtra(lista, 'cuna', c.llegada, c.salida) < 1) return { ok: false as const, error: 'La cuna se agotó para esas fechas.' };
    if (banera && stockExtra(lista, 'banera', c.llegada, c.salida) < 1) return { ok: false as const, error: 'La bañera se agotó para esas fechas.' };
    const unidad = unidadLibre(lista, c.tipo, c.llegada, c.salida);
    if (!unidad) return { ok: false as const, error: 'Sin lugar en esas fechas' };

    const codigo = nuevoCodigo(new Set(lista.map((r) => r.codigo)));
    const nueva: Reserva = {
      id: crypto.randomUUID(), codigo, nombre, celular, tipo: c.tipo, unidad: unidad.codigo,
      llegada: c.llegada, salida: c.salida, adultos: v.adultos, chicos: v.chicos, bebes: v.bebes,
      cuna, banera, precio: q.total, estado: 'Pendiente', creadaEn: Date.now(),
    };
    guardar([nueva, ...lista]);
    return { ok: true as const, codigo, alias: ALIAS_PAGO, precio: q.total, noches: q.noches };
  });
}

// ---- Mi reserva ----
const NO_COINCIDE = 'No encontramos una reserva con ese código y ese celular. Revisá los datos.';

function buscar(codigo: string, celular: string) {
  const cod = String(codigo ?? '').trim().toUpperCase();
  const cel = soloDigitos(String(celular ?? ''));
  if (!cod || !cel) return null;
  // Se necesitan los dos datos: si alguno no coincide, no se muestra nada.
  return leer().find((r) => r.codigo === cod && r.celular === cel) ?? null;
}

function vista(r: Reserva) {
  return {
    codigo: r.codigo, nombre: r.nombre, tipo: r.tipo, llegada: r.llegada, salida: r.salida,
    adultos: r.adultos, chicos: r.chicos, bebes: r.bebes, cuna: r.cuna, banera: r.banera,
    precio: r.precio, estado: r.estado, noches: noches(r.llegada, r.salida).length,
    puedeCancelar: r.estado !== 'Cancelada' && puedeCancelar(r.llegada),
  };
}
export type VistaReserva = ReturnType<typeof vista>;

export function verMiReserva(codigo: string, celular: string) {
  const r = buscar(codigo, celular);
  return r ? { ok: true as const, reserva: vista(r) } : { ok: false as const, error: NO_COINCIDE };
}

/** Cancela desde «Mi reserva» (hasta 72 h antes de llegar). Libera la unidad y los extras en el momento. */
export function cancelarMiReserva(codigo: string, celular: string) {
  return conBloqueo(() => {
    const r = buscar(codigo, celular);
    if (!r) return { ok: false as const, error: NO_COINCIDE };
    if (r.estado === 'Cancelada') return { ok: false as const, error: 'Esta reserva ya estaba cancelada.' };
    if (!puedeCancelar(r.llegada)) return { ok: false as const, error: 'Ya faltan menos de 72 horas: para cancelar escribinos por WhatsApp.' };
    guardar(leer().map((x) => (x.id === r.id ? { ...x, estado: 'Cancelada' as Estado } : x)));
    return { ok: true as const, reserva: vista({ ...r, estado: 'Cancelada' }) };
  });
}

// ---- Panel de la dueña ----
export function cambiarEstado(id: string, estado: 'Confirmada' | 'Cancelada') {
  return conBloqueo(() => {
    if (estado !== 'Confirmada' && estado !== 'Cancelada') return { ok: false as const, error: 'Estado inválido.' };
    const lista = leer();
    const r = lista.find((x) => x.id === id);
    if (!r) return { ok: false as const, error: 'No encontramos esa reserva.' };
    if (estado === 'Confirmada' && r.estado !== 'Pendiente') return { ok: false as const, error: 'Solo se confirman las reservas Pendientes.' };
    guardar(lista.map((x) => (x.id === id ? { ...x, estado } : x)));
    return { ok: true as const };
  });
}

/** Reservas de ejemplo (inventadas), con fechas a partir de hoy para que siempre estén vigentes. */
export function reservasDeEjemplo(hoy = hoyAR()): Reserva[] {
  // [codigo, nombre, celular, tipo, unidad, días hasta la llegada, noches, adultos, chicos, bebés, cuna, bañera, estado]
  const base: [string, string, string, Tipo, string, number, number, number, number, number, boolean, boolean, Estado][] = [
    ['CS-EJ2A3', 'Lucía Fernández', '1155550101', 'Familiar', 'F1', 10, 3, 2, 3, 1, true, false, 'Confirmada'],
    ['CS-EJ4B5', 'Martín Gómez', '1155550102', 'Familiar', 'F2', 10, 2, 2, 2, 0, false, false, 'Pendiente'],
    ['CS-EJ6C7', 'Carolina Ruiz', '1155550103', 'Compacta', 'C1', 17, 3, 2, 1, 1, true, true, 'Confirmada'],
    ['CS-EJ8D9', 'Federico Paz', '1155550104', 'Compacta', 'C2', 17, 2, 2, 0, 0, false, false, 'Cancelada'],
    ['CS-EJ3E4', 'Valeria Sosa', '1155550105', 'Familiar', 'F3', 24, 4, 2, 4, 0, false, false, 'Pendiente'],
    ['CS-EJ5F6', 'Diego Benítez', '1155550106', 'Familiar', 'F1', 40, 7, 2, 3, 1, true, false, 'Confirmada'],
    ['CS-EJ7G8', 'Romina Acosta', '1155550107', 'Compacta', 'C1', 41, 7, 2, 2, 0, false, false, 'Confirmada'],
    ['CS-EJ9H2', 'Nicolás Vega', '1155550108', 'Compacta', 'C3', 60, 5, 2, 1, 2, true, true, 'Pendiente'],
  ];
  return base.map(([codigo, nombre, celular, tipo, unidad, dias, n, adultos, chicos, bebes, cuna, banera, estado], i) => {
    const llegada = sumarDias(hoy, dias);
    // Respeta el mínimo de noches de la temporada de llegada.
    const salida = sumarDias(llegada, Math.max(n, cotizar(tipo, llegada, sumarDias(llegada, 1)).minimo));
    return {
      id: `ejemplo-${i + 1}`, codigo, nombre, celular, tipo, unidad, llegada, salida, adultos, chicos, bebes, cuna, banera,
      precio: cotizar(tipo, llegada, salida).total, estado, creadaEn: Date.now() - i * 7 * 3_600_000,
    };
  });
}

export function cargarEjemplo() {
  return conBloqueo(() => {
    const lista = leer();
    const codigos = new Set(lista.map((r) => r.codigo));
    guardar([...lista, ...reservasDeEjemplo().filter((r) => !codigos.has(r.codigo))]);
  });
}

export function borrarReservas() {
  return conBloqueo(() => {
    borrarTodo();
  });
}
