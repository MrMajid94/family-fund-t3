CREATE TABLE "archived_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"amount" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_for_month" timestamp NOT NULL,
	"note" text,
	"proof" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_balance" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" text NOT NULL,
	"note" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_spending" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" text NOT NULL,
	"reason" text NOT NULL,
	"recipient" text,
	"date" timestamp NOT NULL,
	"note" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pg-drizzle_post" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "pg-drizzle_post" CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "created_by_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_year" ADD COLUMN "monthly_amount" text DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_balance" ADD CONSTRAINT "bank_balance_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_spending" ADD CONSTRAINT "fund_spending_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;