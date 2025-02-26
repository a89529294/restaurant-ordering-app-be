import { Hono } from "hono";
import { embedRestaurant } from "../auth/middleware.js";
import db from "../db/index.js";
import { tables } from "../../drizzle/schema.js";

const app = new Hono();

app.post("/create", embedRestaurant, async (c) => {
	const { name } = await c.req.json();

	if (!name) {
		c.status(400);
		return c.json({ success: false });
	}

	try {
		const tableId = await db
			.insert(tables)
			.values({
				name,
				restaurantId: c.var.restaurant.id,
				qrCodeUrl: "TODO: generate unique path to order page",
			})
			.returning({ id: tables.id });

		return c.json({
			tableId,
		});
	} catch (e) {
		console.log(JSON.stringify(e));

		c.status(500);
		return c.json({ success: false });
	}

	return c.json("hi");
});

export default app;
