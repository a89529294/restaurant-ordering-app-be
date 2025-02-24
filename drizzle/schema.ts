import { pgTable, uuid, timestamp, text, foreignKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const restaurants = pgTable("restaurants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().default('我的餐廳'),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
	hashedToken: text("hashed_token").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "sessions_restaurant_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const inviteCodes = pgTable("invite_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	code: text().notNull(),
	usedBy: uuid("used_by"),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.usedBy],
			foreignColumns: [restaurants.id],
			name: "invite_codes_used_by_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("invite_codes_code_key").on(table.code),
]);
