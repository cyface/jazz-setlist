CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`arrangement_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`arrangement_id`) REFERENCES `arrangements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `documents_arrangement_idx` ON `documents` (`arrangement_id`);