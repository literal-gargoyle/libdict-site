import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  photoURL: text("photo_url"),
  level: integer("level").default(1).notNull(),
  experience: integer("experience").default(0).notNull(),
  decksShared: integer("decks_shared").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  shareId: text("share_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  deckId: integer("deck_id").references(() => decks.id).notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
});

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deckId: integer("deck_id").references(() => decks.id).notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  totalCount: integer("total_count").default(0).notNull(),
  lastStudied: timestamp("last_studied").defaultNow().notNull(),
});

export const studyRecords = pgTable("study_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deckId: integer("deck_id").references(() => decks.id).notNull(),
  flashcardId: integer("flashcard_id").references(() => flashcards.id).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTimeMs: integer("response_time_ms"), // Time taken to respond in milliseconds
  streak: integer("streak").default(0).notNull(), // Consecutive correct or incorrect answers
  sessionDate: timestamp("session_date").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type StudyRecord = typeof studyRecords.$inferSelect;

export type LibDictFile = {
  format_version: string;
  title: string;
  sections: Record<string, Array<{ term: string; definition: string }>>;
};

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  level: true,
  experience: true,
  decksShared: true,
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
  shareId: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  correctCount: true,
  totalCount: true,
  lastStudied: true,
});

export const insertStudyRecordSchema = createInsertSchema(studyRecords).omit({
  id: true,
  sessionDate: true,
  streak: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type InsertStudyRecord = z.infer<typeof insertStudyRecordSchema>;
