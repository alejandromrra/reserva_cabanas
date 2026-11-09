import { Link } from 'react-router-dom';

import { contenedor } from '@/components/estilos';
import { Reservador } from '@/components/reservador';
import { useTitulo } from '@/lib/titulo';

const pasos = [
  ['01', 'Elegís fechas y cabaña', 'Indicás cuántos son y te mostramos qué cabaña entra, cuánto sale y si queda cuna o bañera.'],
  ['02', 'Reservás y recibís un código', 'Con tu nombre y tu celular te damos el código de la reserva y el alias para pagar.'],
  ['03', 'Pagás y confirmamos', 'La reserva queda Pendiente hasta que se confirme el pago. Después la ves y la gestionás en Mi reserva.'],
];

const temporadas = [
  ['Verano', '20/12 al 28/02', '4'],
  ['Invierno', 'Todo julio', '3'],
  ['Fiesta de octubre', '1 al 15/10', '3'],
  ['Baja', 'El resto del año', '2'],
];

export default function Inicio() {
  useTitulo('Reservá tu cabaña en la sierra');
  return (
    <main>
      <Reservador />

      <section className="bg-sierra-50">
        <div className={`${contenedor} py-12 sm:py-16`}>
          <div className="grid gap-3 border-t-2 border-stone-900 pt-4 md:grid-cols-12 md:gap-8">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:col-span-6">
              Cómo se reserva
            </h2>
          </div>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
            {pasos.map(([n, t, d]) => (
              <li className="grid grid-cols-[3.5rem_1fr] gap-x-3 md:grid-cols-1 md:content-start md:gap-y-3" key={n}>
                <span className="font-display text-5xl font-bold leading-none tabular-nums text-brand md:text-6xl">{n}</span>
                <div>
                  <h3 className="font-display text-xl font-bold">{t}</h3>
                  <p className="mt-1.5 max-w-sm text-base leading-7 text-stone-800">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-paper">
        <div className={`${contenedor} py-12 sm:py-16`}>
          <div className="grid gap-3 border-t-2 border-stone-900 pt-4 md:grid-cols-12 md:gap-8">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:col-span-6">
              Temporadas y noches mínimas
            </h2>
            <p className="max-w-md text-base leading-7 text-stone-800 md:col-span-5 md:col-start-8">
              La tarifa depende de la fecha de cada noche. Llegás desde las 13:00 y te vas hasta las 10:00.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
            {temporadas.map(([nombre, fechas, minimo], i) => (
              <div className={`border-t border-stone-900 pt-3 ${i === 0 ? 'bg-transparent' : ''}`} key={nombre}>
                <dt className="font-display text-xl font-bold leading-tight">{nombre}</dt>
                <dd className="mt-1 text-sm text-stone-700">{fechas}</dd>
                <dd className="mt-4 flex items-end gap-2">
                  <span className="font-display text-6xl font-bold leading-[0.85] tabular-nums">{minimo}</span>
                  <span className="pb-0.5 text-sm font-medium leading-tight">noches<br />como mínimo</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-accent">
        <div className={`${contenedor} grid items-center gap-6 py-10 sm:py-14 md:grid-cols-12`}>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:col-span-7">
            ¿Cambiaron los planes? Cancelás hasta 72 h antes de la llegada.
          </h2>
          <div className="md:col-span-4 md:col-start-9">
            <Link
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-stone-900 px-5 text-base font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-stone-900/50 focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
              to="/mi-reserva"
            >
              Ver mi reserva
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
