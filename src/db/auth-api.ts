import type { Restaurant, Session } from "./types.js";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import db from "./index.js";
import { restaurants, sessions } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { COOKIE_EXPIRATION_DURATION } from "../constants.js";

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(
	token: string,
	restaurantId: string
): Promise<Session> {
	const hashedToken = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);

	console.log(1, token);
	console.log(1, hashedToken);
	const returnedSession = await db
		.insert(sessions)
		.values({
			hashedToken,
			createdAt: new Date().toISOString(),
			restaurantId,
			expiresAt: new Date(
				Date.now() + COOKIE_EXPIRATION_DURATION
			).toISOString(),
		})
		.returning();

	return returnedSession[0];
}

export async function validateSessionToken(
	token: string
): Promise<SessionValidationResult> {
	const hashedToken = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);
	console.log(1, token);
	console.log(2, hashedToken);
	const result = await db
		.select({ restaurant: restaurants, session: sessions })
		.from(sessions)
		.innerJoin(restaurants, eq(sessions.restaurantId, restaurants.id))
		.where(eq(sessions.hashedToken, hashedToken));

	const allSessions = await db.select().from(sessions);

	console.log(allSessions);

	if (result.length < 1) {
		return { session: null, restaurant: null };
	}
	const { restaurant, session } = result[0];

	if (Date.now() >= new Date(session.expiresAt).getTime()) {
		await db
			.delete(sessions)
			.where(eq(sessions.hashedToken, session.hashedToken));
		return { session: null, restaurant: null };
	}
	if (
		Date.now() >=
		new Date(session.expiresAt).getTime() - COOKIE_EXPIRATION_DURATION / 2
	) {
		session.expiresAt = new Date(
			Date.now() + COOKIE_EXPIRATION_DURATION
		).toISOString();
		await db
			.update(sessions)
			.set({
				expiresAt: session.expiresAt,
			})
			.where(eq(sessions.id, session.id));
	}
	return { session, restaurant };
}

export async function invalidateSession(token: string): Promise<void> {
	const hashedToken = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);
	await db.delete(sessions).where(eq(sessions.hashedToken, hashedToken));
}

export async function invalidateAllSessions(
	restaurantId: string
): Promise<void> {
	await db.delete(sessions).where(eq(sessions.restaurantId, restaurantId));
}

export type SessionValidationResult =
	| { session: Session; restaurant: Restaurant }
	| { session: null; restaurant: null };
