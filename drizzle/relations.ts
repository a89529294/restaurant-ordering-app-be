import { relations } from "drizzle-orm/relations";
import { restaurants, sessions, inviteCodes } from "./schema.js";

export const sessionsRelations = relations(sessions, ({ one }) => ({
	restaurant: one(restaurants, {
		fields: [sessions.restaurantId],
		references: [restaurants.id],
	}),
}));

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
	sessions: many(sessions),
	inviteCodes: many(inviteCodes),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
	restaurant: one(restaurants, {
		fields: [inviteCodes.usedBy],
		references: [restaurants.id],
	}),
}));
