import { relations } from "drizzle-orm/relations";
import { restaurantsTable, inviteCodes, sessions } from "./schema.js";

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
	restaurant: one(restaurantsTable, {
		fields: [inviteCodes.usedBy],
		references: [restaurantsTable.id],
	}),
}));

export const restaurantsRelations = relations(restaurantsTable, ({ many }) => ({
	inviteCodes: many(inviteCodes),
	sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	restaurant: one(restaurantsTable, {
		fields: [sessions.restaurantId],
		references: [restaurantsTable.id],
	}),
}));
