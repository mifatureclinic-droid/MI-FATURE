CREATE TABLE `subscricoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`plano` enum('starter','clinica','premium') NOT NULL,
	`status` enum('active','trialing','past_due','canceled','incomplete') NOT NULL DEFAULT 'incomplete',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscricoes_id` PRIMARY KEY(`id`)
);
