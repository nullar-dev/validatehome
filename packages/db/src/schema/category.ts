import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const productCategories = pgTable("product_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const programCategories = pgTable("program_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull(),
  categoryId: uuid("category_id").notNull(),
});
