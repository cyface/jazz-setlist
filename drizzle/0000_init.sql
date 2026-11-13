CREATE TABLE `arrangements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`composer` text,
	`musical_key` text,
	`tempo` integer NOT NULL,
	`beats_per_bar` integer DEFAULT 4 NOT NULL,
	`feel` text NOT NULL,
	`drum_implement` text NOT NULL,
	`drums_entry` text NOT NULL,
	`drums_entry_note` text,
	`solo_order` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `arrangements_user_idx` ON `arrangements` (`user_id`);--> statement-breakpoint
CREATE TABLE `setlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`setlist_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`arrangement_id` text,
	`label` text,
	FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`arrangement_id`) REFERENCES `arrangements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `setlist_items_setlist_idx` ON `setlist_items` (`setlist_id`,`position`);--> statement-breakpoint
CREATE INDEX `setlist_items_arrangement_idx` ON `setlist_items` (`arrangement_id`);--> statement-breakpoint
CREATE TABLE `setlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`venue` text,
	`show_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `setlists_user_idx` ON `setlists` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);