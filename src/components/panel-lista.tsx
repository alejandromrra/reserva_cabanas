import { useMemo, useState } from 'react';

import { Aviso, botonPeligro, botonPrimario, botonSecundario, campo, EstadoBadge, etiqueta } from '@/components/estilos';
import { fechaLegible, pesos, plural } from '@/components/formato';
import { PanelOcupacion } from '@/components/panel-ocupacion';
import { BotonRestaurar } from '@/components/restaurar';
import type { Estado, Reserva as Fila } from '@/lib/cabanas';
import { borrarReservas, cambiarEstado, filtrarReservas, type FiltroReservas } from '@/lib/servicio';
import { abrirPanel } from '@/lib/store';

const chico = 'h-9 px-3 text-sm';

export function PanelLista({ filas }: { filas: Fila[] }) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendientes = filas.filter((f) => f.estado === 'Pendiente').length;
  const [vista, setVista] = useState<'reservas' | 'ocupacion'>('reservas');
  const [filtro, setFiltro] = useState<FiltroReservas>({ estado: 'Todos', desde: '', hasta: '' });
  const visibles = useMemo(() => filtrarReservas(filas, filtro), [filas, filtro]);
  const hayFiltro = filtro.estado !== 'Todos' || !!filtro.desde || !!filtro.hasta;

  async function cambiar(f: Fila, estado: 'Confirmada' | 'Cancelada') {
    if (estado === 'Cancelada' && !window.confirm(`¿Cancelar la reserva ${f.codigo} de ${f.nombre}?`)) return;
    setOcupado(f.id);
    setError(null);
    try {
      const r = await cambiarEstado(f.id, estado);
      if (!r.ok) setError(r.error);
    } catch {
      setError('No se pudo cambiar el estado. Probá de nuevo.');
    }
    setOcupado(null);
  }

  async function vaciar() {
    if (!window.confirm('¿Borrar todas las reservas guardadas en este navegador? No se puede deshacer.')) return;
    await borrarReservas();
  }

  const acciones = (f: Fila) => (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
      {f.estado === 'Pendiente' && (
        <button className={`${botonPrimario} ${chico} !w-auto`} disabled={ocupado === f.id} onClick={() => cambiar(f, 'Confirmada')} type="button">
          Confirmar
        </button>
      )}
      {f.estado !== 'Cancelada' && (
        <button className={`${botonPeligro} ${chico}`} disabled={ocupado === f.id} onClick={() => cambiar(f, 'Cancelada')} type="button">
          Cancelar
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Reservas</h1>
          <p className="mt-2 text-base text-stone-800">
            {plural(filas.length, 'reserva', 'reservas')}
            {pendientes > 0 ? ` · ${plural(pendientes, 'pendiente', 'pendientes')} de confirmar` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filas.length > 0 && <button className={botonSecundario} onClick={() => void vaciar()} type="button">Borrar todo</button>}
          <button className={botonSecundario} onClick={() => { abrirPanel(false); }} type="button">Salir</button>
        </div>
      </div>

      {error && <div className="mt-4"><Aviso>{error}</Aviso></div>}

      <div className="mt-6 flex gap-2" role="tablist">
        {([['reservas', 'Reservas'], ['ocupacion', 'Ocupación y extras']] as const).map(([id, texto]) => (
          <button
            aria-selected={vista === id}
            className={`h-11 rounded-sm border border-stone-900/70 px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/40 ${vista === id ? 'bg-brand text-white' : 'bg-white hover:bg-sierra-100'}`}
            data-testid={`tab-${id}`}
            key={id}
            onClick={() => setVista(id)}
            role="tab"
            type="button"
          >
            {texto}
          </button>
        ))}
      </div>

      {vista === 'ocupacion' && <PanelOcupacion filas={filas} />}

      {vista === 'reservas' && filas.length > 0 && (
        <form className="mt-6 grid grid-cols-2 items-end gap-3 sm:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
          <div className="col-span-2 sm:col-span-1">
            <label className={etiqueta} htmlFor="f-estado">Estado</label>
            <select className={campo} id="f-estado" onChange={(e) => setFiltro({ ...filtro, estado: e.target.value as Estado | 'Todos' })} value={filtro.estado}>
              {['Todos', 'Pendiente', 'Confirmada', 'Cancelada'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="f-desde">Estadías desde</label>
            <input className={campo} id="f-desde" max={filtro.hasta || undefined} onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })} type="date" value={filtro.desde} />
          </div>
          <div>
            <label className={etiqueta} htmlFor="f-hasta">Hasta</label>
            <input className={campo} id="f-hasta" min={filtro.desde || undefined} onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })} type="date" value={filtro.hasta} />
          </div>
          <button className={`${botonSecundario} col-span-2 h-12 sm:col-span-1`} disabled={!hayFiltro} onClick={() => setFiltro({ estado: 'Todos', desde: '', hasta: '' })} type="button">
            Limpiar filtros
          </button>
          <p className="col-span-2 text-sm text-stone-800 sm:col-span-4" data-testid="conteo" role="status">
            {hayFiltro ? `${visibles.length} de ${plural(filas.length, 'reserva', 'reservas')}` : plural(filas.length, 'reserva', 'reservas')}
          </p>
        </form>
      )}

      {vista === 'reservas' && filas.length === 0 ? (
        <div className="mt-8 border border-stone-900 bg-white p-8">
          <p className="font-display text-2xl font-bold">Todavía no hay reservas</p>
          <p className="mt-1 text-base text-stone-800">Cuando alguien reserve desde este navegador, aparece acá para confirmarla. Para probar el panel, podés restaurar los datos de ejemplo.</p>
          <BotonRestaurar className={`${botonSecundario} mt-4`} />
        </div>
      ) : vista === 'reservas' && visibles.length === 0 ? (
        <div className="mt-4 border border-stone-900 bg-white p-8">
          <p className="font-display text-2xl font-bold">Ninguna reserva con esos filtros</p>
          <p className="mt-1 text-base text-stone-800">Probá con otro estado o ampliá el rango de fechas.</p>
        </div>
      ) : vista === 'ocupacion' ? null : (
        <div className="mt-4 border border-stone-900 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-900 bg-sierra-100 text-xs font-semibold text-stone-800">
              <tr>
                <th className="px-3 py-3 sm:px-4" scope="col">Reserva</th>
                <th className="hidden px-3 py-3 md:table-cell" scope="col">Cabaña</th>
                <th className="hidden px-3 py-3 sm:table-cell" scope="col">Fechas</th>
                <th className="hidden px-3 py-3 text-right lg:table-cell" scope="col">Personas</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell" scope="col">Precio</th>
                <th className="px-3 py-3 sm:px-4" scope="col">Estado</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell sm:px-4" scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {visibles.map((f) => {
                const personas = [plural(f.adultos, 'adulto', 'adultos'), f.chicos ? plural(f.chicos, 'chico', 'chicos') : '', f.bebes ? plural(f.bebes, 'bebé', 'bebés') : ''].filter(Boolean).join(', ');
                const extras = [f.cuna && 'cuna', f.banera && 'bañera'].filter(Boolean).join(' y ');
                return (
                  <tr className="align-top hover:bg-sierra-50" key={f.id}>
                    <td className="min-w-0 px-3 py-3 sm:px-4">
                      <p className="font-display text-lg font-bold tracking-wide">{f.codigo}</p>
                      <p className="break-words font-medium">{f.nombre}</p>
                      <p className="break-words text-xs text-stone-700">{f.celular}</p>
                      <div className="mt-1 space-y-0.5 break-words text-xs text-stone-700 sm:hidden">
                        <p>{f.tipo} {f.unidad} · {pesos(f.precio)}</p>
                        <p>{fechaLegible(f.llegada)} a {fechaLegible(f.salida)}</p>
                        <p>{personas}</p>
                        {extras && <p>Con {extras}</p>}
                      </div>
                      <div className="mt-1 hidden space-y-0.5 text-xs text-stone-700 sm:block lg:hidden">
                        <p>{personas}</p>
                        {extras && <p>Con {extras}</p>}
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <p className="font-medium">{f.tipo}</p>
                      <p className="text-xs text-stone-700">Unidad {f.unidad}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                      <p>{fechaLegible(f.llegada)}</p>
                      <p className="text-stone-700">{fechaLegible(f.salida)}</p>
                      <p className="mt-1 text-xs text-stone-700 md:hidden">{f.tipo} {f.unidad}</p>
                    </td>
                    <td className="hidden px-3 py-3 text-right text-xs lg:table-cell">
                      <p>{personas}</p>
                      {extras && <p className="text-stone-700">Con {extras}</p>}
                    </td>
                    <td className="hidden px-3 py-3 text-right font-semibold tabular-nums sm:table-cell">{pesos(f.precio)}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <EstadoBadge estado={f.estado} />
                      <div className="mt-2 sm:hidden">{acciones(f)}</div>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell sm:px-4">{acciones(f)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
