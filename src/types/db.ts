import type { InferSelectModel } from "drizzle-orm";
import type {
  restaurants,
  sessions,
  owners,
  employees,
} from "../../drizzle/schema.js";

export type SessionDBModel = InferSelectModel<typeof sessions>;
export type OwnerDBModel = InferSelectModel<typeof owners>;
export type EmployeeDBModel = InferSelectModel<typeof employees>;
export type RestaurantDBModel = InferSelectModel<typeof restaurants>;
