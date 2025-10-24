import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default('0.00'),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = Omit<typeof users.$inferSelect, 'password'>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Telegram account connections
export const telegramConnections = pgTable("telegram_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiId: varchar("api_id").notNull(),
  apiHash: varchar("api_hash").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  sessionString: text("session_string"), // Store encrypted session
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const telegramConnectionsRelations = relations(telegramConnections, ({ one }) => ({
  user: one(users, {
    fields: [telegramConnections.userId],
    references: [users.id],
  }),
}));

export const insertTelegramConnectionSchema = createInsertSchema(telegramConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTelegramConnection = z.infer<typeof insertTelegramConnectionSchema>;
export type TelegramConnection = typeof telegramConnections.$inferSelect;

// Orders for group creation
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupCount: integer("group_count").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, processing, completed, failed
  groupsCreated: integer("groups_created").notNull().default(0),
  groupNamePattern: varchar("group_name_pattern"),
  isPrivate: boolean("is_private").notNull().default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  groups: many(groups),
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  groupsCreated: true,
  status: true,
  errorMessage: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Created groups
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramGroupId: varchar("telegram_group_id"),
  groupName: varchar("group_name").notNull(),
  inviteLink: varchar("invite_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupsRelations = relations(groups, ({ one }) => ({
  order: one(orders, {
    fields: [groups.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [groups.userId],
    references: [users.id],
  }),
}));

export type Group = typeof groups.$inferSelect;

// Transactions for balance management
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // credit, debit
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, completed, failed
  txHash: varchar("tx_hash"), // Crypto transaction hash
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Payment settings (admin configurable)
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pricePerHundredGroups: decimal("price_per_hundred_groups", { precision: 10, scale: 2 }).notNull().default('2.00'),
  cryptoCurrency: varchar("crypto_currency", { length: 50 }).notNull().default('USDT'),
  walletAddress: varchar("wallet_address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSettingSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingSchema>;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
