import { db } from '@/db';
import { reservas } from '@/db/schema';

if (process.env.TOTALUM_ENV !== 'dev') throw new Error('seed: dev database only');

// Reservas de ejemplo inventadas (celulares ficticios). [codigo, nombre, cel, tipo, unidad, llegada, salida, a, c, b, cuna, banera, precio, estado]
const R: [string, string, string, string, string, string, string, number, number, number, number, number, number, string][] = [
  ['CS-EJ2A3', 'Lucía Fernández', '1155550101', 'Familiar', 'u-f1', '2026-11-13', '2026-11-16', 2, 3, 1, 1, 0, 285000, 'Confirmada'],
  ['CS-EJ4B5', 'Martín Gómez', '1155550102', 'Familiar', 'u-f2', '2026-11-13', '2026-11-15', 2, 2, 0, 0, 0, 190000, 'Pendiente'],
  ['CS-EJ6C7', 'Carolina Ruiz', '1155550103', 'Compacta', 'u-c1', '2026-11-20', '2026-11-23', 2, 1, 1, 1, 1, 210000, 'Confirmada'],
  ['CS-EJ8D9', 'Federico Paz', '1155550104', 'Compacta', 'u-c2', '2026-11-20', '2026-11-22', 2, 0, 0, 0, 0, 140000, 'Cancelada'],
  ['CS-EJ3E4', 'Valeria Sosa', '1155550105', 'Familiar', 'u-f3', '2026-12-04', '2026-12-08', 2, 4, 0, 0, 0, 380000, 'Pendiente'],
  ['CS-EJ5F6', 'Diego Benítez', '1155550106', 'Familiar', 'u-f1', '2026-12-26', '2027-01-02', 2, 3, 1, 1, 0, 1050000, 'Confirmada'],
  ['CS-EJ7G8', 'Romina Acosta', '1155550107', 'Compacta', 'u-c1', '2026-12-27', '2027-01-03', 2, 2, 0, 0, 0, 770000, 'Confirmada'],
  ['CS-EJ9H2', 'Nicolás Vega', '1155550108', 'Compacta', 'u-c3', '2027-01-10', '2027-01-15', 2, 1, 2, 1, 1, 550000, 'Pendiente'],
];
const now = Date.now();
await db.batch(R.map((r, i) => ({
  id: `seed-r${i + 1}`, codigo: r[0], nombre: r[1], celular: r[2], tipo: r[3], unidadId: r[4], llegada: r[5], salida: r[6],
  adultos: r[7], chicos: r[8], bebes: r[9], cuna: !!r[10], banera: !!r[11], precio: r[12], estado: r[13], creadaEn: now - i * 3_600_000 * 7,
})).map((v) => db.insert(reservas).values(v).onConflictDoNothing()) as never);
console.log('seeded');
