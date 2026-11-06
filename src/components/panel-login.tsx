'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { entrarPanel } from '@/app/actions';
import { Aviso, botonPrimario, campo, etiqueta } from '@/components/estilos';

export function PanelLogin() {
  const router = useRouter();
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const r = await entrarPanel(clave);
      if (r.ok) router.refresh();
      else setError(r.error ?? 'No pudimos entrar.');
    } catch {
      setError('No pudimos entrar. Probá de nuevo en unos segundos.');
    }
    setCargando(false);
  }

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-6">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Panel de reservas</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-stone-800">Entrá con la clave para ver, confirmar y cancelar las reservas.</p>
      </div>
      <form className="border border-stone-900 bg-white p-4 sm:p-6 md:col-span-5 md:col-start-8" onSubmit={entrar}>
        <label className={etiqueta} htmlFor="clave">Clave</label>
        <input autoComplete="current-password" className={campo} id="clave" name="clave" onChange={(e) => setClave(e.target.value)} required type="password" value={clave} />
        {error && <div className="mt-3"><Aviso>{error}</Aviso></div>}
        <button className={`${botonPrimario} mt-4`} disabled={cargando} type="submit">
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
