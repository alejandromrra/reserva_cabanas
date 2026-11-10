import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { fechaLegible, hoyArgentina, pesos, plural, sumarDias } from '@/components/formato';
import { Glifo, Sierra } from '@/components/ilustraciones';
import { Aviso, botonPrimario, botonSecundario, campo, contenedor, etiqueta } from '@/components/estilos';
import { crearIcs, descargarIcs, enlaceWhatsapp, textoWhatsapp } from '@/lib/calendario';
import { desglose, EN_COMUN, type Tipo } from '@/lib/cabanas';
import { site } from '@/lib/config';
import { comparar, type Comparacion, reservar } from '@/lib/servicio';
import { useReservas } from '@/lib/store';

type TipoFila = Comparacion['tipos'][number];
type Hecha = {
  codigo: string; alias: string; precio: number; noches: number; tipo: Tipo; llegada: string; salida: string;
  adultos: number; chicos: number; bebes: number; cuna: boolean; banera: boolean;
};

const opciones = (desde: number, hasta: number) => Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);

function Selector(props: { id: string; label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="min-w-0">
      <label className={`${etiqueta} flex min-h-8 items-end text-[13px] sm:min-h-9 sm:text-sm`} htmlFor={props.id}>
        {props.label}
      </label>
      <select
        className={campo}
        id={props.id}
        onChange={(e) => props.onChange(Number(e.target.value))}
        value={props.value}
      >
        {opciones(props.min, props.max).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

function Casilla(props: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input
        checked={props.checked}
        className="size-5 shrink-0 accent-brand"
        onChange={(e) => props.onChange(e.target.checked)}
        type="checkbox"
      />
      {props.children}
    </label>
  );
}

export function Reservador() {
  const [llegada, setLlegada] = useState(() => sumarDias(hoyArgentina(), 14));
  const [salida, setSalida] = useState(() => sumarDias(hoyArgentina(), 17));
  const [adultos, setAdultos] = useState(2);
  const [chicos, setChicos] = useState(0);
  const [bebes, setBebes] = useState(0);
  const hoy = hoyArgentina();

  const reservas = useReservas();
  // Las tarifas y el cupo se calculan al instante con las reservas de este navegador.
  const cons = useMemo(
    () => comparar({ llegada, salida, adultos, chicos, bebes }, reservas),
    [llegada, salida, adultos, chicos, bebes, reservas],
  );
  const res = cons.ok ? cons : null;
  const errorConsulta = cons.ok ? null : cons.error;

  const [tipoSelManual, setTipoSel] = useState<Tipo | null>(null);
  const [cunaQuiere, setCuna] = useState(false);
  const [baneraQuiere, setBanera] = useState(false);

  // La cabaña elegida se mantiene mientras siga disponible; si no, se propone la más barata que sirva.
  const tipoSel = useMemo<Tipo | null>(() => {
    if (!res) return null;
    const libres = res.tipos.filter((x) => !x.motivo);
    if (tipoSelManual && libres.some((x) => x.tipo === tipoSelManual)) return tipoSelManual;
    return libres.length ? libres.reduce((a, b) => (b.total < a.total ? b : a)).tipo : null;
  }, [res, tipoSelManual]);
  // Cuna y bañera solo cuentan si hay bebés y queda stock para todas las noches.
  const cuna = cunaQuiere && !!res?.extras.hayBebes && res.extras.cuna.stock >= 1;
  const banera = baneraQuiere && !!res?.extras.hayBebes && res.extras.banera.stock >= 1;

  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [hecha, setHecha] = useState<Hecha | null>(null);
  const [copiado, setCopiado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const elegida = res?.tipos.find((t) => t.tipo === tipoSel) ?? null;
  const puedeReservar = !!elegida && !errorConsulta;

  function cambiarLlegada(v: string) {
    setLlegada(v);
    if (v && (!salida || salida <= v)) setSalida(sumarDias(v, 3));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!elegida || enviando) return;
    setEnviando(true);
    setErrorReserva(null);
    try {
      const r = await reservar({ llegada, salida, adultos, chicos, bebes, tipo: elegida.tipo, nombre, celular, cuna, banera });
      if (r.ok) {
        setHecha({ codigo: r.codigo, alias: r.alias, precio: r.precio, noches: r.noches, tipo: elegida.tipo, llegada, salida, adultos, chicos, bebes, cuna, banera });
        setAbierto(false);
        window.scrollTo({ top: 0 });
      } else {
        setErrorReserva(r.error);
      }
    } catch {
      setErrorReserva('No pudimos enviar la reserva. Probá de nuevo en unos segundos.');
    }
    setEnviando(false);
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (hecha) {
    return (
      <section className="bg-sierra-100">
        <div className={`${contenedor} grid gap-8 py-10 sm:py-14 lg:grid-cols-12`}>
          <div className="lg:col-span-7">
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              ¡Listo! Tu cabaña quedó anotada.
            </h1>
            <p className="mt-3 text-sm font-medium text-stone-800">Tu código de reserva</p>
            <p className="mt-1 break-all font-display text-5xl font-bold leading-none tracking-wider text-brand sm:text-8xl" data-testid="codigo">
              {hecha.codigo}
            </p>
            <p className="mt-6 max-w-md rounded-sm bg-accent px-4 py-3 text-base font-semibold leading-snug">
              Tu reserva queda Pendiente hasta que se confirme el pago.
            </p>
            <p className="mt-4 max-w-md text-base leading-7 text-stone-800">
              Guardá el código: con tu celular lo usás en{' '}
              <Link className="font-semibold text-brand underline underline-offset-4" to="/mi-reserva">
                Mi reserva
              </Link>{' '}
              para ver el estado o cancelar.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="border border-stone-900 bg-white p-5 sm:p-6">
              <p className="text-sm font-medium">Alias de pago</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="min-w-0 break-all font-display text-2xl font-bold sm:text-3xl" data-testid="alias">{hecha.alias}</p>
                <button className={botonSecundario} onClick={() => copiar(hecha.alias)} type="button">
                  {copiado ? 'Copiado' : 'Copiar alias'}
                </button>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-stone-900 pt-4 text-sm">
                <div>
                  <dt className="text-stone-700">Cabaña</dt>
                  <dd className="font-semibold">{hecha.tipo}</dd>
                </div>
                <div>
                  <dt className="text-stone-700">Estadía</dt>
                  <dd className="font-semibold">{plural(hecha.noches, 'noche', 'noches')}</dd>
                </div>
                <div>
                  <dt className="text-stone-700">Llegada (13:00)</dt>
                  <dd className="font-semibold">{fechaLegible(hecha.llegada)}</dd>
                </div>
                <div>
                  <dt className="text-stone-700">Salida (10:00)</dt>
                  <dd className="font-semibold">{fechaLegible(hecha.salida)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-stone-700">Desglose por temporada</dt>
                  <dd>
                    <ul className="mt-1 divide-y divide-stone-300 border-y border-stone-300" data-testid="desglose">
                      {desglose(hecha.tipo, hecha.llegada, hecha.salida).map((f) => (
                        <li className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3" key={f.temporada}>
                          <span className="font-semibold">{f.temporada}</span>
                          <span className="tabular-nums text-stone-800">
                            {plural(f.noches, 'noche', 'noches')} × {pesos(f.tarifa)} = <strong>{pesos(f.subtotal)}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-stone-700">Total</dt>
                  <dd className="font-display text-4xl font-bold tabular-nums">{pesos(hecha.precio)}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                className={botonPrimario}
                data-testid="whatsapp"
                href={enlaceWhatsapp(textoWhatsapp(hecha, site.name, hecha.alias))}
                rel="noopener noreferrer"
                target="_blank"
              >
                Compartir por WhatsApp
              </a>
              <button
                className={`${botonSecundario} h-12`}
                data-testid="ics"
                onClick={() => descargarIcs(crearIcs(hecha, site.name), hecha.codigo)}
                type="button"
              >
                Agregar al calendario (.ics)
              </button>
            </div>
            <button
              className={`${botonSecundario} mt-4`}
              onClick={() => {
                setHecha(null);
                setNombre('');
                setCelular('');
              }}
              type="button"
            >
              Hacer otra reserva
            </button>
          </div>
        </div>
        <Sierra className="block h-auto w-full" />
      </section>
    );
  }

  const extras = res?.extras;

  return (
    <>
      <section className="bg-sierra-100">
        <div className={`${contenedor} grid gap-6 pb-6 pt-6 lg:grid-cols-12 lg:gap-12 lg:pb-12 lg:pt-14`}>
          <div className="lg:col-span-7">
            <h1 className="font-display text-[2rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Seis cabañas en la sierra. Elegí tus fechas y reservá.
            </h1>
            <p className="mt-6 hidden max-w-md text-lg leading-7 text-stone-800 sm:block">
              Dos tipos de cabaña, las dos con cochera, galería y parrilla. Mirá cuál entra para tu grupo y cuánto sale
              en la temporada que elegiste.
            </p>
            <dl className="mt-10 hidden max-w-xl grid-cols-3 gap-6 sm:grid">
              {[
                ['6', 'cabañas'],
                ['13:00', 'llegada'],
                ['10:00', 'salida'],
              ].map(([n, t]) => (
                <div className="border-t-2 border-stone-900 pt-2" key={t}>
                  <dd className="font-display text-5xl font-bold leading-none tabular-nums">{n}</dd>
                  <dt className="mt-1.5 text-sm font-medium">{t}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="self-start lg:col-span-5">
          <form className="border border-stone-900 bg-paper p-4 sm:p-6" id="reservar" onSubmit={(e) => { e.preventDefault(); if (puedeReservar) setAbierto(true); }}>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className={etiqueta} htmlFor="llegada">Llegada (13:00)</label>
                <input className={campo} id="llegada" min={hoy} onChange={(e) => cambiarLlegada(e.target.value)} required type="date" value={llegada} />
              </div>
              <div className="min-w-0">
                <label className={etiqueta} htmlFor="salida">Salida (10:00)</label>
                <input className={campo} id="salida" min={llegada ? sumarDias(llegada, 1) : hoy} onChange={(e) => setSalida(e.target.value)} required type="date" value={salida} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              <Selector id="adultos" label="¿Cuántos adultos?" max={12} min={1} onChange={setAdultos} value={adultos} />
              <Selector id="chicos" label="¿Cuántos chicos?" max={10} min={0} onChange={setChicos} value={chicos} />
              <Selector id="bebes" label="¿Bebés hasta 2 años?" max={4} min={0} onChange={setBebes} value={bebes} />
            </div>

            <p className="mt-3 min-h-5 text-sm leading-5 text-stone-800" aria-live="polite">
              {llegada && salida && salida > llegada
                ? `${fechaLegible(llegada)} a ${fechaLegible(salida)} · ${plural(Math.round((Date.parse(salida) - Date.parse(llegada)) / 86_400_000), 'noche', 'noches')}`
                : ''}
            </p>

            {errorConsulta && <div className="mt-3"><Aviso>{errorConsulta}</Aviso></div>}

            <button className={`${botonPrimario} mt-3`} disabled={!puedeReservar} onClick={() => setAbierto(true)} type="button">
              Reservar
              <svg aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="mt-2 min-h-5 text-sm leading-5 text-stone-800" aria-live="polite">
              {elegida
                ? `${elegida.tipo} · ${elegida.precioTotalTexto} en total`
                : res
                  ? 'Ninguna cabaña disponible con estos datos: mirá los motivos abajo.'
                  : ''}
            </p>
          </form>
          <p className="mt-4 hidden max-w-sm text-sm leading-6 text-stone-800 lg:block">
            La reserva queda Pendiente hasta que se confirme el pago. Cancelás desde Mi reserva hasta 72 h antes de la llegada.
          </p>
          </div>
        </div>
        <Sierra className="block h-auto w-full" />
      </section>

      <section className="bg-paper" id="cabanas">
        <div className={`${contenedor} py-12 sm:py-16`}>
          <div className="grid gap-3 border-t-2 border-stone-900 pt-4 md:grid-cols-12 md:gap-8">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:col-span-6">
              Las dos cabañas, lado a lado
            </h2>
            <p className="max-w-md text-base leading-7 text-stone-800 md:col-span-5 md:col-start-8">
              {res
                ? `Temporada ${res.tipos[0].temporada.toLowerCase()}: estadía mínima de ${plural(res.tipos[0].minimo, 'noche', 'noches')}. Tarifas por noche para tus fechas.`
                : 'Elegí fechas y cuántos viajan: acá ves la capacidad y la tarifa de cada una.'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
            {!res ? (
              [0, 1].map((i) => (
                <div className="border border-stone-300 bg-white p-6" key={i}>
                  <div className="h-8 w-1/3 rounded-sm bg-stone-200" />
                  <div className="mt-6 h-20 w-1/4 rounded-sm bg-stone-200" />
                  <div className="mt-6 h-4 w-3/4 rounded-sm bg-stone-200" />
                  <div className="mt-10 h-10 w-1/2 rounded-sm bg-stone-200" />
                </div>
              ))
            ) : (
              res.tipos.map((t) => (
                <TarjetaTipo elegida={tipoSel === t.tipo} key={t.tipo} onElegir={() => setTipoSel(t.tipo)} t={t} />
              ))
            )}
          </div>
          {!res && errorConsulta && (
            <p className="mt-4 text-sm text-stone-800">Corregí los datos de arriba para ver las tarifas.</p>
          )}

          {extras && (
            <div className="mt-6 grid gap-4 bg-sierra-100 p-4 sm:p-6 md:grid-cols-12">
              <h3 className="font-display text-xl font-bold md:col-span-3">Cuna y bañera</h3>
              {extras.hayBebes ? (
                <div className="grid gap-4 sm:grid-cols-2 md:col-span-9">
                  {(
                    [
                      ['Cuna', extras.cuna, cuna, setCuna, 'Quiero cuna'],
                      ['Bañera', extras.banera, banera, setBanera, 'Quiero bañera'],
                    ] as const
                  ).map(([nombreExtra, e, valor, setValor, texto]) => (
                    <div key={nombreExtra}>
                      <p className="text-base font-semibold">{e.texto}</p>
                      {e.stock >= 1 && (
                        <div className="mt-2">
                          <Casilla checked={valor} onChange={setValor}>{texto}</Casilla>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="max-w-xl text-base leading-7 md:col-span-9">
                  La cuna y la bañera se piden al indicar bebés: sumalos arriba en «¿Bebés hasta 2 años?» y te mostramos si
                  quedan para tus fechas.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t-2 border-stone-900 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-medium" aria-live="polite">
              {elegida ? (
                <>
                  {elegida.tipo}: <span className="font-display text-2xl font-bold tabular-nums">{elegida.precioTotalTexto}</span>{' '}
                  <span className="text-stone-800">por {plural(elegida.noches, 'noche', 'noches')}</span>
                </>
              ) : (
                'Elegí una cabaña disponible para reservar.'
              )}
            </p>
            <button className={`${botonPrimario} sm:w-64`} disabled={!puedeReservar} onClick={() => setAbierto(true)} type="button">
              Reservar
            </button>
          </div>
        </div>
      </section>

      <dialog
        aria-labelledby="titulo-reserva"
        className="m-0 mt-auto max-h-[100dvh] w-full max-w-none overflow-y-auto bg-paper p-0 text-stone-900 backdrop:bg-stone-900/60 sm:m-auto sm:max-w-lg sm:border sm:border-stone-900"
        onCancel={() => setAbierto(false)}
        onClick={(e) => { if (e.target === dialogo.current) setAbierto(false); }}
        ref={dialogo}
      >
        {elegida && (
          <form className="p-5 sm:p-6" onSubmit={enviar}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" id="titulo-reserva">Casi listo</h2>
              <button aria-label="Cerrar" className="-mr-2 -mt-1 rounded-sm p-2 hover:bg-sierra-100 focus-visible:ring-2 focus-visible:ring-brand/40" onClick={() => setAbierto(false)} type="button">
                <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-stone-900 py-4 text-sm">
              <div>
                <dt className="text-stone-700">Cabaña</dt>
                <dd className="font-semibold">{elegida.tipo}</dd>
              </div>
              <div>
                <dt className="text-stone-700">Personas</dt>
                <dd className="font-semibold">
                  {[plural(adultos, 'adulto', 'adultos'), chicos ? plural(chicos, 'chico', 'chicos') : '', bebes ? plural(bebes, 'bebé', 'bebés') : ''].filter(Boolean).join(', ')}
                </dd>
              </div>
              <div>
                <dt className="text-stone-700">Llegada (13:00)</dt>
                <dd className="font-semibold">{fechaLegible(llegada)}</dd>
              </div>
              <div>
                <dt className="text-stone-700">Salida (10:00)</dt>
                <dd className="font-semibold">{fechaLegible(salida)}</dd>
              </div>
              {(cuna || banera) && (
                <div className="col-span-2">
                  <dt className="text-stone-700">Extras</dt>
                  <dd className="font-semibold">{[cuna && 'Cuna', banera && 'Bañera'].filter(Boolean).join(' y ')}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-stone-700">Total por {plural(elegida.noches, 'noche', 'noches')}</dt>
                <dd className="font-display text-4xl font-bold tabular-nums">{elegida.precioTotalTexto}</dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-3">
              <div>
                <label className={etiqueta} htmlFor="nombre">Tu nombre</label>
                <input autoComplete="name" className={campo} id="nombre" maxLength={80} name="nombre" onChange={(e) => setNombre(e.target.value)} required type="text" value={nombre} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="celular">Tu celular</label>
                <input autoComplete="tel" className={campo} id="celular" inputMode="tel" name="celular" onChange={(e) => setCelular(e.target.value)} required type="tel" value={celular} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-800">
              La reserva queda Pendiente hasta que se confirme el pago. Te mostramos el alias al terminar.
            </p>
            {errorReserva && <div className="mt-3"><Aviso>{errorReserva}</Aviso></div>}
            <div className="mt-4 grid gap-2">
              <button className={botonPrimario} disabled={enviando} type="submit">
                {enviando ? 'Reservando…' : 'Confirmar reserva'}
              </button>
              <button className={botonSecundario} onClick={() => setAbierto(false)} type="button">Volver</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

function TarjetaTipo({ t, elegida, onElegir }: { t: TipoFila; elegida: boolean; onElegir: () => void }) {
  const bloqueada = !!t.motivo;
  return (
    <label
      className={`relative flex flex-col border p-5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand/40 sm:p-6 ${
        bloqueada
          ? 'cursor-not-allowed border-stone-300 bg-stone-100'
          : 'cursor-pointer border-stone-900 bg-white hover:bg-sierra-50 has-checked:border-brand has-checked:bg-sierra-50 has-checked:shadow-[inset_0_0_0_2px_var(--color-brand)]'
      }`}
    >
      <input checked={elegida && !bloqueada} className="peer sr-only" disabled={bloqueada} name="tipo" onChange={onElegir} type="radio" value={t.tipo} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Glifo className={`h-10 w-auto ${bloqueada ? 'opacity-50 grayscale' : ''}`} grande={t.tipo === 'Familiar'} />
          <h3 className="font-display text-3xl font-bold tracking-tight">{t.tipo}</h3>
        </div>
        <span className="hidden items-center gap-1 rounded-sm bg-brand px-2 py-1 text-xs font-semibold text-white peer-checked:inline-flex">
          <svg aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Elegida
        </span>
      </div>
      <div className="mt-5 flex items-end gap-3">
        <p className="font-display text-7xl font-bold leading-[0.85] tabular-nums">{t.cap}</p>
        <p className="pb-0.5 text-sm font-medium leading-tight">personas<br />como máximo</p>
      </div>
      <p className="mt-5 text-base leading-6">{t.detalle}.</p>
      <p className="mt-1 text-sm text-stone-700">{EN_COMUN}.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-900 pt-4">
        <div>
          <p className="text-sm text-stone-700">Tarifa por noche</p>
          <p className="font-display text-3xl font-bold tabular-nums">{pesos(t.tarifaLlegada)}</p>
        </div>
        <div>
          <p className="text-sm text-stone-700">Total, {plural(t.noches, 'noche', 'noches')}</p>
          <p className="font-display text-3xl font-bold tabular-nums">{t.precioTotalTexto}</p>
        </div>
      </div>
      {t.motivo && (
        <p className="mt-4 flex gap-2 rounded-sm bg-coral-100 px-3 py-2.5 text-sm font-medium leading-snug text-stone-900">
          <svg aria-hidden className="mt-0.5 size-4 shrink-0 text-coral-600" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" strokeLinecap="round" /></svg>
          <span>{t.motivo}</span>
        </p>
      )}
    </label>
  );
}
