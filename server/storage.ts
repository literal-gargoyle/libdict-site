import { users, type User, type InsertUser, libraries, type Library, type InsertLibrary, sharedLibraries, type SharedLibrary, type InsertSharedLibrary, studyProgress, type StudyProgress, type InsertStudyProgress, type LibDict } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// CRUD interface for all operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Library operations
  getLibrary(id: number): Promise<Library | undefined>;
  getLibrariesByUserId(userId: number): Promise<Library[]>;
  createLibrary(library: InsertLibrary): Promise<Library>;
  updateLibrary(id: number, updates: Partial<Library>): Promise<Library | undefined>;
  deleteLibrary(id: number): Promise<boolean>;
  
  // Shared library operations
  shareLibrary(sharedLibrary: InsertSharedLibrary): Promise<SharedLibrary>;
  getSharedLibraries(userId: number): Promise<Library[]>;
  unshareLibrary(libraryId: number, userId: number): Promise<boolean>;
  
  // Study progress operations
  getStudyProgress(userId: number, libraryId: number): Promise<StudyProgress | undefined>;
  updateStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress>;
  
  // Session storage
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private libraries: Map<number, Library>;
  private sharedLibraries: Map<number, SharedLibrary>;
  private studyProgress: Map<string, StudyProgress>;
  sessionStore: session.SessionStore;
  
  private currentUserId: number;
  private currentLibraryId: number;
  private currentSharedLibraryId: number;
  private currentStudyProgressId: number;

  constructor() {
    this.users = new Map();
    this.libraries = new Map();
    this.sharedLibraries = new Map();
    this.studyProgress = new Map();
    
    this.currentUserId = 1;
    this.currentLibraryId = 1;
    this.currentSharedLibraryId = 1;
    this.currentStudyProgressId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Library methods
  async getLibrary(id: number): Promise<Library | undefined> {
    return this.libraries.get(id);
  }

  async getLibrariesByUserId(userId: number): Promise<Library[]> {
    return Array.from(this.libraries.values()).filter(
      (library) => library.userId === userId
    );
  }

  async createLibrary(insertLibrary: InsertLibrary): Promise<Library> {
    const id = this.currentLibraryId++;
    const now = new Date();
    const library: Library = { 
      ...insertLibrary, 
      id, 
      createdAt: now,
      lastStudiedAt: null
    };
    this.libraries.set(id, library);
    return library;
  }

  async updateLibrary(id: number, updates: Partial<Library>): Promise<Library | undefined> {
    const library = this.libraries.get(id);
    if (!library) return undefined;
    
    const updatedLibrary = { ...library, ...updates };
    this.libraries.set(id, updatedLibrary);
    return updatedLibrary;
  }

  async deleteLibrary(id: number): Promise<boolean> {
    return this.libraries.delete(id);
  }

  // Shared library methods
  async shareLibrary(insertSharedLibrary: InsertSharedLibrary): Promise<SharedLibrary> {
    const id = this.currentSharedLibraryId++;
    const now = new Date();
    const sharedLibrary: SharedLibrary = {
      ...insertSharedLibrary,
      id,
      createdAt: now
    };
    this.sharedLibraries.set(id, sharedLibrary);
    return sharedLibrary;
  }

  async getSharedLibraries(userId: number): Promise<Library[]> {
    const sharedWithUser = Array.from(this.sharedLibraries.values())
      .filter((shared) => shared.sharedWithUserId === userId)
      .map((shared) => shared.libraryId);

    return Array.from(this.libraries.values())
      .filter((library) => sharedWithUser.includes(library.id));
  }

  async unshareLibrary(libraryId: number, userId: number): Promise<boolean> {
    const sharedLibrariesToRemove = Array.from(this.sharedLibraries.values())
      .filter(shared => shared.libraryId === libraryId && shared.sharedWithUserId === userId);
      
    if (sharedLibrariesToRemove.length === 0) return false;
    
    for (const shared of sharedLibrariesToRemove) {
      this.sharedLibraries.delete(shared.id);
    }
    
    return true;
  }

  // Study progress methods
  async getStudyProgress(userId: number, libraryId: number): Promise<StudyProgress | undefined> {
    const key = `${userId}-${libraryId}`;
    return this.studyProgress.get(key);
  }

  async updateStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress> {
    const key = `${progress.userId}-${progress.libraryId}`;
    const existingProgress = this.studyProgress.get(key);
    
    const now = new Date();
    let newProgress: StudyProgress;
    
    if (existingProgress) {
      newProgress = {
        ...existingProgress,
        mastered: progress.mastered,
        lastStudiedAt: now
      };
    } else {
      const id = this.currentStudyProgressId++;
      newProgress = {
        id,
        ...progress,
        lastStudiedAt: now
      };
    }
    
    this.studyProgress.set(key, newProgress);
    
    // Also update the lastStudiedAt in the library
    const library = this.libraries.get(progress.libraryId);
    if (library) {
      this.libraries.set(progress.libraryId, {
        ...library,
        lastStudiedAt: now
      });
    }
    
    return newProgress;
  }
}

export const storage = new MemStorage();
