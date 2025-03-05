import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  inviteCodes as inviteCodesTable,
  owners as ownersTable,
} from "../../drizzle/schema.js";
import {
  hashPassword,
  verifyPasswordHash,
  verifyPasswordStrength,
} from "../auth/password-helpers.js";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "../auth/session-cookie-helpers.js";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  validateSessionToken,
} from "../auth/session-helpers.js";
import { COOKIE_EXPIRATION_DURATION } from "../constants.js";
import db from "../db/index.js";
import { embedUser } from "../auth/middleware.js";
import type { Owner } from "../types/app.js";

const app = new Hono();

app.get("/get-current-user", embedUser, async (c) => {
  return c.json(c.var.user);
});

// only for owner
app.post("/signup", async (c) => {
  const body = await c.req.json();

  const { email, password, inviteCode } = body;

  // check if owner email has been registered

  const foundOwners = await db
    .select()
    .from(ownersTable)
    .where(eq(ownersTable.email, email));
  if (foundOwners.length > 0) {
    c.status(409);
    return c.json({ success: false, error: "email is already registered" });
  }

  // check if invite code exists

  const inviteCodesFromDB = await db
    .select()
    .from(inviteCodesTable)
    .where(eq(inviteCodesTable.code, inviteCode));

  if (inviteCodesFromDB.length === 0) {
    c.status(409);
    return c.json({ success: false, error: "invite code not found" });
  }

  // check if invite code is already used

  if (inviteCodesFromDB[0].usedBy) {
    c.status(409);
    return c.json({
      success: false,
      error: "invite code has already been used",
    });
  }

  // check if invite code has expired
  // if yes, return 409

  if (new Date() > new Date(inviteCodesFromDB[0].expiresAt)) {
    c.status(409);
    return c.json({ success: false, error: "invite code has expired" });
  }

  // check if password is strong enough

  const isPasswordStrongEnough = await verifyPasswordStrength(body.password);
  if (!isPasswordStrongEnough) {
    c.status(409);
    return c.json({ success: false, error: "password is not strong enough" });
  }

  // if everything is ok, create a new restaurant and session and change invite code to used

  // create a new restaurant
  const newOwners = await db
    .insert(ownersTable)
    .values({
      email,
      passwordHash: await hashPassword(password),
    })
    .returning();

  // change invite code to used
  await db
    .update(inviteCodesTable)
    .set({
      usedBy: newOwners[0].id,
      usedAt: new Date().toISOString(),
    })
    .where(eq(inviteCodesTable.id, inviteCodesFromDB[0].id));

  // create a new session for the restaurant
  const token = generateSessionToken();
  const session = await createSession(token, newOwners[0].id);
  // set session cookie
  setSessionTokenCookie(
    c,
    token,
    new Date(Date.now() + COOKIE_EXPIRATION_DURATION)
  );

  const newOwner: Owner = {
    id: newOwners[0].id,
    name: newOwners[0].name,
    email,
  };

  return c.json(newOwner);
});

// for owner, manager, waiter
app.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (email === null || password === null) {
    c.status(400);
    return c.json({ success: false });
  }

  const restaurant = await db
    .select({
      id: restaurantsTable.id,
      name: restaurantsTable.name,
      hashedPassword: restaurantsTable.passwordHash,
    })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.email, email))
    .limit(1);

  if (restaurant.length === 0) {
    c.status(404);
    return c.json({ success: false });
  }

  if (!(await verifyPasswordHash(restaurant[0].hashedPassword, password))) {
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

// for owner, manager, waiter
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

export default app;
