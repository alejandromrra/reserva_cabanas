// El nombre del negocio, los enlaces del encabezado y la clave del panel, en un solo lugar.
export const site = {
  name: 'Cabañas del Sendero',
  nav: [
    { href: '/', label: 'Reservar' },
    { href: '/mi-reserva', label: 'Mi reserva' },
  ],
};

/**
 * Clave del panel /admin. Se toma de la variable VITE_PANEL_CLAVE y, si no existe, usa la de ejemplo.
 * Ojo: en una app sin servidor la clave viaja dentro del código del navegador; sirve para ordenar el acceso,
 * no es seguridad real. Ver el README («Cómo cambiar la clave del panel»).
 */
export const PANEL_CLAVE: string = (import.meta.env.VITE_PANEL_CLAVE as string | undefined)?.trim() || 'sierra2026';
