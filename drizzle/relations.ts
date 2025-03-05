import { relations } from "drizzle-orm/relations";
import { menuItemCategories, menuItemCategoryAssignments, menuItems, orderItems, orders, owners, restaurants, employees, fixedPricingPlans, tables, fixedPlanCategories, inviteCodes } from "./schema";

export const menuItemCategoryAssignmentsRelations = relations(menuItemCategoryAssignments, ({one}) => ({
	menuItemCategory: one(menuItemCategories, {
		fields: [menuItemCategoryAssignments.menuItemCategoryId],
		references: [menuItemCategories.id]
	}),
	menuItem: one(menuItems, {
		fields: [menuItemCategoryAssignments.menuItemId],
		references: [menuItems.id]
	}),
}));

export const menuItemCategoriesRelations = relations(menuItemCategories, ({one, many}) => ({
	menuItemCategoryAssignments: many(menuItemCategoryAssignments),
	fixedPlanCategories: many(fixedPlanCategories),
	restaurant: one(restaurants, {
		fields: [menuItemCategories.restaurantId],
		references: [restaurants.id]
	}),
}));

export const menuItemsRelations = relations(menuItems, ({one, many}) => ({
	menuItemCategoryAssignments: many(menuItemCategoryAssignments),
	orderItems: many(orderItems),
	restaurant: one(restaurants, {
		fields: [menuItems.restaurantId],
		references: [restaurants.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	menuItem: one(menuItems, {
		fields: [orderItems.menuItemId],
		references: [menuItems.id]
	}),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({many}) => ({
	orderItems: many(orderItems),
}));

export const restaurantsRelations = relations(restaurants, ({one, many}) => ({
	owner: one(owners, {
		fields: [restaurants.ownerId],
		references: [owners.id]
	}),
	employees: many(employees),
	tables: many(tables),
	fixedPricingPlans: many(fixedPricingPlans),
	menuItemCategories: many(menuItemCategories),
	menuItems: many(menuItems),
}));

export const ownersRelations = relations(owners, ({many}) => ({
	restaurants: many(restaurants),
	inviteCodes: many(inviteCodes),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	restaurant: one(restaurants, {
		fields: [employees.restaurantId],
		references: [restaurants.id]
	}),
	tables: many(tables),
}));

export const tablesRelations = relations(tables, ({one}) => ({
	fixedPricingPlan: one(fixedPricingPlans, {
		fields: [tables.fixedPricingPlanId],
		references: [fixedPricingPlans.id]
	}),
	restaurant: one(restaurants, {
		fields: [tables.restaurantId],
		references: [restaurants.id]
	}),
	employee: one(employees, {
		fields: [tables.waiterId],
		references: [employees.id]
	}),
}));

export const fixedPricingPlansRelations = relations(fixedPricingPlans, ({one, many}) => ({
	tables: many(tables),
	restaurant: one(restaurants, {
		fields: [fixedPricingPlans.restaurantId],
		references: [restaurants.id]
	}),
	fixedPlanCategories: many(fixedPlanCategories),
}));

export const fixedPlanCategoriesRelations = relations(fixedPlanCategories, ({one}) => ({
	menuItemCategory: one(menuItemCategories, {
		fields: [fixedPlanCategories.categoryId],
		references: [menuItemCategories.id]
	}),
	fixedPricingPlan: one(fixedPricingPlans, {
		fields: [fixedPlanCategories.fixedPlanId],
		references: [fixedPricingPlans.id]
	}),
}));

export const inviteCodesRelations = relations(inviteCodes, ({one}) => ({
	owner: one(owners, {
		fields: [inviteCodes.usedBy],
		references: [owners.id]
	}),
}));