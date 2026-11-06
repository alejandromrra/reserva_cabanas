# Cabañas del Sendero — sistema de reservas

Seis cabañas (F1–F3 Familiares, C1–C3 Compactas): comparación de tipos, asignación automática de unidad, cuna y bañera, "Mi reserva" para las familias y panel `/admin` para la dueña.

## Cómo correrlo
- `npm install` y `npm run dev` (abre en http://localhost:3100).
- La base de datos se crea con `npm run db:migrate`. Las 6 cabañas se cargan solas en esa migración.

Nota: la versión pedida usaba localStorage; acá las reservas se guardan en una base de datos compartida, así la dueña y las familias ven lo mismo desde cualquier dispositivo.

## Datos de ejemplo
- Las 8 reservas con códigos `CS-EJ…` (celulares 1155550101 a 1155550108) son inventadas, solo para probar: `npx tsx scripts/seed.ts`. Se pueden cancelar o borrar.
- El alias de pago (`cabanas.sierra.pago`) es de ejemplo: cambialo en `src/lib/cabanas.ts` (`ALIAS_PAGO`).

## Clave del panel
- Por defecto es `sierra2026` (de ejemplo). Para cambiarla definí la variable `PANEL_CLAVE` con la clave nueva. Si no, cambiá el valor de reserva en `src/lib/panel.ts`.

## Reglas
Tarifas, mínimos y temporadas: `src/lib/cabanas.ts`. Cupos de cuna/bañera (2 y 2): `EXTRAS_TOTAL` en el mismo archivo.
