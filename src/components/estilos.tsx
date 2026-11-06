import type { ReactNode } from 'react';

// Piezas de estilo compartidas: bloques planos, esquinas casi rectas, bordes finos (grilla suiza).
export const campo =
  'mt-1.5 h-12 w-full rounded-sm border border-stone-900/70 bg-white px-3 text-base text-stone-900 outline-none transition-colors focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 disabled:bg-stone-100';
export const etiqueta = 'block text-sm font-medium leading-tight text-stone-900';
export const botonPrimario =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-700';
export const botonSecundario =
  'inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-stone-900/70 bg-white px-4 text-sm font-semibold text-stone-900 transition-colors hover:bg-sierra-100 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-600 disabled:hover:bg-white';
export const botonPeligro =
  'inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-coral-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-coral-600/90 focus-visible:ring-2 focus-visible:ring-coral-600/40 disabled:cursor-not-allowed disabled:opacity-60';

export const contenedor = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

const estados = {
  Pendiente: 'bg-accent text-stone-900',
  Confirmada: 'bg-brand text-white',
  Cancelada: 'bg-stone-200 text-stone-700 line-through decoration-stone-500',
} as const;

export function EstadoBadge({ estado }: { estado: string }) {
  const clase = estados[estado as keyof typeof estados] ?? 'bg-stone-200 text-stone-800';
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold ${clase}`}>{estado}</span>
  );
}

export function Aviso({ children, tono = 'error' }: { children: ReactNode; tono?: 'error' | 'info' }) {
  return (
    <p
      className={`rounded-sm px-3 py-2.5 text-sm leading-snug ${tono === 'error' ? 'bg-coral-100 text-stone-900' : 'bg-sierra-100 text-stone-900'}`}
      role={tono === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
