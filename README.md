# Cabañas del Sendero — sistema de reservas

Seis cabañas en la sierra (F1–F3 **Familiares**, hasta 6 personas; C1–C3 **Compactas**, hasta 4). La familia compara los dos tipos lado a lado, ve cuál le entra según cuántos son, pide cuna o bañera para el bebé y reserva. La app calcula el precio por temporada y controla que la cuna y la bañera (que son pocas) no se entreguen de más. La dueña gestiona las reservas desde `/admin`.

- **Stack:** React 19 + Vite + Tailwind CSS 4 + React Router. Sin servidor ni base de datos: **los datos se guardan en `localStorage`**.
- **Previsualización:** _pendiente — pegá acá la URL cuando publiques la app (ver «Publicar»)._
- **Pantallas:** reservar `/` · consultar con código y celular `#/mi-reserva` · panel de la dueña `#/admin`.

> **Importante:** como los datos viven en `localStorage`, **solo se ven en el mismo navegador** (y en el mismo dispositivo) donde se hicieron. Una familia que reserva desde su celular no aparece en el panel abierto en otra computadora. Es lo que pide el encargo; para compartir reservas entre dispositivos haría falta un servidor.

Todos los datos son de ejemplo y no hay cobros en la app.

## Cómo correrlo

Necesitás Node 20 o más (`.nvmrc` sugiere 22).

```bash
npm install
npm run dev        # http://localhost:3100
```

Otros comandos:

```bash
npm test           # pruebas de las reglas de negocio (criterios 1 a 7)
npm run build      # revisa los tipos y genera la carpeta dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

## Cómo probarlo en 2 minutos

1. En `/` elegí fechas y cuántos viajan. Una familia de 5 solo puede elegir la Familiar (la Compacta aparece deshabilitada con el motivo). Un bebé de hasta 2 años no cuenta como plaza.
2. Probá 3 noches en enero: se rechaza porque el mínimo de verano es 4.
3. Sumá un bebé y pedí cuna en dos reservas con las mismas fechas: para la tercera, la cuna aparece agotada.
4. Con el código y el celular de una reserva, entrá a `/mi-reserva`: ahí se ve el estado y se cancela (hasta 72 h antes de llegar). Al cancelar vuelven la cabaña y la cuna a todas las noches de la estadía.
5. Entrá a `/admin` con la clave, tocá «Cargar reservas de ejemplo» y probá confirmar y cancelar.

## Qué es dato de ejemplo

Todo lo siguiente es inventado y se cambia sin tocar la lógica:

| Qué | Dónde |
| --- | --- |
| Tarifas, temporadas y mínimos de noches | `src/lib/cabanas.ts` |
| Capacidad y descripción de cada tipo | `src/lib/cabanas.ts` (`TIPOS`) |
| Las seis unidades F1–F3 y C1–C3 | `src/lib/cabanas.ts` (`UNIDADES`) |
| Stock de cuna y bañera (2 y 2) | `src/lib/cabanas.ts` (`EXTRAS_TOTAL`) |
| Horarios (ingreso 13:00, salida 10:00) y horas de cancelación (72) | `src/lib/cabanas.ts` |
| Alias de pago `cabanas.sierra.pago` | `src/lib/cabanas.ts` (`ALIAS_PAGO`) |
| Nombre del negocio y enlaces | `src/lib/config.ts` |
| Clave del panel `sierra2026` | ver la sección siguiente |
| 8 reservas de ejemplo (nombres inventados, códigos `CS-EJ…`, celulares `1155550101` a `1155550108`) | `src/lib/servicio.ts` (`reservasDeEjemplo`) |

Las reservas de ejemplo **no se cargan solas**: aparecen cuando tocás «Cargar reservas de ejemplo» en `/admin`, con fechas a partir de hoy. «Borrar todo» vacía las reservas guardadas en ese navegador.

## Cómo cambiar la clave del panel

La clave de ejemplo es `sierra2026`.

1. Copiá `.env.example` a `.env` y poné tu clave: `VITE_PANEL_CLAVE=miClaveNueva`.
2. Reiniciá `npm run dev` (o volvé a hacer `npm run build`). La clave se lee al compilar.
3. En un servicio de publicación, definí la variable `VITE_PANEL_CLAVE` en su configuración antes de construir.

Si no definís la variable, se usa `sierra2026`; también podés cambiar ese valor en `src/lib/config.ts`.

**Límite de esta clave:** la app no tiene servidor, así que la clave viaja dentro del código que baja el navegador. Ordena el acceso al panel, pero **no es seguridad real**: cualquiera que mire el código puede encontrarla. Para proteger de verdad las reservas haría falta un servidor con login.

## Reglas de negocio

- **Tipo, no unidad:** el huésped elige Familiar o Compacta; la app asigna la primera unidad de ese tipo libre todas las noches. Una estadía nunca se reparte entre dos unidades.
- **Capacidad:** adultos + chicos no pueden superar la capacidad del tipo. Los bebés de hasta 2 años se cargan aparte, no cuentan como plaza y hacen que se ofrezcan cuna y bañera.
- **Cupo:** cada unidad tiene cupo 1 por noche. Una estadía ocupa desde la noche de llegada hasta la anterior a la salida (se puede llegar el día que otro se va). Las fechas se liberan solas al pasar, porque todo se calcula con la fecha de hoy.
- **Temporadas:** cada noche se cobra con la tarifa de su fecha; el mínimo de noches es el de la temporada de llegada.
- **Extras:** cuna y bañera son gratis y se controlan por noche (máximo uno de cada tipo por cabaña). Si en alguna noche de la estadía ya no queda ninguno, aparece «agotada para estas fechas». Cancelar la reserva los devuelve.
- **Estados:** *Pendiente* al enviar, *Confirmada* desde `/admin` y *Cancelada*. Las dos primeras ocupan cupo. La cancelación desde «Mi reserva» es posible hasta 72 horas antes de llegar y libera el lugar en el momento; la dueña puede cancelar siempre desde el panel.
- **Sin cuentas:** la reserva se consulta con el código y el celular; si alguno de los dos no coincide, no se muestra nada.
- **Dos pestañas a la vez:** reservar, cancelar y confirmar leen y escriben dentro de un bloqueo del navegador (Web Locks), así dos pestañas no se llevan la misma noche ni el último extra. Si el navegador no permite `localStorage` (modo privado, por ejemplo), la app funciona igual pero solo mientras la pestaña esté abierta.

## Publicar

Es un sitio estático: `npm run build` genera `dist/` (nunca se publica el código fuente). Las rutas usan `#` (`/#/mi-reserva`, `/#/admin`) y los archivos se piden con rutas relativas, así que funciona en cualquier hosting y en subcarpetas, sin reglas de redirección.

**GitHub Pages:** el workflow `.github/workflows/deploy.yml` corre las pruebas, construye y publica en cada push a `main`. Solo hay que poner Settings → Pages → Source en **GitHub Actions**. La URL queda `https://<usuario>.github.io/reserva_cabanas/`; pegala arriba, en «Previsualización».

Para cambiar la clave del panel en ese despliegue, definí `VITE_PANEL_CLAVE` como variable del repositorio y pasala en el paso `npm run build` del workflow.

## Estructura

```
src/lib/cabanas.ts      reglas puras: tipos, temporadas, tarifas, fechas, 72 h
src/lib/servicio.ts     comparar tipos, reservar, Mi reserva, cancelar, panel, datos de ejemplo
src/lib/store.ts        localStorage (con respaldo en memoria) y sesión del panel
src/lib/servicio.test.ts  pruebas de los criterios de aceptación
src/pages/              Inicio, Mi reserva, Admin
src/components/         reservador, consulta, panel, encabezado y pie
```
