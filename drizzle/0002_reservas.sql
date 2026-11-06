CREATE TABLE `reservas` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text DEFAULT '' NOT NULL,
	`celular` text NOT NULL,
	`tipo` text NOT NULL,
	`unidad_id` text NOT NULL,
	`llegada` text NOT NULL,
	`salida` text NOT NULL,
	`adultos` integer NOT NULL,
	`chicos` integer DEFAULT 0 NOT NULL,
	`bebes` integer DEFAULT 0 NOT NULL,
	`cuna` integer DEFAULT false NOT NULL,
	`banera` integer DEFAULT false NOT NULL,
	`precio` integer NOT NULL,
	`estado` text DEFAULT 'Pendiente' NOT NULL,
	`creada_en` integer NOT NULL,
	FOREIGN KEY (`unidad_id`) REFERENCES `unidades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservas_codigo_unique` ON `reservas` (`codigo`);--> statement-breakpoint
CREATE INDEX `reservas_unidad_fechas` ON `reservas` (`unidad_id`,`llegada`,`salida`);--> statement-breakpoint
CREATE INDEX `reservas_llegada` ON `reservas` (`llegada`);--> statement-breakpoint
CREATE INDEX `reservas_creada` ON `reservas` (`creada_en`);--> statement-breakpoint
CREATE TABLE `unidades` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`codigo` text NOT NULL
);
