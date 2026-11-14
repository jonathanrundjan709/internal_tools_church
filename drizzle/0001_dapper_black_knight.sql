CREATE TABLE `calendar_categories` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
