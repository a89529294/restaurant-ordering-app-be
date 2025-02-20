import { relations } from "drizzle-orm/relations";
import { restaurants, inviteCodes, sessions } from "./schema.js";

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
	restaurant: one(restaurants, {
		fields: [inviteCodes.usedBy],
		references: [restaurants.id],
	}),
}));

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
	inviteCodes: many(inviteCodes),
	sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	restaurant: one(restaurants, {
		fields: [sessions.restaurantId],
		references: [restaurants.id],
	}),
}));
