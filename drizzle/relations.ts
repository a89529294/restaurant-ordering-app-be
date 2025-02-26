import { relations } from "drizzle-orm/relations";
import { restaurants, tables, sessions, inviteCodes } from "./schema";

export const tablesRelations = relations(tables, ({one}) => ({
	restaurant: one(restaurants, {
		fields: [tables.restaurantId],
		references: [restaurants.id]
	}),
}));

export const restaurantsRelations = relations(restaurants, ({many}) => ({
	tables: many(tables),
	sessions: many(sessions),
	inviteCodes: many(inviteCodes),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	restaurant: one(restaurants, {
		fields: [sessions.restaurantId],
		references: [restaurants.id]
	}),
}));

export const inviteCodesRelations = relations(inviteCodes, ({one}) => ({
	restaurant: one(restaurants, {
		fields: [inviteCodes.usedBy],
		references: [restaurants.id]
	}),
}));