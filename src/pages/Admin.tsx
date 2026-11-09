import { contenedor } from '@/components/estilos';
import { PanelLista } from '@/components/panel-lista';
import { PanelLogin } from '@/components/panel-login';
import { useTitulo } from '@/lib/titulo';
import { usePanelAbierto, useReservas } from '@/lib/store';

export default function Admin() {
  useTitulo('Panel de reservas');
  const abierto = usePanelAbierto();
  const reservas = useReservas();
  return (
    <main className="min-h-[70dvh] bg-sierra-50">
      <div className={`${contenedor} py-8 sm:py-12`}>{abierto ? <PanelLista filas={reservas} /> : <PanelLogin />}</div>
    </main>
  );
}
