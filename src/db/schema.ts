import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
// The project's Drizzle schema — the source of truth for `npm run db:generate` (A3.5). Add the app's tables
// below. Event logs, telemetry and analytics streams do not belong in this database (A3.18).
export * from './schema.auth';

// Cabañas del complejo (F1–F3 familiares, C1–C3 compactas).
export const unidades = sqliteTable('unidades', {
  id: text().primaryKey(),
  tipo: text().notNull(), // 'Familiar' | 'Compacta'
  codigo: text().notNull(),
});

// Fechas como texto 'AAAA-MM-DD'. Las noches ocupadas van de llegada (incluida) a salida (excluida).
export const reservas = sqliteTable(
  'reservas',
  {
    id: text().primaryKey(),
    codigo: text().notNull(),
    nombre: text().notNull().default(''),
    celular: text().notNull(), // solo dígitos
    tipo: text().notNull(),
    unidadId: text()
      .notNull()
      .references(() => unidades.id),
    llegada: text().notNull(),
    salida: text().notNull(),
    adultos: integer().notNull(),
    chicos: integer().notNull().default(0),
    bebes: integer().notNull().default(0),
    cuna: integer({ mode: 'boolean' }).notNull().default(false),
    banera: integer({ mode: 'boolean' }).notNull().default(false),
    precio: integer().notNull(),
    estado: text().notNull().default('Pendiente'), // Pendiente | Confirmada | Cancelada
    creadaEn: integer().notNull(),
  },
  (t) => [
    uniqueIndex('reservas_codigo_unique').on(t.codigo),
    index('reservas_unidad_fechas').on(t.unidadId, t.llegada, t.salida),
    index('reservas_llegada').on(t.llegada),
    index('reservas_creada').on(t.creadaEn),
  ],
);
