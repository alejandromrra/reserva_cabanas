import { useState } from 'react';

import { restaurarEjemplo } from '@/lib/servicio';

/** «Restaurar datos de ejemplo»: vuelve a las 12 reservas de ejemplo (reemplaza lo guardado en este navegador). */
export function BotonRestaurar({ className }: { className: string }) {
  const [listo, setListo] = useState(false);
  async function restaurar() {
    if (!window.confirm('¿Restaurar los datos de ejemplo? Se reemplazan todas las reservas guardadas en este navegador por las 12 de ejemplo.')) return;
    await restaurarEjemplo();
    setListo(true);
    setTimeout(() => setListo(false), 3000);
  }
  return (
    <button className={className} data-testid="restaurar" onClick={() => void restaurar()} type="button">
      {listo ? 'Datos de ejemplo restaurados' : 'Restaurar datos de ejemplo'}
    </button>
  );
}
