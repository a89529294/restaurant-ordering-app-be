import { serve } from "@hono/node-server";
import { Hono } from "hono";
import db from "./db/index.js";
import {
	inviteCodes as inviteCodesTable,
	restaurants as restaurantsTable,
	sessions as sessionsTable,
} from "../drizzle/schema.js";
import { env } from "hono/adapter";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import {
	createSession,
	generateSessionToken,
	invalidateSession,
	validateSessionToken,
} from "./db/auth-api.js";
import {
	deleteSessionTokenCookie,
	setSessionTokenCookie,
} from "./db/session-cookie.js";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPasswordStrength } from "./db/password.js";
import { COOKIE_EXPIRATION_DURATION } from "./constants.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createServer } from "node:https";

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

app.get("/", async (c) => {
	const restaurants = await db.select().from(restaurantsTable);
	const { NODE_ENV } = env<{ NODE_ENV: string }>(c);
	console.log(NODE_ENV);
	return c.json(restaurants);
});

app.get("/get-current-restaurant", async (c) => {
	const token = getCookie(c, "sessionToken");

	if (!token) {
		console.log("token is null");
		c.status(404);
		return c.json({ success: false });
	}

	const { session, restaurant } = await validateSessionToken(token);
	if (session === null || restaurant === null) {
		console.log(session);
		console.log(restaurant);
		console.log("session or restaurant is null");
		deleteSessionTokenCookie(c);
		c.status(404);
		return c.json({ success: false });
	}

	return c.json({
		id: restaurant.id,
		name: restaurant.name,
		email: restaurant.email,
	});
});

// TODO: implement try catch, refactor some functions to another file

app.post("/signup", async (c) => {
	const body = await c.req.json();

	const { email, password, inviteCode } = body;

	// check if email is already registered
	// if yes, return 409

	const findRestaurant = await db
		.select()
		.from(restaurantsTable)
		.where(eq(restaurantsTable.email, email));
	if (findRestaurant.length > 0) {
		c.status(409);
		return c.json({ success: false, error: "email is already registered" });
	}

	// check if invite code exists
	// if no, return 404

	const inviteCodeFromDB = await db
		.select()
		.from(inviteCodesTable)
		.where(eq(inviteCodesTable.code, inviteCode));

	if (inviteCodeFromDB.length === 0) {
		c.status(409);
		return c.json({ success: false, error: "invite code not found" });
	}

	// check if invite code is already used
	// if yes, return 409

	if (inviteCodeFromDB[0].usedBy) {
		c.status(409);
		return c.json({
			success: false,
			error: "invite code has already been used",
		});
	}

	// check if invite code has expired
	// if yes, return 409

	if (new Date() > new Date(inviteCodeFromDB[0].expiresAt)) {
		// maybe delete the invite code

		c.status(409);
		return c.json({ success: false, error: "invite code has expired" });
	}

	// check if password is strong enough
	// if no, return 409

	const isPasswordStrongEnough = await verifyPasswordStrength(body.password);
	if (!isPasswordStrongEnough) {
		c.status(409);
		return c.json({ success: false, error: "password is not strong enough" });
	}

	// if everything is ok, create a new restaurant and session and change invite code to used

	// create a new restaurant
	const newRestaurant = await db
		.insert(restaurantsTable)
		.values({
			email,
			passwordHash: await hashPassword(password),
		})
		.returning({ id: restaurantsTable.id, name: restaurantsTable.name });

	// change invite code to used
	await db
		.update(inviteCodesTable)
		.set({
			usedBy: newRestaurant[0].id,
			usedAt: new Date().toISOString(),
		})
		.where(eq(inviteCodesTable.id, inviteCodeFromDB[0].id));

	// create a new session for the restaurant
	const token = generateSessionToken();
	const session = await createSession(token, newRestaurant[0].id);
	// set session cookie
	setSessionTokenCookie(
		c,
		token,
		new Date(Date.now() + COOKIE_EXPIRATION_DURATION)
	);

	return c.json({
		id: newRestaurant[0].id,
		name: newRestaurant[0].name,
		email,
	});
});

app.post("/login", async (c) => {
	const body = await c.req.json();
	const { email, password } = body;

	if (email === null || password === null) {
		c.status(400);
		return c.json({ success: false });
	}

	const restaurant = await db
		.select({ id: restaurantsTable.id, name: restaurantsTable.name })
		.from(restaurantsTable)
		.where(eq(restaurantsTable.email, email))
		.limit(1);

	if (restaurant.length === 0) {
		c.status(404);
		return c.json({ success: false });
	}

	const { id: restaurantId, name: restaurantName } = restaurant[0];
	const token = generateSessionToken();
	await createSession(token, restaurantId);
	// set session cookie
	setSessionTokenCookie(
		c,
		token,
		new Date(Date.now() + COOKIE_EXPIRATION_DURATION)
	);

	return c.json({
		id: restaurantId,
		name: restaurantName,
		email,
	});
});

app.post("/logout", async (c) => {
	const token = getCookie(c, "sessionToken");

	if (!token) {
		c.status(400);
		return c.json({ success: false });
	}

	deleteSessionTokenCookie(c);
	await invalidateSession(token);

	return c.json({ success: true });
});

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
