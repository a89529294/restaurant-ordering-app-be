import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { validateSessionToken } from "./session-helpers.js";
import { deleteSessionTokenCookie } from "./session-cookie-helpers.js";
import type { User } from "../types/app.js";

export const embedUser = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  const token = getCookie(c, "sessionToken");

  if (!token) {
    console.log("token is null");
    c.status(302);
    return c.json({ success: false });
  }

  const { session, user } = await validateSessionToken(token);
  if (session === null || user === null) {
    console.log("session or user is null");
    deleteSessionTokenCookie(c);
    c.status(302);
    return c.json({ success: false });
  }

  c.set("user", user);

  await next();
});
