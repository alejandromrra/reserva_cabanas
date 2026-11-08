# Cabañas del Sendero — sistema de reservas

Seis cabañas en la sierra (F1–F3 Familiares de hasta 6 personas, C1–C3 Compactas de hasta 4). La familia compara los dos tipos lado a lado, ve cuál le entra según cuántos son, pide cuna o bañera para el bebé y reserva. La app calcula el precio por temporada y controla que la cuna y la bañera (que son pocas) no se entreguen de más. La dueña ve y gestiona todo desde `/admin`.

- **Previsualización:** https://reservascabanas-dev-temporal-link-preview-lb8faoug.webapp-project.com/
- **Reservar:** `/` · **Mi reserva** (código + celular): `/mi-reserva` · **Panel de la dueña:** `/admin`

Todos los datos son de ejemplo (ver más abajo) y no hay cobros en la app: la reserva queda *Pendiente* hasta que la dueña confirma el pago.

## Cómo correrlo

Necesitás Node 22 (`.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3100
```

`npm run dev` crea y migra solo la base local (SQLite); las 6 cabañas se cargan en la migración. Para migrar a mano: `npm run db:migrate`.

Otros comandos útiles: `npm run build` (compila), `npm run check-types-errors` (tipos).

## Cómo probarlo en 2 minutos

1. En `/` elegí fechas y cuántos viajan. Una familia de 5 solo puede elegir la Familiar (la Compacta aparece deshabilitada con el motivo); un bebé de hasta 2 años no cuenta como plaza.
2. Probá 3 noches en enero: se rechaza porque el mínimo de verano es 4.
3. Sumá un bebé y pedí cuna en dos reservas con las mismas fechas: para la tercera, la cuna aparece agotada.
4. Con el código y el celular de una reserva, entrá a `/mi-reserva`: ahí se ve el estado y se cancela (hasta 72 h antes de llegar). Al cancelar vuelven la cabaña y la cuna a todas las noches de la estadía.
5. Entrá a `/admin` con la clave para confirmar o cancelar reservas.

## Qué es dato de ejemplo

Todo lo siguiente es inventado y se cambia sin tocar la lógica:

| Qué | Dónde |
| --- | --- |
| Tarifas, temporadas y mínimos de noches | `src/lib/cabanas.ts` |
| Capacidad y descripción de cada tipo | `src/lib/cabanas.ts` (`TIPOS`) |
| Stock de cuna y bañera (2 y 2) | `src/lib/cabanas.ts` (`EXTRAS_TOTAL`) |
| Horarios de ingreso (13:00) y salida (10:00), horas de cancelación (72) | `src/lib/cabanas.ts` |
| Alias de pago `cabanas.sierra.pago` | `src/lib/cabanas.ts` (`ALIAS_PAGO`) |
| Unidades F1–F3 y C1–C3 | `drizzle/0003_unidades_iniciales.sql` |
| Clave del panel `sierra2026` | ver la sección siguiente |
| 8 reservas de prueba con códigos `CS-EJ…` y celulares `1155550101` a `1155550108` (nombres inventados) | `scripts/seed.ts` |

Las reservas de prueba son opcionales y se pueden cancelar o borrar. Se cargan con `TOTALUM_ENV=dev npx tsx scripts/seed.ts` contra la base de desarrollo del proyecto en Totalum (necesita la clave del proyecto); en una instalación local sin esa clave el script no puede conectarse, y alcanza con crear reservas desde la web.

## Cómo cambiar la clave del panel

La clave de ejemplo es `sierra2026`. **Cambiala antes de usar la app con datos reales**: está escrita en este README.

1. Definí la variable de entorno `PANEL_CLAVE` con la clave nueva (en local, `PANEL_CLAVE=miClave npm run dev`; en el sitio publicado, en las variables de entorno del proyecto).
2. Si no definís la variable, se usa el valor de reserva que está en `src/lib/panel.ts`; podés editarlo ahí.

Cambiar la clave cierra las sesiones abiertas del panel. Después de 8 intentos fallidos desde la misma IP, el ingreso se bloquea 15 minutos.

## Reglas de negocio

- **Tipo, no unidad:** el huésped elige Familiar o Compacta; la app asigna la primera unidad de ese tipo libre todas las noches. Una estadía nunca se reparte entre dos unidades.
- **Capacidad:** adultos + chicos no pueden superar la capacidad del tipo. Los bebés de hasta 2 años se cargan aparte y hacen que se ofrezcan cuna y bañera.
- **Cupo:** cada unidad tiene cupo 1 por noche. Una estadía ocupa desde la noche de llegada hasta la anterior a la salida (se puede llegar el día que otro se va). Las fechas se liberan solas al pasar.
- **Temporadas:** cada noche se cobra con la tarifa de su fecha; el mínimo de noches es el de la temporada de llegada.
- **Extras:** cuna y bañera son gratis y se controlan por noche (máximo uno de cada tipo por cabaña). Con cero disponibles en alguna noche de la estadía, aparecen agotadas. La reserva los toma en la misma operación que la unidad, así que dos pedidos a la vez no pueden llevarse el último.
- **Estados:** *Pendiente* al enviar, *Confirmada* desde `/admin`, *Cancelada*. Las dos primeras ocupan cupo. Cancelar libera el lugar en el momento.

## Nota sobre el almacenamiento

El encargo original sugería `localStorage`. Acá las reservas se guardan en una base de datos compartida (SQLite sobre Drizzle), para que la dueña y las familias vean lo mismo desde cualquier dispositivo. No hay cuentas de usuario: la familia consulta con código + celular, y la dueña entra con la clave del panel.
