import type { Metadata } from 'next';

import { listarReservas } from '@/app/actions';
import { contenedor } from '@/components/estilos';
import { PanelLista } from '@/components/panel-lista';
import { PanelLogin } from '@/components/panel-login';

export const metadata: Metadata = {
  title: 'Panel de reservas',
  robots: { index: false, follow: false },
};

export default async function Admin() {
  const filas = await listarReservas();
  return (
    <main className="min-h-[70dvh] bg-sierra-50">
      <div className={`${contenedor} py-8 sm:py-12`}>{filas === null ? <PanelLogin /> : <PanelLista filas={filas} />}</div>
    </main>
  );
}
