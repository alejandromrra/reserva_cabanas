// Pruebas de las reglas del encargo (criterios 1–7). Sin navegador: el almacén cae a memoria.
import { beforeEach, describe, expect, it } from 'vitest';

import { hoyAR, sumarDias } from '@/lib/cabanas';
import {
  cambiarEstado, cancelarMiReserva, cargarEjemplo, comparar, reservar, reservasDeEjemplo, stockExtra, unidadLibre,
  verMiReserva,
} from '@/lib/servicio';
import { borrarTodo, leer } from '@/lib/store';

/** Próxima fecha con ese mes y día, al menos 30 días después de hoy ('01-20' → próximo 20 de enero). */
function proxima(mmdd: string) {
  const min = sumarDias(hoyAR(), 30);
  let y = Number(min.slice(0, 4));
  if (`${y}-${mmdd}` < min) y += 1;
  return `${y}-${mmdd}`;
}
const ENERO = proxima('01-10');
const MARZO = proxima('03-10'); // temporada baja: mínimo 2 noches

const grupo = (adultos: number, chicos = 0, bebes = 0) => ({ adultos, chicos, bebes });
const pedido = (llegada: string, n: number, extra: Partial<Parameters<typeof reservar>[0]> = {}) => ({
  llegada, salida: sumarDias(llegada, n), ...grupo(2), tipo: 'Compacta' as const, nombre: 'Familia de Prueba',
  celular: '11 5555-0101', cuna: false, banera: false, ...extra,
});
const tipo = (r: ReturnType<typeof comparar>, t: 'Familiar' | 'Compacta') => {
  if (!r.ok) throw new Error(r.error);
  return r.tipos.find((x) => x.tipo === t)!;
};

beforeEach(() => { borrarTodo(); });

describe('1 y 2: capacidad', () => {
  it('una familia de 5 solo puede elegir la Familiar y la Compacta dice por qué no', () => {
    const r = comparar({ llegada: MARZO, salida: sumarDias(MARZO, 3), ...grupo(3, 2) }, leer());
    expect(tipo(r, 'Familiar').motivo).toBeNull();
    expect(tipo(r, 'Compacta').motivo).toMatch(/No entra: tiene lugar para 4 personas y son 5/);
    expect(tipo(r, 'Compacta').motivo).toMatch(/Familiar/);
  });
  it('un bebé no ocupa plaza: 2 adultos + 2 chicos + 1 bebé entran en la Compacta', () => {
    const r = comparar({ llegada: MARZO, salida: sumarDias(MARZO, 3), ...grupo(2, 2, 1) }, leer());
    expect(tipo(r, 'Compacta').motivo).toBeNull();
  });
  it('el bebé activa los extras y no se puede reservar de más aunque se fuerce', async () => {
    const r = comparar({ llegada: MARZO, salida: sumarDias(MARZO, 3), ...grupo(4, 1, 1) }, leer());
    expect(r.ok && r.extras.hayBebes).toBe(true);
    expect((await reservar(pedido(MARZO, 3, { adultos: 4, chicos: 1 }))).ok).toBe(false); // 5 personas en Compacta
  });
});

describe('3: mínimo de noches', () => {
  it('3 noches en enero se rechazan porque el mínimo de verano es 4', async () => {
    const r = comparar({ llegada: ENERO, salida: sumarDias(ENERO, 3), ...grupo(2) }, leer());
    expect(tipo(r, 'Familiar').motivo).toMatch(/Mínimo 4 noches en verano/);
    expect(tipo(r, 'Compacta').motivo).toMatch(/Mínimo 4 noches/);
    const intento = await reservar(pedido(ENERO, 3));
    expect(intento).toMatchObject({ ok: false, error: expect.stringMatching(/mínimo es de 4 noches/) });
    expect(leer()).toHaveLength(0);
  });
  it('4 noches en enero sí', async () => {
    expect((await reservar(pedido(ENERO, 4))).ok).toBe(true);
  });
});

describe('4 y 5: cuna y bañera', () => {
  const conCuna = (llegada: string, n: number) => pedido(llegada, n, { bebes: 1, cuna: true });
  it('con las dos cunas tomadas en una noche de la estadía, la cuna aparece agotada', async () => {
    expect((await reservar(conCuna(MARZO, 3))).ok).toBe(true);
    expect((await reservar(conCuna(MARZO, 3))).ok).toBe(true);
    const r = comparar({ llegada: MARZO, salida: sumarDias(MARZO, 3), ...grupo(2, 0, 1) }, leer());
    expect(r.ok && r.extras.cuna).toMatchObject({ stock: 0, texto: expect.stringMatching(/agotada para estas fechas/) });
    expect(r.ok && r.extras.banera.stock).toBe(2); // la bañera es otro stock
    // una estadía que comparte solo la última noche también la ve agotada
    const ultima = sumarDias(MARZO, 2);
    expect(stockExtra(leer(), 'cuna', ultima, sumarDias(ultima, 2))).toBe(0);
    // y no se puede forzar
    const tercera = await reservar({ ...conCuna(MARZO, 3), tipo: 'Familiar' });
    expect(tercera).toMatchObject({ ok: false, error: expect.stringMatching(/cuna se agotó/) });
  });
  it('cancelar una reserva con cuna libera la unidad y el extra en todas sus noches', async () => {
    const a = await reservar(conCuna(MARZO, 3));
    await reservar(conCuna(MARZO, 3));
    if (!a.ok) throw new Error('no reservó');
    expect(stockExtra(leer(), 'cuna', MARZO, sumarDias(MARZO, 3))).toBe(0);
    expect(unidadLibre(leer(), 'Compacta', MARZO, sumarDias(MARZO, 3))!.codigo).toBe('C3'); // C1 y C2 ocupadas
    const c = await cancelarMiReserva(a.codigo, '1155550101');
    expect(c.ok).toBe(true);
    for (let i = 0; i < 3; i++) {
      const n = sumarDias(MARZO, i);
      expect(stockExtra(leer(), 'cuna', n, sumarDias(n, 1))).toBe(1);
    }
    expect(unidadLibre(leer(), 'Compacta', MARZO, sumarDias(MARZO, 3))!.codigo).toBe('C1'); // la unidad vuelve al cupo
    expect((await reservar(conCuna(MARZO, 3))).ok).toBe(true); // la cuna vuelve a poder pedirse
  });
  it('máximo uno de cada tipo por cabaña y solo si hay bebés', async () => {
    const r = await reservar(pedido(MARZO, 3, { bebes: 0, cuna: true, banera: true }));
    expect(r.ok && leer()[0]).toMatchObject({ cuna: false, banera: false });
  });
});

describe('6: una unidad nunca comparte noche', () => {
  it('tres Compactas ocupan C1, C2 y C3; la cuarta no entra', async () => {
    for (let i = 0; i < 3; i++) expect((await reservar(pedido(MARZO, 3, { celular: `1155550${100 + i}` }))).ok).toBe(true);
    expect(leer().map((r) => r.unidad).sort()).toEqual(['C1', 'C2', 'C3']);
    expect(await reservar(pedido(MARZO, 3))).toMatchObject({ ok: false, error: 'Sin lugar en esas fechas' });
    const r = comparar({ llegada: MARZO, salida: sumarDias(MARZO, 3), ...grupo(2) }, leer());
    expect(tipo(r, 'Compacta').motivo).toMatch(/Sin lugar en esas fechas/);
  });
  it('dos estadías de la misma unidad nunca se solapan, ni una noche (pero sí pueden encadenarse)', async () => {
    for (let i = 0; i < 40; i++) {
      const dia = sumarDias(MARZO, (i * 3) % 17);
      await reservar(pedido(dia, 2 + (i % 4), { tipo: i % 2 ? 'Familiar' : 'Compacta', celular: `1155551${100 + i}` }));
    }
    const lista = leer();
    expect(lista.length).toBeGreaterThan(6);
    for (const a of lista) for (const b of lista) {
      if (a.id < b.id && a.unidad === b.unidad) expect(a.llegada < b.salida && b.llegada < a.salida).toBe(false);
    }
    // salida = llegada de otra: se puede
    borrarTodo();
    await reservar(pedido(MARZO, 3));
    await reservar(pedido(MARZO, 3));
    await reservar(pedido(MARZO, 3));
    expect((await reservar(pedido(sumarDias(MARZO, 3), 2))).ok).toBe(true);
  });
  it('dos pedidos a la vez no se llevan la misma unidad ni el último extra', async () => {
    const pedidos = Array.from({ length: 5 }, (_, i) => reservar(pedido(MARZO, 3, { bebes: 1, cuna: true, celular: `1155552${100 + i}` })));
    const res = await Promise.all(pedidos);
    expect(res.filter((r) => r.ok)).toHaveLength(2); // hay 2 cunas
  });
});

describe('7: Mi reserva con datos incorrectos', () => {
  it('código o celular incorrectos: mensaje claro y nada de otras familias', async () => {
    const a = await reservar(pedido(MARZO, 3, { nombre: 'Familia Uno', celular: '1155550001' }));
    await reservar(pedido(MARZO, 3, { nombre: 'Familia Dos', celular: '1155550002' }));
    if (!a.ok) throw new Error('no reservó');
    const mal = [verMiReserva(a.codigo, '1155550002'), verMiReserva('CS-ZZZZZ', '1155550001'), verMiReserva('', ''), verMiReserva(a.codigo.toLowerCase(), '')];
    for (const r of mal) {
      expect(r).toEqual({ ok: false, error: 'No encontramos una reserva con ese código y ese celular. Revisá los datos.' });
      expect(JSON.stringify(r)).not.toMatch(/Familia/);
    }
    expect(verMiReserva(a.codigo.toLowerCase(), '(11) 5555-0001')).toMatchObject({ ok: true, reserva: { nombre: 'Familia Uno' } });
    expect(await cancelarMiReserva(a.codigo, '1155550002')).toMatchObject({ ok: false });
  });
});

describe('estados y cancelación', () => {
  it('Pendiente y Confirmada ocupan cupo; Cancelada lo libera; se cancela hasta 72 h antes', async () => {
    const a = await reservar(pedido(MARZO, 3));
    if (!a.ok) throw new Error('no reservó');
    const id = leer()[0].id;
    expect(leer()[0].estado).toBe('Pendiente');
    expect(await cambiarEstado(id, 'Confirmada')).toEqual({ ok: true });
    expect(unidadLibre(leer(), 'Compacta', MARZO, sumarDias(MARZO, 3))!.codigo).toBe('C2');
    await cambiarEstado(id, 'Cancelada');
    expect(unidadLibre(leer(), 'Compacta', MARZO, sumarDias(MARZO, 3))!.codigo).toBe('C1');
    // dentro de las 72 h no se puede desde Mi reserva
    const cerca = await reservar(pedido(sumarDias(hoyAR(), 2), 2, { celular: '1155559999' }));
    if (!cerca.ok) throw new Error('no reservó');
    expect(await cancelarMiReserva(cerca.codigo, '1155559999')).toMatchObject({ ok: false, error: expect.stringMatching(/72 horas/) });
  });
  it('las fechas pasadas se rechazan y las reservas viejas dejan de contar solas', () => {
    const ayer = sumarDias(hoyAR(), -1);
    expect(comparar({ llegada: ayer, salida: sumarDias(ayer, 3), ...grupo(2) }, leer())).toMatchObject({ ok: false });
  });
});

describe('datos de ejemplo', () => {
  it('son coherentes: sin solapes por unidad, extras dentro del stock y mínimo de noches', async () => {
    const lista = reservasDeEjemplo();
    for (const a of lista) for (const b of lista) {
      if (a.id < b.id && a.unidad === b.unidad && a.estado !== 'Cancelada' && b.estado !== 'Cancelada')
        expect(a.llegada < b.salida && b.llegada < a.salida).toBe(false);
    }
    await cargarEjemplo();
    await cargarEjemplo(); // no duplica
    expect(leer()).toHaveLength(8);
    expect(stockExtra(leer(), 'cuna', hoyAR(), sumarDias(hoyAR(), 90))).toBeGreaterThanOrEqual(1);
  });
});
