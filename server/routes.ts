import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertLibrarySchema, insertSharedLibrarySchema, insertStudyProgressSchema, libdictSchema } from "@shared/schema";
import { PdfConverter } from "./pdf-converter";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // User is authenticated middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Library Routes

  // Get all libraries for current user
  app.get("/api/libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const libraries = await storage.getLibrariesByUserId(userId);
      res.json(libraries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });

  // Get a specific library
  app.get("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const library = await storage.getLibrary(libraryId);
      
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      // Check if user owns this library or it's shared with them
      const userId = req.user!.id;
      if (library.userId !== userId) {
        const sharedLibraries = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries.some(shared => shared.id === libraryId);
        
        if (!isShared) {
          return res.status(403).json({ message: "You don't have access to this library" });
        }
      }
      
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch library" });
    }
  });

  // Create a new library
  app.post("/api/libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const libraryData = insertLibrarySchema.parse({
        ...req.body,
        userId
      });
      
      const library = await storage.createLibrary(libraryData);
      res.status(201).json(library);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create library" });
    }
  });

  // Update a library
  app.patch("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if library exists and belongs to user
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      if (library.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this library" });
      }
      
      const updatedLibrary = await storage.updateLibrary(libraryId, req.body);
      res.json(updatedLibrary);
    } catch (error) {
      res.status(500).json({ message: "Failed to update library" });
    }
  });

  // Delete a library
  app.delete("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if library exists and belongs to user
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      if (library.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this library" });
      }
      
      await storage.deleteLibrary(libraryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete library" });
    }
  });

  // Shared Library Routes

  // Get all libraries shared with the current user
  app.get("/api/shared-libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const sharedLibraries = await storage.getSharedLibraries(userId);
      res.json(sharedLibraries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared libraries" });
    }
  });

  // Share a library with another user
  app.post("/api/shared-libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { libraryId, sharedWithUserId } = insertSharedLibrarySchema.parse(req.body);
      
      // Check if library exists and belongs to user
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      if (library.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to share this library" });
      }
      
      // Check if the user being shared with exists
      const sharedWithUser = await storage.getUser(sharedWithUserId);
      if (!sharedWithUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create the shared library
      const sharedLibrary = await storage.shareLibrary({
        libraryId,
        sharedWithUserId
      });
      
      // Update the library to mark it as shared
      await storage.updateLibrary(libraryId, { shared: true });
      
      res.status(201).json(sharedLibrary);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to share library" });
    }
  });

  // Unshare a library
  app.delete("/api/shared-libraries/:libraryId/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      const libraryId = parseInt(req.params.libraryId);
      const sharedWithUserId = parseInt(req.params.userId);
      
      // Check if library exists and belongs to user
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      if (library.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to unshare this library" });
      }
      
      const result = await storage.unshareLibrary(libraryId, sharedWithUserId);
      if (!result) {
        return res.status(404).json({ message: "Shared library not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to unshare library" });
    }
  });

  // Study Progress Routes

  // Get study progress for a library
  app.get("/api/study-progress/:libraryId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const libraryId = parseInt(req.params.libraryId);
      
      // Check if library exists and user has access
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      // Check if user owns this library or it's shared with them
      if (library.userId !== userId) {
        const sharedLibraries = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries.some(shared => shared.id === libraryId);
        
        if (!isShared) {
          return res.status(403).json({ message: "You don't have access to this library" });
        }
      }
      
      const progress = await storage.getStudyProgress(userId, libraryId);
      res.json(progress || { userId, libraryId, mastered: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study progress" });
    }
  });

  // Update study progress for a library
  app.post("/api/study-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const progressData = insertStudyProgressSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if library exists and user has access
      const libraryId = progressData.libraryId;
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      
      // Check if user owns this library or it's shared with them
      if (library.userId !== userId) {
        const sharedLibraries = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries.some(shared => shared.id === libraryId);
        
        if (!isShared) {
          return res.status(403).json({ message: "You don't have access to this library" });
        }
      }
      
      const progress = await storage.updateStudyProgress(progressData);
      res.json(progress);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update study progress" });
    }
  });

  // PDF to LibDict conversion route
  app.post(
    "/api/convert-pdf",
    isAuthenticated,
    upload.single("pdfFile"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No PDF file provided" });
        }
        
        // Validate file is a PDF
        if (!PdfConverter.isValidPdf(req.file.buffer)) {
          return res.status(400).json({ message: "Invalid PDF file" });
        }
        
        // Extract conversion options from the request
        const { title, sectionIdentifier, termDefinitionSeparator } = req.body;
        
        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }
        
        // Convert PDF to LibDict
        const libdict = await PdfConverter.convertToLibDict(
          req.file.buffer,
          title,
          {
            sectionIdentifier: sectionIdentifier || "headings",
            termDefinitionSeparator: termDefinitionSeparator || "colon"
          }
        );
        
        // Validate the libdict structure
        const parsedLibdict = libdictSchema.parse(libdict);
        
        // Create a new library with the converted content
        const userId = req.user!.id;
        const library = await storage.createLibrary({
          title,
          userId,
          content: parsedLibdict,
          shared: false
        });
        
        res.status(201).json(library);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        console.error("PDF conversion error:", error);
        res.status(500).json({ message: "Failed to convert PDF to LibDict" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
