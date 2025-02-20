import { serve } from "@hono/node-server";
import { Hono } from "hono";
import db from "./db/index.js";
import { restaurantsTable } from "../drizzle/schema.js";

const app = new Hono();

app.get("/", async (c) => {
	const restaurants = await db.select().from(restaurantsTable);
	return c.json(restaurants);
});

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://${info.address}:${info.port}`);
	}
);
