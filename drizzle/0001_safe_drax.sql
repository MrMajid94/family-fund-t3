CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_for_month" timestamp NOT NULL,
	"note" text,
	"proof" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
-- ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "user" DROP COLUMN "email";--> statement-breakpoint
-- ALTER TABLE "user" DROP COLUMN "email_verified";--> statement-breakpoint
-- ALTER TABLE "user" DROP COLUMN "image";