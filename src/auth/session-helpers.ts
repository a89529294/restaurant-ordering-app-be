import type { Session } from "../db/types.js";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import db from "../db/index.js";
import { sessions, owners, employees } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { COOKIE_EXPIRATION_DURATION } from "../constants.js";
import type { Employee, Owner, UserType } from "../types/app.js";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(
  token: string,
  userId: string,
  userType: UserType
): Promise<Session> {
  const hashedToken = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );

  const returnedSession = await db
    .insert(sessions)
    .values({
      hashedToken,
      createdAt: new Date().toISOString(),
      userId,
      userType,
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

  const usersType = await db
    .select({ userType: sessions.userType })
    .from(sessions)
    .where(eq(sessions.hashedToken, hashedToken));

  if (usersType.length === 0)
    return {
      session: null,
    };

  const userType = usersType[0].userType;

  if (userType === "employee") {
    const result = await db
      .select({ user: employees, session: sessions })
      .from(sessions)
      .innerJoin(employees, eq(sessions.userId, employees.id))
      .where(eq(sessions.hashedToken, hashedToken));

    if (result.length < 1) {
      return { session: null };
    }
    const { user, session } = result[0];

    if (Date.now() >= new Date(session.expiresAt).getTime()) {
      await db
        .delete(sessions)
        .where(eq(sessions.hashedToken, session.hashedToken));
      return { session: null };
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

    return {
      session,
      employee: user,
    };
  }

  if (userType === "owner") {
    const result = await db
      .select({ user: owners, session: sessions })
      .from(sessions)
      .innerJoin(owners, eq(sessions.userId, owners.id))
      .where(eq(sessions.hashedToken, hashedToken));

    if (result.length < 1) {
      return { session: null };
    }
    const { user, session } = result[0];

    if (Date.now() >= new Date(session.expiresAt).getTime()) {
      await db
        .delete(sessions)
        .where(eq(sessions.hashedToken, session.hashedToken));
      return { session: null };
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

    return {
      session,
      owner: user,
    };
  }

  const _exhaustiveCheck: never = userType;
  throw new Error(`Unexpected user type: ${_exhaustiveCheck}`);
}

export async function invalidateSession(token: string): Promise<void> {
  const hashedToken = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  await db.delete(sessions).where(eq(sessions.hashedToken, hashedToken));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export type SessionValidationResult =
  | { session: Session; owner: Owner }
  | { session: Session; employee: Employee }
  | { session: null };
