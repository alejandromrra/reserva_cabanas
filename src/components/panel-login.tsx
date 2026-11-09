import { useState } from 'react';

import { Aviso, botonPrimario, campo, etiqueta } from '@/components/estilos';
import { PANEL_CLAVE } from '@/lib/config';
import { abrirPanel } from '@/lib/store';

export function PanelLogin() {
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (clave.trim() === PANEL_CLAVE) abrirPanel(true);
    else setError('Clave incorrecta.');
  }

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-6">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Panel de reservas</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-stone-800">Entrá con la clave para ver, confirmar y cancelar las reservas.</p>
      </div>
      <form className="border border-stone-900 bg-white p-4 sm:p-6 md:col-span-5 md:col-start-8" onSubmit={entrar}>
        <label className={etiqueta} htmlFor="clave">Clave</label>
        <input
          autoComplete="current-password"
          className={campo}
          id="clave"
          name="clave"
          onChange={(e) => { setClave(e.target.value); setError(null); }}
          required
          type="password"
          value={clave}
        />
        {error && <div className="mt-3"><Aviso>{error}</Aviso></div>}
        <button className={`${botonPrimario} mt-4`} type="submit">Entrar</button>
      </form>
    </div>
  );
}
