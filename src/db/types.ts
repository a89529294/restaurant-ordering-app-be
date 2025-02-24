import type { InferSelectModel } from "drizzle-orm";
import type { restaurants, sessions } from "../../drizzle/schema.js";

export type Session = InferSelectModel<typeof sessions>;
export type Restaurant = InferSelectModel<typeof restaurants>;
