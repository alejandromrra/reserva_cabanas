import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Admin from '@/pages/Admin';
import Inicio from '@/pages/Inicio';
import MiReserva from '@/pages/MiReserva';

// Carpeta donde se publica la app: «/» en un dominio propio, «/reserva_cabanas» en GitHub Pages (ver vite.config.ts).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function AlInicio() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <AlInicio />
      <SiteHeader />
      <div className="flex-1">
        <Routes>
          <Route element={<Inicio />} path="/" />
          <Route element={<MiReserva />} path="/mi-reserva" />
          <Route element={<Admin />} path="/admin" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </div>
      <SiteFooter />
    </BrowserRouter>
  );
}
