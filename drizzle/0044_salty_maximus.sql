ALTER TABLE `pontoRegistros` ADD `metodoValidacao` varchar(30) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `pontoRegistros` ADD `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `pontoRegistros` ADD `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `pontoRegistros` ADD `precisaoMetros` int;--> statement-breakpoint
ALTER TABLE `pontoRegistros` ADD `distanciaMetros` int;--> statement-breakpoint
ALTER TABLE `pontoRegistros` ADD `confiancaFacial` decimal(6,4);