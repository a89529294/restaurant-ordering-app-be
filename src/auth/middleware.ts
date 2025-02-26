import { createMiddleware } from "hono/factory";
import type { Restaurant } from "../db/types.js";
import { getCookie } from "hono/cookie";
import { validateSessionToken } from "./session-helpers.js";
import { deleteSessionTokenCookie } from "./session-cookie-helpers.js";

export const embedRestaurant = createMiddleware<{
	Variables: {
		restaurant: Omit<Restaurant, "createdAt" | "passwordHash">;
	};
}>(async (c, next) => {
	const token = getCookie(c, "sessionToken");

	if (!token) {
		console.log("token is null");
		c.status(302);
		return c.json({ success: false });
	}

	const { session, restaurant } = await validateSessionToken(token);
	if (session === null || restaurant === null) {
		console.log("session or restaurant is null");
		deleteSessionTokenCookie(c);
		c.status(302);
		return c.json({ success: false });
	}

	c.set("restaurant", {
		id: restaurant.id,
		email: restaurant.email,
		name: restaurant.name,
	});

	await next();
});
