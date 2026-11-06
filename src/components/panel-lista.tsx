'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cambiarEstado, listarReservas, salirPanel } from '@/app/actions';
import { Aviso, botonPeligro, botonPrimario, botonSecundario, EstadoBadge } from '@/components/estilos';
import { fechaLegible, pesos, plural, unidadCorta } from '@/components/formato';

type Fila = NonNullable<Awaited<ReturnType<typeof listarReservas>>>[number];

const chico = 'h-9 px-3 text-sm';

export function PanelLista({ filas }: { filas: Fila[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const pendientes = filas.filter((f) => f.estado === 'Pendiente').length;

  async function cambiar(f: Fila, estado: 'Confirmada' | 'Cancelada') {
    if (estado === 'Cancelada' && !window.confirm(`¿Cancelar la reserva ${f.codigo} de ${f.nombre}?`)) return;
    setOcupado(f.id);
    setError(null);
    try {
      const r = await cambiarEstado(f.id, estado);
      if (!r.ok) setError(r.error ?? 'No se pudo cambiar el estado.');
      else iniciar(() => router.refresh());
    } catch {
      setError('No se pudo cambiar el estado. Probá de nuevo.');
    }
    setOcupado(null);
  }

  async function salir() {
    await salirPanel();
    router.refresh();
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
        <button className={botonSecundario} onClick={salir} type="button">Salir</button>
      </div>

      {error && <div className="mt-4"><Aviso>{error}</Aviso></div>}

      {filas.length === 0 ? (
        <div className="mt-8 border border-stone-900 bg-white p-8">
          <p className="font-display text-2xl font-bold">Todavía no hay reservas</p>
          <p className="mt-1 text-base text-stone-800">Cuando alguien reserve desde la página, aparece acá para confirmarla.</p>
        </div>
      ) : (
        <div className="mt-8 border border-stone-900 bg-white">
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
              {filas.map((f) => {
                const personas = [plural(f.adultos, 'adulto', 'adultos'), f.chicos ? plural(f.chicos, 'chico', 'chicos') : '', f.bebes ? plural(f.bebes, 'bebé', 'bebés') : ''].filter(Boolean).join(', ');
                const extras = [f.cuna && 'cuna', f.banera && 'bañera'].filter(Boolean).join(' y ');
                return (
                  <tr className="align-top hover:bg-sierra-50" key={f.id}>
                    <td className="min-w-0 px-3 py-3 sm:px-4">
                      <p className="font-display text-lg font-bold tracking-wide">{f.codigo}</p>
                      <p className="break-words font-medium">{f.nombre}</p>
                      <p className="break-words text-xs text-stone-700">{f.celular}</p>
                      <div className="mt-1 space-y-0.5 break-words text-xs text-stone-700 sm:hidden">
                        <p>{f.tipo} {unidadCorta(f.unidadId)} · {pesos(f.precio)}</p>
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
                      <p className="text-xs text-stone-700">Unidad {unidadCorta(f.unidadId)}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                      <p>{fechaLegible(f.llegada)}</p>
                      <p className="text-stone-700">{fechaLegible(f.salida)}</p>
                      <p className="mt-1 text-xs text-stone-700 md:hidden">{f.tipo} {unidadCorta(f.unidadId)}</p>
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
