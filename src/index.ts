import { serve } from "@hono/node-server";
import * as fs from "fs";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { createServer } from "node:https";
import * as path from "path";
import { fileURLToPath } from "url";
import { restaurants as restaurantsTable } from "../drizzle/schema.js";
import db from "./db/index.js";
import authRoutes from "./routes/auth.js";
import tableRoutes from "./routes/tables.js";

const app = new Hono();

app.use("*", secureHeaders());

app.use(
	"*",
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? "https://your-frontend-domain.com" // Replace with your actual frontend domain
				: "https://localhost:5173",
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
		exposeHeaders: ["Content-Length", "X-CSRF-Token"],
		maxAge: 86400,
	})
);

// TODO remove later, not used
app.get("/", async (c) => {
	const restaurants = await db.select().from(restaurantsTable);
	// const { NODE_ENV } = env<{ NODE_ENV: string }>(c);

	return c.json(restaurants);
});

app.route("/auth", authRoutes);
app.route("/tables", tableRoutes);

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get SSL certificate paths
const certPath = path.join(__dirname, "..", "certs", "localhost.pem");
const keyPath = path.join(__dirname, "..", "certs", "localhost-key.pem");

const port = 3000;

if (process.env.NODE_ENV === "production") {
	serve({
		fetch: app.fetch,
		port,
	});
} else {
	serve({
		fetch: app.fetch,
		createServer,
		serverOptions: {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath),
		},
		port,
	});
}
