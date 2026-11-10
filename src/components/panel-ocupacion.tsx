import { useMemo, useState } from 'react';

import { botonSecundario } from '@/components/estilos';
import { fechaLegible, hoyArgentina, sumarDias } from '@/components/formato';
import { UNIDADES, type Reserva } from '@/lib/cabanas';
import { extrasPorDia, ocupacion } from '@/lib/servicio';

const DIAS = 14;
const corta = (f: string) => fechaLegible(f).slice(0, 9); // «jue 12/11»

/** Ocupación de las seis unidades y stock de cuna y bañera, noche por noche (ventana de 14 días). */
export function PanelOcupacion({ filas }: { filas: Reserva[] }) {
  const hoy = hoyArgentina();
  const [desde, setDesde] = useState(hoy);
  const grilla = useMemo(() => ocupacion(filas, desde, DIAS), [filas, desde]);
  const extras = useMemo(() => extrasPorDia(filas, desde, DIAS), [filas, desde]);
  const hasta = sumarDias(desde, DIAS - 1);

  return (
    <div className="mt-8 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-medium" data-testid="ventana">
          Noches del {corta(desde)} al {corta(hasta)}
        </p>
        <div className="flex gap-2">
          <button className={botonSecundario} onClick={() => setDesde(sumarDias(desde, -DIAS))} type="button">← Anteriores</button>
          <button className={botonSecundario} disabled={desde === hoy} onClick={() => setDesde(hoy)} type="button">Hoy</button>
          <button className={botonSecundario} onClick={() => setDesde(sumarDias(desde, DIAS))} type="button">Siguientes →</button>
        </div>
      </div>

      <section aria-labelledby="t-ocupacion">
        <h2 className="font-display text-2xl font-bold" id="t-ocupacion">Ocupación por unidad</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-800">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3.5 bg-brand" /> Confirmada</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3.5 bg-accent" /> Pendiente</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3.5 border border-stone-400 bg-white" /> Libre</span>
        </p>
        <div className="mt-3 border border-stone-900 bg-white">
          <table className="w-full table-fixed text-center text-xs" data-testid="grilla-ocupacion">
            <thead className="border-b border-stone-900 bg-sierra-100 font-semibold">
              <tr>
                <th className="w-[4.5rem] px-1 py-2 text-left sm:w-28 sm:px-3" scope="col">Noche</th>
                {UNIDADES.map((u) => <th key={u.codigo} scope="col">{u.codigo}</th>)}
              </tr>
            </thead>
            <tbody>
              {grilla.map((d) => (
                <tr className="border-b border-stone-200 last:border-0" key={d.fecha}>
                  <th className="px-1 py-1 text-left font-medium sm:px-3" scope="row">{corta(d.fecha)}</th>
                  {d.unidades.map(({ unidad, reserva }) => (
                    <td className="p-0.5" key={unidad}>
                      <div
                        aria-label={reserva ? `${unidad}, ${corta(d.fecha)}: ${reserva.estado}, ${reserva.codigo}, ${reserva.nombre}` : `${unidad}, ${corta(d.fecha)}: libre`}
                        className={`flex h-7 items-center justify-center overflow-hidden text-[10px] font-semibold tabular-nums ${
                          reserva ? (reserva.estado === 'Confirmada' ? 'bg-brand text-white' : 'bg-accent text-stone-900') : 'border border-stone-200 bg-white'
                        }`}
                        data-estado={reserva?.estado ?? 'Libre'}
                        role="img"
                        title={reserva ? `${reserva.codigo} · ${reserva.nombre}` : 'Libre'}
                      >
                        {reserva ? reserva.codigo.slice(-3) : ''}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="t-extras">
        <h2 className="font-display text-2xl font-bold" id="t-extras">Cuna y bañera por noche</h2>
        <p className="mt-1 text-sm text-stone-800">Libres cada noche, de las que hay en todo el complejo. Con 0, aparece «agotada» para quien quiera reservar.</p>
        <div className="mt-3 border border-stone-900 bg-white">
          <table className="w-full text-left text-sm" data-testid="tabla-extras">
            <thead className="border-b border-stone-900 bg-sierra-100 text-xs font-semibold">
              <tr>
                <th className="px-3 py-2" scope="col">Noche</th>
                <th className="px-3 py-2" scope="col">Cuna</th>
                <th className="px-3 py-2" scope="col">Bañera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {extras.map((d) => (
                <tr key={d.fecha}>
                  <th className="whitespace-nowrap px-3 py-2 font-medium" scope="row">{corta(d.fecha)}</th>
                  {(['cuna', 'banera'] as const).map((e) => (
                    <td className="px-3 py-2" key={e}>
                      <span className={d[e].libres === 0 ? 'font-semibold text-coral-600' : ''} data-libres={d[e].libres}>
                        {d[e].libres === 0 ? 'Agotada' : `${d[e].libres} de ${d[e].total} libres`}
                      </span>
                      {d[e].codigos.length > 0 && <span className="block text-xs text-stone-700">{d[e].codigos.join(', ')}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
