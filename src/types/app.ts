import type { EmployeeDBModel, OwnerDBModel, SessionDBModel } from "./db.js";
import { userType } from "../../drizzle/schema.js";

export type Owner = Omit<
  OwnerDBModel,
  "createdAt" | "updatedAt" | "passwordHash"
>;
export type Employee = Omit<
  EmployeeDBModel,
  "createdAt" | "updatedAt" | "pinHash"
>;
export type Session = Omit<SessionDBModel, "createdAt">;

export type UserType = (typeof userType.enumValues)[number];
