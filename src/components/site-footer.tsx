import { Link } from 'react-router-dom';

import { site } from '@/lib/config';

export function SiteFooter() {
  return (
    <footer className="bg-brand text-sierra-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-2xl font-bold tracking-tight text-white">{site.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-6">Seis cabañas en la sierra, de dos tipos: Familiar y Compacta. Todas con cochera, galería y parrilla.</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm md:col-span-4">
          <div>
            <dt className="text-sierra-200">Llegada</dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-white">13:00</dd>
          </div>
          <div>
            <dt className="text-sierra-200">Salida</dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-white">10:00</dd>
          </div>
        </dl>
        <nav aria-label="Pie" className="flex flex-col gap-1 text-sm font-medium md:col-span-3">
          {site.nav.map((l) => (
            <Link className="w-fit rounded-sm py-1 text-white underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-accent" key={l.href} to={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-sierra-50/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <Link className="rounded-sm text-sierra-200 underline-offset-4 hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-accent" to="/admin">
            Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
