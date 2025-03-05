import {
  pgTable,
  foreignKey,
  uuid,
  timestamp,
  smallint,
  unique,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const employeeRole = pgEnum("EMPLOYEE_ROLE", ["manager", "waiter"]);
export const orderStatus = pgEnum("ORDER_STATUS", ["in_progress", "delivered"]);
export const pricingModel = pgEnum("PRICING_MODEL", ["per_item", "fixed"]);
export const tableStatus = pgEnum("TABLE_STATUS", [
  "available",
  "reserved",
  "occupied",
]);
export const userType = pgEnum("USER_TYPE", ["owner", "employee"]);

export const menuItemCategoryAssignments = pgTable(
  "menu_item_category_assignments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    menuItemId: uuid("menu_item_id").defaultRandom().notNull(),
    menuItemCategoryId: uuid("menu_item_category_id").defaultRandom().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.menuItemCategoryId],
      foreignColumns: [menuItemCategories.id],
      name: "menu_item_category_assignments_menu_item_category_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.menuItemId],
      foreignColumns: [menuItems.id],
      name: "menu_item_category_assignments_menu_item_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    orderId: uuid("order_id").defaultRandom().notNull(),
    menuItemId: uuid("menu_item_id").defaultRandom().notNull(),
    quantity: smallint()
      .default(sql`'1'`)
      .notNull(),
    status: orderStatus().default("in_progress").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.menuItemId],
      foreignColumns: [menuItems.id],
      name: "order_items_menu_item_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_items_order_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const owners = pgTable(
  "owners",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().default("老闆"),
    email: text().notNull(),
    passwordHash: text("password_hash").notNull(),
  },
  (table) => [unique("owners_email_key").on(table.email)]
);

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().default("我的餐廳"),
    phone: text(),
    location: text(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    ownerId: uuid("owner_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [owners.id],
      name: "restaurants_owner_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const employees = pgTable(
  "employees",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    pinHash: text("pin_hash").notNull(),
    role: employeeRole().notNull(),
    restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.restaurantId],
      foreignColumns: [restaurants.id],
      name: "employees_restaurant_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const tables = pgTable(
  "tables",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    qrCodeUrl: text("qr_code_url").notNull(),
    restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
    name: text().notNull(),
    startAt: timestamp("start_at", { withTimezone: true, mode: "string" }),
    endAt: timestamp("end_at", { withTimezone: true, mode: "string" }),
    status: tableStatus().default("available").notNull(),
    customerPhone: text("customer_phone"),
    customerLastName: text("customer_last_name"),
    waiterId: uuid("waiter_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    pricingModel: pricingModel("pricing_model").default("per_item").notNull(),
    fixedPricingPlanId: uuid("fixed_pricing_plan_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.fixedPricingPlanId],
      foreignColumns: [fixedPricingPlans.id],
      name: "tables_fixed_pricing_plan_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.restaurantId],
      foreignColumns: [restaurants.id],
      name: "tables_restaurant_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.waiterId],
      foreignColumns: [employees.id],
      name: "tables_waiter_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    unique("tables_name_key").on(table.name),
  ]
);

export const orders = pgTable("orders", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  tableId: uuid("table_id").defaultRandom().notNull(),
  totalPrice: integer("total_price"),
  notes: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  status: orderStatus().default("in_progress").notNull(),
});

export const fixedPricingPlans = pgTable(
  "fixed_pricing_plans",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    price: integer(),
    restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.restaurantId],
      foreignColumns: [restaurants.id],
      name: "fixed_pricing_plans_restaurant_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const fixedPlanCategories = pgTable(
  "fixed_plan_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    fixedPlanId: uuid("fixed_plan_id").defaultRandom().notNull(),
    categoryId: uuid("category_id").defaultRandom().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [menuItemCategories.id],
      name: "fixed_plan_categories_category_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.fixedPlanId],
      foreignColumns: [fixedPricingPlans.id],
      name: "fixed_plan_categories_fixed_plan_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    unique("unique_fixed_plan_category").on(
      table.fixedPlanId,
      table.categoryId
    ),
  ]
);

export const menuItemCategories = pgTable(
  "menu_item_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.restaurantId],
      foreignColumns: [restaurants.id],
      name: "menu_item_categories_restaurant_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    price: integer().notNull(),
    restaurantId: uuid("restaurant_id").defaultRandom().notNull(),
    availability: boolean().default(true).notNull(),
    imgUrl: text("img_url"),
    description: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.restaurantId],
      foreignColumns: [restaurants.id],
      name: "menu_items_restaurant_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const sessions = pgTable("sessions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  hashedToken: text("hashed_token").notNull(),
  userId: uuid("user_id").notNull(),
  userType: userType("user_type").notNull(),
});

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    code: text().notNull(),
    usedBy: uuid("used_by"),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() + '3 days'::interval)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.usedBy],
      foreignColumns: [owners.id],
      name: "invite_codes_used_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    unique("invite_codes_code_key").on(table.code),
  ]
);
