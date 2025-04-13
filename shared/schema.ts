import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastStudiedAt: timestamp("last_studied_at"),
  shared: boolean("shared").default(false),
});

export const insertLibrarySchema = createInsertSchema(libraries).pick({
  title: true,
  userId: true,
  content: true,
  shared: true,
});

export const sharedLibraries = pgTable("shared_libraries", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").notNull(),
  sharedWithUserId: integer("shared_with_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedLibrarySchema = createInsertSchema(sharedLibraries).pick({
  libraryId: true,
  sharedWithUserId: true,
});

export const studyProgress = pgTable("study_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  libraryId: integer("library_id").notNull(),
  mastered: jsonb("mastered").notNull(),
  lastStudiedAt: timestamp("last_studied_at").defaultNow().notNull(),
});

export const insertStudyProgressSchema = createInsertSchema(studyProgress).pick({
  userId: true,
  libraryId: true,
  mastered: true,
});

// Define LibDict content structure
export const libdictSchema = z.object({
  format_version: z.string(),
  title: z.string(),
  sections: z.record(
    z.string(),
    z.array(
      z.object({
        term: z.string(),
        definition: z.string(),
      })
    )
  ),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type Library = typeof libraries.$inferSelect;

export type InsertSharedLibrary = z.infer<typeof insertSharedLibrarySchema>;
export type SharedLibrary = typeof sharedLibraries.$inferSelect;

export type InsertStudyProgress = z.infer<typeof insertStudyProgressSchema>;
export type StudyProgress = typeof studyProgress.$inferSelect;

export type LibDict = z.infer<typeof libdictSchema>;
export type FlashcardItem = {
  term: string;
  definition: string;
  section: string;
};
