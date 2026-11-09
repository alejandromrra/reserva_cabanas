import { useState } from 'react';

import { Aviso, botonPeligro, botonPrimario, botonSecundario, campo, EstadoBadge, etiqueta } from '@/components/estilos';
import { fechaLegible, pesos, plural } from '@/components/formato';
import { cancelarMiReserva, type VistaReserva as Reserva, verMiReserva } from '@/lib/servicio';

export function ConsultaReserva() {
  const [codigo, setCodigo] = useState('');
  const [celular, setCelular] = useState('');
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null);

  async function ver(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setErrorCancelar(null);
    setConfirmando(false);
    try {
      const r = verMiReserva(codigo, celular);
      if (r.ok) setReserva(r.reserva);
      else {
        setReserva(null);
        setError(r.error);
      }
    } catch {
      setReserva(null);
      setError('No pudimos buscar la reserva. Probá de nuevo en unos segundos.');
    }
    setCargando(false);
  }

  async function cancelar() {
    setCancelando(true);
    setErrorCancelar(null);
    try {
      const r = await cancelarMiReserva(codigo, celular);
      if (r.ok) {
        setReserva(r.reserva);
        setConfirmando(false);
      } else setErrorCancelar(r.error);
    } catch {
      setErrorCancelar('No pudimos cancelar. Probá de nuevo en unos segundos.');
    }
    setCancelando(false);
  }

  return (
    <div className="grid gap-4">
      <form className="border border-stone-900 bg-paper p-4 sm:p-6" onSubmit={ver}>
        <div className="grid gap-3">
          <div>
            <label className={etiqueta} htmlFor="codigo">Código</label>
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className={`${campo} uppercase tracking-wider`}
              id="codigo"
              name="codigo"
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="CS-XXXXX"
              required
              spellCheck={false}
              type="text"
              value={codigo}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="celular-reserva">Celular</label>
            <input
              autoComplete="tel"
              className={campo}
              id="celular-reserva"
              inputMode="tel"
              name="celular"
              onChange={(e) => setCelular(e.target.value)}
              required
              type="tel"
              value={celular}
            />
          </div>
        </div>
        {error && <div className="mt-3"><Aviso>{error}</Aviso></div>}
        <button className={`${botonPrimario} mt-4`} disabled={cargando} type="submit">
          {cargando ? 'Buscando…' : 'Ver mi reserva'}
        </button>
      </form>

      {reserva && (
        <section aria-label="Detalle de tu reserva" className="border border-stone-900 bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-stone-700">Reserva de {reserva.nombre}</p>
              <p className="break-all font-display text-3xl font-bold tracking-wider text-brand sm:text-4xl">{reserva.codigo}</p>
            </div>
            <EstadoBadge estado={reserva.estado} />
          </div>
          {reserva.estado === 'Pendiente' && (
            <p className="mt-3 rounded-sm bg-accent px-3 py-2 text-sm font-semibold leading-snug">
              Pendiente hasta que se confirme el pago.
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-stone-900 pt-4 text-sm">
            <div>
              <dt className="text-stone-700">Cabaña</dt>
              <dd className="font-semibold">{reserva.tipo}</dd>
            </div>
            <div>
              <dt className="text-stone-700">Estadía</dt>
              <dd className="font-semibold">{plural(reserva.noches, 'noche', 'noches')}</dd>
            </div>
            <div>
              <dt className="text-stone-700">Llegada (13:00)</dt>
              <dd className="font-semibold">{fechaLegible(reserva.llegada)}</dd>
            </div>
            <div>
              <dt className="text-stone-700">Salida (10:00)</dt>
              <dd className="font-semibold">{fechaLegible(reserva.salida)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-stone-700">Personas</dt>
              <dd className="font-semibold">
                {[plural(reserva.adultos, 'adulto', 'adultos'), reserva.chicos ? plural(reserva.chicos, 'chico', 'chicos') : '', reserva.bebes ? plural(reserva.bebes, 'bebé', 'bebés') : ''].filter(Boolean).join(', ')}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-stone-700">Extras</dt>
              <dd className="font-semibold">
                {reserva.cuna || reserva.banera ? [reserva.cuna && 'Cuna', reserva.banera && 'Bañera'].filter(Boolean).join(' y ') : 'Sin extras'}
              </dd>
            </div>
            <div className="col-span-2 border-t border-stone-900 pt-3">
              <dt className="text-stone-700">Precio total</dt>
              <dd className="font-display text-4xl font-bold tabular-nums">{pesos(reserva.precio)}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-stone-900 pt-4">
            {reserva.estado === 'Cancelada' ? (
              <p className="text-sm font-medium">Esta reserva está cancelada.</p>
            ) : confirmando ? (
              <div className="grid gap-3">
                <p className="text-base font-semibold leading-snug">¿Seguro que querés cancelar la reserva {reserva.codigo}? No se puede deshacer.</p>
                {errorCancelar && <Aviso>{errorCancelar}</Aviso>}
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className={botonPeligro} disabled={cancelando} onClick={cancelar} type="button">
                    {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
                  </button>
                  <button className={botonSecundario} disabled={cancelando} onClick={() => setConfirmando(false)} type="button">
                    No, mantenerla
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <button
                  aria-describedby={reserva.puedeCancelar ? undefined : 'ayuda-cancelar'}
                  className={botonSecundario}
                  disabled={!reserva.puedeCancelar}
                  onClick={() => setConfirmando(true)}
                  type="button"
                >
                  Cancelar
                </button>
                <p className="text-sm text-stone-700" id="ayuda-cancelar">Se puede cancelar hasta 72 h antes de la llegada</p>
                {errorCancelar && <Aviso>{errorCancelar}</Aviso>}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
