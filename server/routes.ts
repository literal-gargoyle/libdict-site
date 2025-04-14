import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parsePdfToLibdict } from "./pdf-parser";
import { createShareId } from "./utils";
import multer from "multer";
import fs from "fs";
import path from "path";
import { insertUserSchema, insertDeckSchema, LibDictFile, Flashcard, StudyRecord, User } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

// Create uploads directory
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByFirebaseUid(userData.firebaseUid);
      
      if (existingUser) {
        try {
          // Update existing user
          const updatedUser = await storage.updateUser({
            ...existingUser,
            ...userData
          });
          return res.status(200).json(updatedUser);
        } catch (updateError: any) {
          if (updateError.code === 'permission-denied') {
            console.warn(`Permission denied updating user in Firestore. Using fallback memory storage for testing.`);
            
            // Create a mock user response
            const mockUser: User = {
              id: 1,
              username: userData.username || `user_${userData.firebaseUid.substring(0, 5)}`,
              email: userData.email,
              firebaseUid: userData.firebaseUid,
              displayName: userData.displayName || "Test User",
              photoURL: userData.photoURL || null,
              level: 1,
              experience: 0,
              decksShared: 0,
              createdAt: new Date()
            };
            
            return res.status(200).json(mockUser);
          } else {
            throw updateError;
          }
        }
      }
      
      try {
        // Create new user
        const newUser = await storage.createUser(userData);
        return res.status(201).json(newUser);
      } catch (createError: any) {
        if (createError.code === 'permission-denied') {
          console.warn(`Permission denied creating user in Firestore. Using fallback memory storage for testing.`);
          
          // Create a mock user response
          const mockUser: User = {
            id: 1,
            username: userData.username || `user_${userData.firebaseUid.substring(0, 5)}`,
            email: userData.email,
            firebaseUid: userData.firebaseUid,
            displayName: userData.displayName || "Test User",
            photoURL: userData.photoURL || null,
            level: 1,
            experience: 0,
            decksShared: 0,
            createdAt: new Date()
          };
          
          return res.status(201).json(mockUser);
        } else {
          throw createError;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error in user auth endpoint:", error);
      return res.status(500).json({ message: "Failed to create/update user" });
    }
  });
  
  // Deck routes
  app.get("/api/decks", async (req, res) => {
    try {
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Since we're using in-memory storage, we need to handle the case where 
      // we don't find a user, by creating a new temporary user for testing
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        console.log("Creating a temporary user for testing in GET /api/decks");
        user = await storage.createUser({
          firebaseUid,
          username: `user_${firebaseUid.substring(0, 5)}`,
          displayName: "Test User",
          email: "test@example.com",
          photoURL: null
        });
      }
      
      // Get all decks with card counts and study sessions
      const decks = await storage.getDecksWithData(user.id);
      return res.status(200).json(decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      return res.status(500).json({ message: "Failed to fetch decks" });
    }
  });
  
  app.post("/api/decks", upload.single("file"), async (req, res) => {
    try {
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Since we're using in-memory storage, we need to handle the case where 
      // we don't find a user, by creating a new temporary user for testing
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        console.log("Creating a temporary user for testing deck creation");
        user = await storage.createUser({
          firebaseUid,
          username: `user_${firebaseUid.substring(0, 5)}`,
          displayName: "Test User",
          email: "test@example.com",
          photoURL: null
        });
      }
      
      const { title, description, method } = req.body;
      
      // Validate deck data
      const deckData = insertDeckSchema.parse({
        title,
        description,
        userId: user.id,
        isPublic: false
      });
      
      // Create the deck
      const deck = await storage.createDeck(deckData);
      
      if (method === "pdf-upload" && req.file) {
        try {
          // Parse PDF and create flashcards
          const filePath = req.file.path;
          const libdictData = await parsePdfToLibdict(filePath, title);
          
          // Create sections and flashcards
          for (const [sectionName, flashcards] of Object.entries(libdictData.sections)) {
            const section = await storage.createSection({
              name: sectionName,
              deckId: deck.id
            });
            
            // Add flashcards to the section
            for (const card of flashcards) {
              await storage.createFlashcard({
                term: card.term,
                definition: card.definition,
                sectionId: section.id
              });
            }
          }
          
          // Clean up temp file
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error("Error processing PDF file:", error);
          // Still return the deck even if PDF processing fails
          return res.status(201).json({
            ...deck, 
            processingError: "Failed to process PDF. The deck was created, but you may need to add flashcards manually."
          });
        }
      } else if (method === "import-json" && req.file) {
        try {
          // Import from .libdict file
          const filePath = req.file.path;
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const libdictData = JSON.parse(fileContent) as LibDictFile;
          
          // Create sections and flashcards
          for (const [sectionName, flashcards] of Object.entries(libdictData.sections)) {
            const section = await storage.createSection({
              name: sectionName,
              deckId: deck.id
            });
            
            // Add flashcards to the section
            for (const card of flashcards) {
              await storage.createFlashcard({
                term: card.term,
                definition: card.definition,
                sectionId: section.id
              });
            }
          }
          
          // Clean up temp file
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error("Error processing .libdict file:", error);
          // Still return the deck even if processing fails
          return res.status(201).json({
            ...deck, 
            processingError: "Failed to process .libdict file. The deck was created, but you may need to add flashcards manually."
          });
        }
      } else if (method === "manual-entry") {
        // For manual-entry, create a default section
        await storage.createSection({
          name: "Default Section",
          deckId: deck.id
        });
      }
      
      return res.status(201).json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating deck:", error);
      return res.status(500).json({ message: "Failed to create deck" });
    }
  });
  
  app.get("/api/decks/:id/study", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get deck data
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Verify ownership
      if (deck.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to study this deck" });
      }
      
      // Get sections, flashcards, and study progress
      const sections = await storage.getSectionsByDeckId(deckId);
      const flashcards: Record<number, any[]> = {};
      
      for (const section of sections) {
        flashcards[section.id] = await storage.getFlashcardsBySectionId(section.id);
      }
      
      // Get or create study session
      let studySession = await storage.getStudySession(user.id, deckId);
      
      if (!studySession) {
        studySession = await storage.createStudySession({
          userId: user.id,
          deckId: deckId
        });
      }
      
      const totalCards = Object.values(flashcards).flat().length;
      
      return res.status(200).json({
        deck,
        sections,
        flashcards,
        progress: {
          correct: studySession.correctCount,
          total: totalCards
        }
      });
    } catch (error) {
      console.error("Error fetching study data:", error);
      return res.status(500).json({ message: "Failed to fetch study data" });
    }
  });
  
  app.post("/api/decks/:id/progress", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const { correct, flashcardId, responseTimeMs } = req.body;
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get study session
      let studySession = await storage.getStudySession(user.id, deckId);
      
      if (!studySession) {
        studySession = await storage.createStudySession({
          userId: user.id,
          deckId: deckId
        });
      }
      
      // Update session progress
      await storage.updateStudySession({
        ...studySession,
        correctCount: correct ? studySession.correctCount + 1 : studySession.correctCount,
        totalCount: studySession.totalCount + 1,
        lastStudied: new Date()
      });
      
      // Create study record for analytics
      if (flashcardId) {
        // Get previous records for this flashcard to calculate streak
        const previousRecords = await storage.getStudyRecordsByFlashcard(flashcardId);
        const userRecords = previousRecords.filter(record => record.userId === user.id);
        
        // Sort by date (newest first) and get the most recent record
        userRecords.sort((a, b) => 
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
        );
        
        // Calculate streak
        let streak = 0;
        if (userRecords.length > 0) {
          const latestRecord = userRecords[0];
          // If the new result matches the previous one, increment the streak
          // Otherwise reset it
          if (latestRecord.isCorrect === correct) {
            streak = latestRecord.streak + 1;
          } else {
            streak = 1; // New streak starts
          }
        } else {
          streak = 1; // First attempt
        }
        
        // Create the study record
        await storage.createStudyRecord({
          userId: user.id,
          deckId: deckId,
          flashcardId: flashcardId,
          isCorrect: correct,
          responseTimeMs: responseTimeMs ? responseTimeMs : null,
        });
      }
      
      return res.status(200).json({ message: "Progress updated" });
    } catch (error) {
      console.error("Error updating progress:", error);
      return res.status(500).json({ message: "Failed to update progress" });
    }
  });
  
  app.delete("/api/decks/:id", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get deck
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Verify ownership
      if (deck.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this deck" });
      }
      
      // Delete deck (this should cascade delete sections, flashcards, and study sessions)
      await storage.deleteDeck(deckId);
      
      return res.status(200).json({ message: "Deck deleted" });
    } catch (error) {
      console.error("Error deleting deck:", error);
      return res.status(500).json({ message: "Failed to delete deck" });
    }
  });
  
  app.post("/api/decks/:id/share", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get deck
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Verify ownership
      if (deck.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to share this deck" });
      }
      
      // Generate share ID if not present
      if (!deck.shareId) {
        const shareId = createShareId();
        await storage.updateDeck({
          ...deck,
          isPublic: true,
          shareId
        });
        
        // Award experience and update user level/shares
        const EXP_PER_SHARE = 50;
        const EXP_PER_LEVEL = 100;
        
        // Calculate new experience and level
        let newExp = user.experience + EXP_PER_SHARE;
        let newLevel = user.level;
        let newDecksShared = user.decksShared + 1;
        
        // Check if user should level up
        while (newExp >= (user.level * EXP_PER_LEVEL)) {
          newExp -= (user.level * EXP_PER_LEVEL);
          newLevel++;
        }
        
        // Update user with new level and experience
        await storage.updateUser({
          ...user,
          experience: newExp,
          level: newLevel,
          decksShared: newDecksShared
        });
        
        return res.status(200).json({ 
          shareId,
          leveledUp: newLevel > user.level,
          newLevel,
          newExperience: newExp
        });
      }
      
      return res.status(200).json({ shareId: deck.shareId });
    } catch (error) {
      console.error("Error sharing deck:", error);
      return res.status(500).json({ message: "Failed to share deck" });
    }
  });
  
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      
      // Get deck by share ID
      const deck = await storage.getDeckByShareId(shareId);
      if (!deck || !deck.isPublic) {
        return res.status(404).json({ message: "Shared deck not found" });
      }
      
      // Get user (owner)
      const owner = await storage.getUser(deck.userId);
      if (!owner) {
        return res.status(404).json({ message: "Deck owner not found" });
      }
      
      // Get sections and flashcards
      const sections = await storage.getSectionsByDeckId(deck.id);
      const flashcards: Record<number, any[]> = {};
      
      for (const section of sections) {
        flashcards[section.id] = await storage.getFlashcardsBySectionId(section.id);
      }
      
      return res.status(200).json({
        deck,
        sections,
        flashcards,
        owner: {
          username: owner.username,
          displayName: owner.displayName
        }
      });
    } catch (error) {
      console.error("Error fetching shared deck:", error);
      return res.status(500).json({ message: "Failed to fetch shared deck" });
    }
  });

  // Publish deck to community
  app.post("/api/decks/:id/publish", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Ensure user has level and experience set (fix for undefined values)
      const currentUser = {
        ...user,
        level: user.level || 1,
        experience: user.experience || 0,
        decksShared: user.decksShared || 0
      };
      
      // Get deck
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Verify ownership
      if (deck.userId !== currentUser.id) {
        return res.status(403).json({ message: "You don't have permission to publish this deck" });
      }
      
      // Generate share ID if not present and set isPublic to true
      const shareId = deck.shareId || createShareId();
      await storage.updateDeck({
        ...deck,
        isPublic: true,
        shareId
      });
      
      // Only award experience if the deck was not previously shared (no existing shareId)
      if (!deck.shareId) {
        // Award experience and update user level/shares
        const EXP_PER_SHARE = 50;
        const EXP_PER_LEVEL = 100;
        
        // Calculate new experience and level
        let newExp = currentUser.experience + EXP_PER_SHARE;
        let newLevel = currentUser.level;
        let newDecksShared = currentUser.decksShared + 1;
        
        // Check if user should level up
        while (newExp >= (newLevel * EXP_PER_LEVEL)) {
          newExp -= (newLevel * EXP_PER_LEVEL);
          newLevel++;
        }
        
        // Update user with new level and experience
        await storage.updateUser({
          ...currentUser,
          experience: newExp,
          level: newLevel,
          decksShared: newDecksShared
        });
        
        return res.status(200).json({ 
          message: "Deck published successfully", 
          shareId,
          leveledUp: newLevel > currentUser.level,
          newLevel,
          newExperience: newExp
        });
      }
      
      return res.status(200).json({ message: "Deck published successfully", shareId });
    } catch (error) {
      console.error("Error publishing deck:", error);
      return res.status(500).json({ message: "Failed to publish deck" });
    }
  });

  // Analytics endpoint - Get study performance data
  app.get("/api/analytics/deck/:id", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Extract user from Firebase auth ID
      const firebaseUid = req.query.firebaseUid as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get deck
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Verify ownership
      if (deck.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view analytics for this deck" });
      }
      
      // Get study records for this deck and user
      const studyRecords = await storage.getStudyRecordsByUserAndDeck(user.id, deckId);
      
      // Get sections and flashcards
      const sections = await storage.getSectionsByDeckId(deckId);
      const flashcards: Record<number, any> = {};
      let totalCards = 0;
      
      for (const section of sections) {
        const cards = await storage.getFlashcardsBySectionId(section.id);
        flashcards[section.id] = cards;
        totalCards += cards.length;
      }
      
      // Calculate analytics data
      const analytics = {
        overview: {
          totalCards,
          totalStudied: studyRecords.length,
          correctAnswers: studyRecords.filter(r => r.isCorrect).length,
          incorrectAnswers: studyRecords.filter(r => !r.isCorrect).length,
          averageResponseTime: calculateAverageResponseTime(studyRecords),
          masteryRate: calculateMasteryRate(studyRecords),
        },
        trends: calculateTrends(studyRecords),
        masteryBySection: calculateMasteryBySection(studyRecords, flashcards),
        difficultCards: identifyDifficultCards(studyRecords, flashcards)
      };
      
      return res.status(200).json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Community decks endpoint
  app.get("/api/community-decks", async (req, res) => {
    try {
      // Get all public decks
      const allDecks = await storage.getAllPublicDecks();
      
      // Enhance deck data with additional information
      const enhancedDecks = await Promise.all(
        allDecks.map(async (deck) => {
          // Get owner info
          const owner = await storage.getUser(deck.userId);
          
          // Get sections count
          const sections = await storage.getSectionsByDeckId(deck.id);
          
          // Get total flashcard count
          let totalCards = 0;
          for (const section of sections) {
            const cards = await storage.getFlashcardsBySectionId(section.id);
            totalCards += cards.length;
          }
          
          return {
            ...deck,
            owner: {
              username: owner?.username,
              displayName: owner?.displayName
            },
            sectionCount: sections.length,
            cardCount: totalCards
          };
        })
      );
      
      return res.status(200).json(enhancedDecks);
    } catch (error) {
      console.error("Error fetching community decks:", error);
      return res.status(500).json({ message: "Failed to fetch community decks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Analytics helper functions
function calculateAverageResponseTime(records: StudyRecord[]): number {
  if (records.length === 0 || !records.some(r => r.responseTimeMs !== null)) {
    return 0;
  }
  
  const recordsWithTime = records.filter(r => r.responseTimeMs !== null) as Array<StudyRecord & { responseTimeMs: number }>;
  const total = recordsWithTime.reduce((sum, record) => sum + record.responseTimeMs, 0);
  return Math.round(total / recordsWithTime.length);
}

function calculateMasteryRate(records: StudyRecord[]): number {
  if (records.length === 0) {
    return 0;
  }
  
  const correctCount = records.filter(r => r.isCorrect).length;
  return Math.round((correctCount / records.length) * 100);
}

interface TrendPoint {
  date: string;
  correctRate: number;
  responseTime: number;
}

function calculateTrends(records: StudyRecord[]): TrendPoint[] {
  if (records.length === 0) {
    return [];
  }
  
  // Group records by date
  const recordsByDate = new Map<string, StudyRecord[]>();
  
  records.forEach(record => {
    const dateStr = new Date(record.sessionDate).toISOString().split('T')[0];
    if (!recordsByDate.has(dateStr)) {
      recordsByDate.set(dateStr, []);
    }
    recordsByDate.get(dateStr)!.push(record);
  });
  
  // Calculate trends for each date
  const trends: TrendPoint[] = [];
  
  Array.from(recordsByDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([date, dayRecords]) => {
      const correctRate = calculateMasteryRate(dayRecords);
      const avgResponseTime = calculateAverageResponseTime(dayRecords);
      
      trends.push({
        date,
        correctRate,
        responseTime: avgResponseTime
      });
    });
  
  return trends;
}

interface SectionMastery {
  sectionId: number;
  sectionName: string;
  masteryRate: number;
  cardCount: number;
}

function calculateMasteryBySection(
  records: StudyRecord[], 
  flashcardsBySection: Record<number, Flashcard[]>
): SectionMastery[] {
  const result: SectionMastery[] = [];
  
  // Group flashcards by section and calculate mastery for each
  for (const [sectionIdStr, flashcards] of Object.entries(flashcardsBySection)) {
    const sectionId = parseInt(sectionIdStr);
    
    // Skip empty sections
    if (flashcards.length === 0) continue;
    
    // Get all records for flashcards in this section
    const sectionRecords = records.filter(record => 
      flashcards.some(card => card.id === record.flashcardId)
    );
    
    result.push({
      sectionId,
      sectionName: flashcards[0]?.term ? flashcards[0].term.substring(0, 20) + "..." : `Section ${sectionId}`,
      masteryRate: calculateMasteryRate(sectionRecords),
      cardCount: flashcards.length
    });
  }
  
  return result;
}

interface DifficultCard {
  flashcardId: number;
  term: string;
  definition: string;
  correctRate: number;
  averageResponseTime: number;
  attemptCount: number;
}

function identifyDifficultCards(
  records: StudyRecord[],
  flashcardsBySection: Record<number, Flashcard[]>
): DifficultCard[] {
  // Flatten flashcards array
  const allFlashcards = Object.values(flashcardsBySection).flat();
  
  // Group records by flashcard ID
  const recordsByCard = new Map<number, StudyRecord[]>();
  
  records.forEach(record => {
    if (!recordsByCard.has(record.flashcardId)) {
      recordsByCard.set(record.flashcardId, []);
    }
    recordsByCard.get(record.flashcardId)!.push(record);
  });
  
  // Calculate difficulty metrics for each card
  const cardMetrics: DifficultCard[] = [];
  
  recordsByCard.forEach((cardRecords, flashcardId) => {
    const flashcard = allFlashcards.find(card => card.id === flashcardId);
    if (!flashcard) return;
    
    const correctRate = calculateMasteryRate(cardRecords);
    const avgResponseTime = calculateAverageResponseTime(cardRecords);
    
    cardMetrics.push({
      flashcardId,
      term: flashcard.term,
      definition: flashcard.definition,
      correctRate,
      averageResponseTime: avgResponseTime,
      attemptCount: cardRecords.length
    });
  });
  
  // Sort by correctRate (ascending) and then by attemptCount (descending)
  return cardMetrics
    .sort((a, b) => {
      if (a.correctRate !== b.correctRate) {
        return a.correctRate - b.correctRate; // Low correctRate first
      }
      return b.attemptCount - a.attemptCount; // High attempt count first
    })
    .slice(0, 10); // Return top 10 most difficult cards
}
