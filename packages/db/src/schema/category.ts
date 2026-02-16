import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const productCategories = pgTable("product_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const programCategories = pgTable(
  "program_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .references(() => programs.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => productCategories.id)
      .notNull(),
  },
  (table) => [
    index("program_categories_program_idx").on(table.programId),
    index("program_categories_category_idx").on(table.categoryId),
    uniqueIndex("program_categories_program_category_unq").on(table.programId, table.categoryId),
  ],
);
