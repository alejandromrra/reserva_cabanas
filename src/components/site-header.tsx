import Link from 'next/link';

import { Marca } from '@/components/ilustraciones';
import { hasShell, site } from '@/lib/site';

// El encabezado de todas las rutas: dos enlaces siempre a la vista (también en 360 px), sin menú desplegable.
export function SiteHeader() {
  if (!hasShell()) return null;
  return (
    <header className="sticky top-0 z-20 border-b border-stone-900/80 bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          className="flex min-w-0 items-center gap-2.5 rounded-sm font-display text-[15px] font-bold leading-none tracking-tight focus-visible:ring-2 focus-visible:ring-brand/40 sm:text-lg"
          href="/"
        >
          {site.logo ? <img alt="" className="h-9 w-auto" src={site.logo} /> : <Marca className="hidden size-8 shrink-0 sm:block" />}
          <span className="truncate">{site.name}</span>
        </Link>
        <nav aria-label="Principal" className="flex shrink-0 items-center gap-1">
          {site.nav.map((l) => (
            <Link
              className="rounded-sm px-1.5 py-2 text-[13px] font-semibold text-stone-800 sm:text-sm transition-colors hover:bg-sierra-100 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-3"
              href={l.href}
              key={l.href}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
