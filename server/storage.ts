import { 
  users, decks, sections, flashcards, studySessions, studyRecords,
  type User, type Deck, type Section, type Flashcard, type StudySession, type StudyRecord,
  type InsertUser, type InsertDeck, type InsertSection, type InsertFlashcard, type InsertStudySession,
  type InsertStudyRecord
} from "@shared/schema";

// Import the FirestoreStorage implementation
import { FirestoreStorage } from "./firestore-storage";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;

  // Decks
  getDeck(id: number): Promise<Deck | undefined>;
  getDeckByShareId(shareId: string): Promise<Deck | undefined>;
  getDecksWithData(userId: number): Promise<any[]>;
  getAllPublicDecks(): Promise<Deck[]>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(deck: Deck): Promise<Deck>;
  deleteDeck(id: number): Promise<void>;

  // Sections
  getSection(id: number): Promise<Section | undefined>;
  getSectionsByDeckId(deckId: number): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  deleteSection(id: number): Promise<void>;

  // Flashcards
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  getFlashcardsBySectionId(sectionId: number): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  deleteFlashcard(id: number): Promise<void>;

  // Study Sessions
  getStudySession(userId: number, deckId: number): Promise<StudySession | undefined>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  updateStudySession(session: StudySession): Promise<StudySession>;
  deleteStudySession(id: number): Promise<void>;
  
  // Study Analytics
  createStudyRecord(record: InsertStudyRecord): Promise<StudyRecord>;
  getStudyRecordsByUser(userId: number): Promise<StudyRecord[]>;
  getStudyRecordsByDeck(deckId: number): Promise<StudyRecord[]>;
  getStudyRecordsByUserAndDeck(userId: number, deckId: number): Promise<StudyRecord[]>;
  getStudyRecordsByFlashcard(flashcardId: number): Promise<StudyRecord[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private decks: Map<number, Deck>;
  private sections: Map<number, Section>;
  private flashcards: Map<number, Flashcard>;
  private studySessions: Map<number, StudySession>;
  private studyRecords: Map<number, StudyRecord>;

  private userIdCounter: number;
  private deckIdCounter: number;
  private sectionIdCounter: number;
  private flashcardIdCounter: number;
  private sessionIdCounter: number;
  private recordIdCounter: number;

  constructor() {
    this.users = new Map();
    this.decks = new Map();
    this.sections = new Map();
    this.flashcards = new Map();
    this.studySessions = new Map();
    this.studyRecords = new Map();

    this.userIdCounter = 1;
    this.deckIdCounter = 1;
    this.sectionIdCounter = 1;
    this.flashcardIdCounter = 1;
    this.sessionIdCounter = 1;
    this.recordIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      level: 1,
      experience: 0,
      decksShared: 0
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  // Deck methods
  async getDeck(id: number): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async getDeckByShareId(shareId: string): Promise<Deck | undefined> {
    return Array.from(this.decks.values()).find(
      (deck) => deck.shareId === shareId
    );
  }

  async getDecksWithData(userId: number): Promise<any[]> {
    // Get all decks for user
    const userDecks = Array.from(this.decks.values()).filter(
      (deck) => deck.userId === userId
    );

    // Get card counts and study sessions for each deck
    const decksWithData = await Promise.all(
      userDecks.map(async (deck) => {
        const deckSections = await this.getSectionsByDeckId(deck.id);
        let cardCount = 0;

        // Count cards in all sections
        for (const section of deckSections) {
          const sectionCards = await this.getFlashcardsBySectionId(section.id);
          cardCount += sectionCards.length;
        }

        // Get study session
        const studySession = await this.getStudySession(userId, deck.id);

        return {
          ...deck,
          cardCount,
          studySession
        };
      })
    );

    return decksWithData;
  }

  async getAllPublicDecks(): Promise<Deck[]> {
    // Get all public decks with share IDs
    return Array.from(this.decks.values()).filter(
      (deck) => deck.isPublic && deck.shareId !== null
    );
  }

  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    const id = this.deckIdCounter++;
    const now = new Date();
    const deck: Deck = {
      ...insertDeck,
      id,
      shareId: null,
      createdAt: now,
      updatedAt: now,
      description: insertDeck.description || null,
      isPublic: insertDeck.isPublic ?? false
    };
    this.decks.set(id, deck);
    return deck;
  }

  async updateDeck(deck: Deck): Promise<Deck> {
    const updatedDeck = {
      ...deck,
      updatedAt: new Date()
    };
    this.decks.set(deck.id, updatedDeck);
    return updatedDeck;
  }

  async deleteDeck(id: number): Promise<void> {
    // Delete associated sections, flashcards, and study sessions
    const deckSections = await this.getSectionsByDeckId(id);
    
    for (const section of deckSections) {
      await this.deleteSection(section.id);
    }
    
    // Delete study sessions for this deck
    const sessionsToDelete = Array.from(this.studySessions.values())
      .filter(session => session.deckId === id);
    
    for (const session of sessionsToDelete) {
      await this.deleteStudySession(session.id);
    }
    
    // Delete the deck
    this.decks.delete(id);
  }

  // Section methods
  async getSection(id: number): Promise<Section | undefined> {
    return this.sections.get(id);
  }

  async getSectionsByDeckId(deckId: number): Promise<Section[]> {
    return Array.from(this.sections.values()).filter(
      (section) => section.deckId === deckId
    );
  }

  async createSection(insertSection: InsertSection): Promise<Section> {
    const id = this.sectionIdCounter++;
    const section: Section = {
      ...insertSection,
      id
    };
    this.sections.set(id, section);
    return section;
  }

  async deleteSection(id: number): Promise<void> {
    // Delete associated flashcards
    const sectionFlashcards = await this.getFlashcardsBySectionId(id);
    
    for (const flashcard of sectionFlashcards) {
      await this.deleteFlashcard(flashcard.id);
    }
    
    // Delete the section
    this.sections.delete(id);
  }

  // Flashcard methods
  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async getFlashcardsBySectionId(sectionId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(
      (flashcard) => flashcard.sectionId === sectionId
    );
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.flashcardIdCounter++;
    const flashcard: Flashcard = {
      ...insertFlashcard,
      id
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async deleteFlashcard(id: number): Promise<void> {
    this.flashcards.delete(id);
  }

  // Study Session methods
  async getStudySession(userId: number, deckId: number): Promise<StudySession | undefined> {
    return Array.from(this.studySessions.values()).find(
      (session) => session.userId === userId && session.deckId === deckId
    );
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const session: StudySession = {
      ...insertSession,
      id,
      correctCount: 0,
      totalCount: 0,
      lastStudied: now
    };
    this.studySessions.set(id, session);
    return session;
  }

  async updateStudySession(session: StudySession): Promise<StudySession> {
    const updatedSession = {
      ...session,
      lastStudied: new Date()
    };
    this.studySessions.set(session.id, updatedSession);
    return updatedSession;
  }

  async deleteStudySession(id: number): Promise<void> {
    this.studySessions.delete(id);
  }
  
  // Study Analytics methods
  async createStudyRecord(insertRecord: InsertStudyRecord): Promise<StudyRecord> {
    const id = this.recordIdCounter++;
    const now = new Date();
    
    const record: StudyRecord = {
      ...insertRecord,
      id,
      responseTimeMs: insertRecord.responseTimeMs ?? null,
      streak: 0, // This will be calculated and updated by the server
      sessionDate: now
    };
    
    this.studyRecords.set(id, record);
    return record;
  }
  
  async getStudyRecordsByUser(userId: number): Promise<StudyRecord[]> {
    return Array.from(this.studyRecords.values()).filter(
      record => record.userId === userId
    );
  }
  
  async getStudyRecordsByDeck(deckId: number): Promise<StudyRecord[]> {
    return Array.from(this.studyRecords.values()).filter(
      record => record.deckId === deckId
    );
  }
  
  async getStudyRecordsByUserAndDeck(userId: number, deckId: number): Promise<StudyRecord[]> {
    return Array.from(this.studyRecords.values()).filter(
      record => record.userId === userId && record.deckId === deckId
    );
  }
  
  async getStudyRecordsByFlashcard(flashcardId: number): Promise<StudyRecord[]> {
    return Array.from(this.studyRecords.values()).filter(
      record => record.flashcardId === flashcardId
    );
  }
}

// Initialize storage - try to use Firestore first, falling back to MemStorage if there are permission issues
let storageInstance: IStorage;

try {
  const firestoreStorage = new FirestoreStorage();
  console.log("Using FirestoreStorage for data persistence");
  storageInstance = firestoreStorage;
} catch (error) {
  console.error("Failed to initialize Firestore storage:", error);
  console.log("Falling back to MemStorage for data persistence");
  storageInstance = new MemStorage();
}

export const storage = storageInstance;