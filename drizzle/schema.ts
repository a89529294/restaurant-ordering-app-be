import {
	pgTable,
	uuid,
	timestamp,
	text,
	foreignKey,
	unique,
	bigint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const restaurantsTable = pgTable("restaurants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	name: text().default("我的餐廳"),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
});

export const inviteCodes = pgTable(
	"invite_codes",
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint({ mode: "number" })
			.primaryKey()
			.generatedByDefaultAsIdentity({
				name: "invite_codes_id_seq",
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036854775807,
				cache: 1,
			}),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		code: text().notNull(),
		usedBy: uuid("used_by"),
		usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }),
	},
	(table) => [
		foreignKey({
			columns: [table.usedBy],
			foreignColumns: [restaurants.id],
			name: "invite_codes_used_by_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		unique("invite_codes_code_key").on(table.code),
	]
);

export const sessions = pgTable(
	"sessions",
	{
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		id: bigint({ mode: "number" })
			.primaryKey()
			.generatedByDefaultAsIdentity({
				name: "sessions_id_seq",
				startWith: 1,
				increment: 1,
				minValue: 1,
				maxValue: 9223372036854775807,
				cache: 1,
			}),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		restaurantId: uuid("restaurant_id").notNull(),
		expiredAt: timestamp("expired_at", {
			withTimezone: true,
			mode: "string",
		}).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "sessions_restaurant_id_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	]
);
