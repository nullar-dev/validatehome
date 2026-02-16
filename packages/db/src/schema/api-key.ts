import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const apiTierEnum = pgEnum("api_tier", ["free", "pro", "enterprise"]);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerName: text("customer_name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    tier: apiTierEnum("tier").notNull().default("free"),
    rateLimit: integer("rate_limit").notNull().default(100),
    monthlyQuota: integer("monthly_quota").notNull().default(3000),
    webhookUrl: text("webhook_url"),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_prefix_idx").on(table.keyPrefix),
    index("api_keys_active_idx").on(table.isActive),
  ],
);
