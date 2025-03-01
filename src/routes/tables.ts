import { Hono } from "hono";
import { embedRestaurant } from "../auth/middleware.js";
import db from "../db/index.js";
import { tables } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

const app = new Hono();

app.post("/create", embedRestaurant, async (c) => {
  const { name } = await c.req.json();

  if (!name) {
    c.status(400);
    return c.json({ success: false });
  }

  try {
    const table = await db
      .insert(tables)
      .values({
        name,
        restaurantId: c.var.restaurant.id,
        qrCodeUrl: "TODO: generate unique path to order page",
      })
      .returning({ id: tables.id });

    return c.json({
      id: table[0].id,
      name,
      qrCodeUrl: "",
      restaurantId: c.var.restaurant.id,
    });
  } catch (e) {
    console.log(JSON.stringify(e));

    c.status(500);
    return c.json({ success: false });
  }
});

app.get("/:tableId", embedRestaurant, async (c) => {
  const tableId = c.req.param().tableId;
  const restaurantId = c.var.restaurant.id;

  const tableRows = await db
    .select()
    .from(tables)
    .where(and(eq(tables.id, tableId), eq(tables.restaurantId, restaurantId)));

  if (tableRows.length === 0) {
    c.status(404);
    return c.json({ success: false });
  }

  return c.json(tableRows[0]);
});

export default app;
