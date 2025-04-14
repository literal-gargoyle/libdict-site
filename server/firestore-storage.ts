import { 
  users, decks, sections, flashcards, studySessions, studyRecords,
  type User, type Deck, type Section, type Flashcard, type StudySession, type StudyRecord,
  type InsertUser, type InsertDeck, type InsertSection, type InsertFlashcard, type InsertStudySession,
  type InsertStudyRecord
} from "@shared/schema";
import { initializeApp, getApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, where, Firestore
} from "firebase/firestore";
import { IStorage } from "./storage";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
};

export class FirestoreStorage implements IStorage {
  private db: Firestore;
  private userIdCounter: number;
  private deckIdCounter: number;
  private sectionIdCounter: number;
  private flashcardIdCounter: number;
  private sessionIdCounter: number;
  
  private recordIdCounter: number;
  
  constructor() {
    try {
      // Initialize Firebase and Firestore
      let app;
      try {
        app = initializeApp(firebaseConfig);
        console.log("Firebase initialized for server storage");
      } catch (initError: any) {
        if (initError.code !== 'app/duplicate-app') {
          console.error("Error initializing Firebase:", initError);
          throw initError;
        }
        // If we get here, the app already exists, so we'll just continue
        console.log("Firebase app already initialized");
      }
      
      this.db = getFirestore();
      
      // Initialize counters
      this.userIdCounter = 1;
      this.deckIdCounter = 1;
      this.sectionIdCounter = 1;
      this.flashcardIdCounter = 1;
      this.sessionIdCounter = 1;
      this.recordIdCounter = 1;
      
      // Load counter values from Firestore
      this.initializeCounters();
    } catch (error) {
      console.error("Error in FirestoreStorage constructor:", error);
      throw error;
    }
  }
  
  private async initializeCounters() {
    try {
      // Check for existing counters document
      const counterDoc = await getDoc(doc(this.db, "counters", "ids"));
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        this.userIdCounter = data.userIdCounter || 1;
        this.deckIdCounter = data.deckIdCounter || 1;
        this.sectionIdCounter = data.sectionIdCounter || 1;
        this.flashcardIdCounter = data.flashcardIdCounter || 1;
        this.sessionIdCounter = data.sessionIdCounter || 1;
        this.recordIdCounter = data.recordIdCounter || 1;
      } else {
        // Create counters document if it doesn't exist
        await setDoc(doc(this.db, "counters", "ids"), {
          userIdCounter: 1,
          deckIdCounter: 1,
          sectionIdCounter: 1,
          flashcardIdCounter: 1,
          sessionIdCounter: 1,
          recordIdCounter: 1
        });
      }
    } catch (error: any) {
      // Don't throw for permission errors, just use default counters
      console.error("Error initializing counters:", error);
      if (error.code === 'permission-denied') {
        console.warn("Permission denied accessing Firestore. Using default counter values.");
        // Use default counter values
        this.userIdCounter = 1;
        this.deckIdCounter = 1;
        this.sectionIdCounter = 1;
        this.flashcardIdCounter = 1;
        this.sessionIdCounter = 1;
        this.recordIdCounter = 1;
      } else {
        // For other errors, throw to be caught by the constructor
        throw error;
      }
    }
  }
  
  private async updateCounters() {
    try {
      await setDoc(doc(this.db, "counters", "ids"), {
        userIdCounter: this.userIdCounter,
        deckIdCounter: this.deckIdCounter,
        sectionIdCounter: this.sectionIdCounter,
        flashcardIdCounter: this.flashcardIdCounter,
        sessionIdCounter: this.sessionIdCounter,
        recordIdCounter: this.recordIdCounter
      });
    } catch (error) {
      console.error("Error updating counters:", error);
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(this.db, "users", id.toString()));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const q = query(collection(this.db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const q = query(collection(this.db, "users"), where("firebaseUid", "==", firebaseUid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as User;
      }
      return undefined;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn(`Permission denied accessing Firestore collection "users". This is expected if you haven't set up Firestore security rules yet.`);
        // Return undefined instead of throwing to allow graceful fallback
        return undefined;
      } else {
        console.error("Error getting user by firebase UID:", error);
        throw error;
      }
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = this.userIdCounter++;
      const user: User = { 
        ...insertUser, 
        id,
        displayName: insertUser.displayName || null,
        photoURL: insertUser.photoURL || null,
        level: 1,
        experience: 0,
        decksShared: 0,
        createdAt: new Date()
      };
      
      await setDoc(doc(this.db, "users", id.toString()), user);
      await this.updateCounters();
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(user: User): Promise<User> {
    try {
      await updateDoc(doc(this.db, "users", user.id.toString()), user);
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async getDeck(id: number): Promise<Deck | undefined> {
    try {
      const deckDoc = await getDoc(doc(this.db, "decks", id.toString()));
      if (deckDoc.exists()) {
        // Convert Firestore timestamps to JS Dates
        const data = deckDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as Deck;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting deck:", error);
      throw error;
    }
  }
  
  async getDeckByShareId(shareId: string): Promise<Deck | undefined> {
    try {
      const q = query(collection(this.db, "decks"), where("shareId", "==", shareId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Convert Firestore timestamps to JS Dates
        const data = querySnapshot.docs[0].data();
        return {
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as Deck;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting deck by share ID:", error);
      throw error;
    }
  }
  
  async getDecksWithData(userId: number): Promise<any[]> {
    try {
      const q = query(collection(this.db, "decks"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const userDecks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as Deck;
      });
      
      // Get card counts and study sessions for each deck
      return Promise.all(
        userDecks.map(async deck => {
          const deckSections = await this.getSectionsByDeckId(deck.id);
          let cardCount = 0;
          
          for (const section of deckSections) {
            const sectionCards = await this.getFlashcardsBySectionId(section.id);
            cardCount += sectionCards.length;
          }
          
          const studySession = await this.getStudySession(userId, deck.id);
          
          return {
            ...deck,
            cardCount,
            studySession
          };
        })
      );
    } catch (error) {
      console.error("Error getting decks with data:", error);
      throw error;
    }
  }
  
  async getAllPublicDecks(): Promise<Deck[]> {
    try {
      const q = query(collection(this.db, "decks"), where("isPublic", "==", true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as Deck;
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn(`Permission denied accessing Firestore collection "decks". This is expected if you haven't set up Firestore security rules yet.`);
        // Return empty array instead of throwing to allow graceful fallback
        return [];
      } else {
        console.error("Error getting public decks:", error);
        throw error;
      }
    }
  }
  
  async createDeck(insertDeck: InsertDeck): Promise<Deck> {
    try {
      const id = this.deckIdCounter++;
      const now = new Date();
      
      const deck: Deck = {
        ...insertDeck,
        id,
        description: insertDeck.description || null,
        isPublic: insertDeck.isPublic || false,
        shareId: null,
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(this.db, "decks", id.toString()), deck);
      await this.updateCounters();
      
      return deck;
    } catch (error) {
      console.error("Error creating deck:", error);
      throw error;
    }
  }
  
  async updateDeck(deck: Deck): Promise<Deck> {
    try {
      const updatedDeck = {
        ...deck,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(this.db, "decks", deck.id.toString()), updatedDeck);
      return updatedDeck;
    } catch (error) {
      console.error("Error updating deck:", error);
      throw error;
    }
  }
  
  async deleteDeck(id: number): Promise<void> {
    try {
      // Delete all associated sections, flashcards, and study sessions
      const sections = await this.getSectionsByDeckId(id);
      
      for (const section of sections) {
        await this.deleteSection(section.id);
      }
      
      // Delete study sessions
      const q = query(
        collection(this.db, "studySessions"), 
        where("deckId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Delete the deck
      await deleteDoc(doc(this.db, "decks", id.toString()));
    } catch (error) {
      console.error("Error deleting deck:", error);
      throw error;
    }
  }
  
  async getSection(id: number): Promise<Section | undefined> {
    try {
      const sectionDoc = await getDoc(doc(this.db, "sections", id.toString()));
      if (sectionDoc.exists()) {
        return sectionDoc.data() as Section;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting section:", error);
      throw error;
    }
  }
  
  async getSectionsByDeckId(deckId: number): Promise<Section[]> {
    try {
      const q = query(collection(this.db, "sections"), where("deckId", "==", deckId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Section);
    } catch (error) {
      console.error("Error getting sections by deck ID:", error);
      throw error;
    }
  }
  
  async createSection(insertSection: InsertSection): Promise<Section> {
    try {
      const id = this.sectionIdCounter++;
      
      const section: Section = {
        ...insertSection,
        id
      };
      
      await setDoc(doc(this.db, "sections", id.toString()), section);
      await this.updateCounters();
      
      return section;
    } catch (error) {
      console.error("Error creating section:", error);
      throw error;
    }
  }
  
  async deleteSection(id: number): Promise<void> {
    try {
      // Delete all associated flashcards
      const q = query(
        collection(this.db, "flashcards"),
        where("sectionId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Delete the section
      await deleteDoc(doc(this.db, "sections", id.toString()));
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  }
  
  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    try {
      const flashcardDoc = await getDoc(doc(this.db, "flashcards", id.toString()));
      if (flashcardDoc.exists()) {
        return flashcardDoc.data() as Flashcard;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting flashcard:", error);
      throw error;
    }
  }
  
  async getFlashcardsBySectionId(sectionId: number): Promise<Flashcard[]> {
    try {
      const q = query(
        collection(this.db, "flashcards"),
        where("sectionId", "==", sectionId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as Flashcard);
    } catch (error) {
      console.error("Error getting flashcards by section ID:", error);
      throw error;
    }
  }
  
  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    try {
      const id = this.flashcardIdCounter++;
      
      const flashcard: Flashcard = {
        ...insertFlashcard,
        id
      };
      
      await setDoc(doc(this.db, "flashcards", id.toString()), flashcard);
      await this.updateCounters();
      
      return flashcard;
    } catch (error) {
      console.error("Error creating flashcard:", error);
      throw error;
    }
  }
  
  async deleteFlashcard(id: number): Promise<void> {
    try {
      await deleteDoc(doc(this.db, "flashcards", id.toString()));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      throw error;
    }
  }
  
  async getStudySession(userId: number, deckId: number): Promise<StudySession | undefined> {
    try {
      const q = query(
        collection(this.db, "studySessions"),
        where("userId", "==", userId),
        where("deckId", "==", deckId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Convert Firestore timestamps to JS Dates
        const data = querySnapshot.docs[0].data();
        return {
          ...data,
          lastStudied: data.lastStudied.toDate ? data.lastStudied.toDate() : data.lastStudied
        } as StudySession;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting study session:", error);
      throw error;
    }
  }
  
  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    try {
      const id = this.sessionIdCounter++;
      
      const session: StudySession = {
        ...insertSession,
        id,
        correctCount: 0,
        totalCount: 0,
        lastStudied: new Date()
      };
      
      await setDoc(doc(this.db, "studySessions", id.toString()), session);
      await this.updateCounters();
      
      return session;
    } catch (error) {
      console.error("Error creating study session:", error);
      throw error;
    }
  }
  
  async updateStudySession(session: StudySession): Promise<StudySession> {
    try {
      await updateDoc(doc(this.db, "studySessions", session.id.toString()), session);
      return session;
    } catch (error) {
      console.error("Error updating study session:", error);
      throw error;
    }
  }
  
  async deleteStudySession(id: number): Promise<void> {
    try {
      await deleteDoc(doc(this.db, "studySessions", id.toString()));
    } catch (error) {
      console.error("Error deleting study session:", error);
      throw error;
    }
  }

  // Study Analytics Methods
  async createStudyRecord(insertRecord: InsertStudyRecord): Promise<StudyRecord> {
    try {
      const id = this.recordIdCounter++;
      const now = new Date();
      
      const record: StudyRecord = {
        ...insertRecord,
        id,
        responseTimeMs: insertRecord.responseTimeMs || null,
        streak: 0,
        sessionDate: now
      };
      
      await setDoc(doc(this.db, "studyRecords", id.toString()), record);
      await this.updateCounters();
      
      return record;
    } catch (error) {
      console.error("Error creating study record:", error);
      throw error;
    }
  }
  
  async getStudyRecordsByUser(userId: number): Promise<StudyRecord[]> {
    try {
      const q = query(
        collection(this.db, "studyRecords"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          sessionDate: data.sessionDate.toDate ? data.sessionDate.toDate() : data.sessionDate
        } as StudyRecord;
      });
    } catch (error) {
      console.error("Error getting study records by user ID:", error);
      throw error;
    }
  }
  
  async getStudyRecordsByDeck(deckId: number): Promise<StudyRecord[]> {
    try {
      const q = query(
        collection(this.db, "studyRecords"),
        where("deckId", "==", deckId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          sessionDate: data.sessionDate.toDate ? data.sessionDate.toDate() : data.sessionDate
        } as StudyRecord;
      });
    } catch (error) {
      console.error("Error getting study records by deck ID:", error);
      throw error;
    }
  }
  
  async getStudyRecordsByUserAndDeck(userId: number, deckId: number): Promise<StudyRecord[]> {
    try {
      const q = query(
        collection(this.db, "studyRecords"),
        where("userId", "==", userId),
        where("deckId", "==", deckId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          sessionDate: data.sessionDate.toDate ? data.sessionDate.toDate() : data.sessionDate
        } as StudyRecord;
      });
    } catch (error) {
      console.error("Error getting study records by user and deck ID:", error);
      throw error;
    }
  }
  
  async getStudyRecordsByFlashcard(flashcardId: number): Promise<StudyRecord[]> {
    try {
      const q = query(
        collection(this.db, "studyRecords"),
        where("flashcardId", "==", flashcardId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          sessionDate: data.sessionDate.toDate ? data.sessionDate.toDate() : data.sessionDate
        } as StudyRecord;
      });
    } catch (error) {
      console.error("Error getting study records by flashcard ID:", error);
      throw error;
    }
  }
}