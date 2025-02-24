import type { Context } from "hono";
import { env } from "hono/adapter";

export function setSessionTokenCookie(
	c: Context,
	token: string,
	expiresAt: Date
): void {
	// Always use SameSite=None with Secure for cross-site cookies
	c.header(
		"Set-Cookie",
		`sessionToken=${token}; HttpOnly; SameSite=None; Expires=${expiresAt.toUTCString()}; Path=/; Secure`
	);
}

export function deleteSessionTokenCookie(c: Context): void {
	c.header(
		"Set-Cookie",
		"sessionToken=; HttpOnly; SameSite=None; Max-Age=0; Path=/; Secure"
	);
}
