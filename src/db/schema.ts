import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table (Admins, with Firebase UID support and local password support)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or local admin UID
  email: text('email').notNull().unique(),
  name: text('name').notNull().default('Admin User'),
  role: text('role').notNull().default('admin'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Services table (e.g. Washing, Dry Cleaning, Ironing)
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cloth Types table (e.g. Shirt, Trousers, Saree, Suit, Bed Sheet, Curtain)
export const clothTypes = pgTable('cloth_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').default('Apparel').notNull(),
  defaultPrice: numeric('default_price', { precision: 10, scale: 2 }).notNull().default('50.00'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pricing Rules table (service + cloth type matrix)
export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  clothTypeId: integer('cloth_type_id')
    .references(() => clothTypes.id, { onDelete: 'cascade' })
    .notNull(),
  serviceId: integer('service_id')
    .references(() => services.id, { onDelete: 'cascade' })
    .notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. ORD-1001
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'restrict' })
    .notNull(),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  deliveryDate: timestamp('delivery_date').notNull(), // default 3 days from order date
  status: text('status').notNull().default('Received'), // Received, In Process, Ready, Delivered, Cancelled
  paymentStatus: text('payment_status').notNull().default('Pending'), // Paid, Pending
  paymentMethod: text('payment_method').default('Cash').notNull(), // Cash, UPI, Card
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order items / Cloth items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  clothTagId: text('cloth_tag_id').notNull(), // e.g. TAG-1001-01
  clothTypeId: integer('cloth_type_id')
    .references(() => clothTypes.id, { onDelete: 'restrict' })
    .notNull(),
  clothTypeName: text('cloth_type_name').notNull(),
  serviceId: integer('service_id')
    .references(() => services.id, { onDelete: 'restrict' })
    .notNull(),
  serviceName: text('service_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  deliveryDate: timestamp('delivery_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g. INV-1001
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'restrict' })
    .notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text('payment_status').notNull().default('Pending'), // Paid, Pending
  paymentMethod: text('payment_method').default('Cash').notNull(), // Cash, UPI, Card
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  invoices: many(invoices),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  invoices: many(invoices),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  clothType: one(clothTypes, {
    fields: [orderItems.clothTypeId],
    references: [clothTypes.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
}));

export const clothTypesRelations = relations(clothTypes, ({ many }) => ({
  pricingRules: many(pricingRules),
  orderItems: many(orderItems),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  pricingRules: many(pricingRules),
  orderItems: many(orderItems),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  clothType: one(clothTypes, {
    fields: [pricingRules.clothTypeId],
    references: [clothTypes.id],
  }),
  service: one(services, {
    fields: [pricingRules.serviceId],
    references: [services.id],
  }),
}));
