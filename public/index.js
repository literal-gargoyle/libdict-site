// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore = createMemoryStore(session);
var MemStorage = class {
  users;
  libraries;
  sharedLibraries;
  studyProgress;
  sessionStore;
  currentUserId;
  currentLibraryId;
  currentSharedLibraryId;
  currentStudyProgressId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.libraries = /* @__PURE__ */ new Map();
    this.sharedLibraries = /* @__PURE__ */ new Map();
    this.studyProgress = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentLibraryId = 1;
    this.currentSharedLibraryId = 1;
    this.currentStudyProgressId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const now = /* @__PURE__ */ new Date();
    const user = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  // Library methods
  async getLibrary(id) {
    return this.libraries.get(id);
  }
  async getLibrariesByUserId(userId) {
    return Array.from(this.libraries.values()).filter(
      (library) => library.userId === userId
    );
  }
  async createLibrary(insertLibrary) {
    const id = this.currentLibraryId++;
    const now = /* @__PURE__ */ new Date();
    const library = {
      ...insertLibrary,
      id,
      createdAt: now,
      lastStudiedAt: null
    };
    this.libraries.set(id, library);
    return library;
  }
  async updateLibrary(id, updates) {
    const library = this.libraries.get(id);
    if (!library) return void 0;
    const updatedLibrary = { ...library, ...updates };
    this.libraries.set(id, updatedLibrary);
    return updatedLibrary;
  }
  async deleteLibrary(id) {
    return this.libraries.delete(id);
  }
  // Shared library methods
  async shareLibrary(insertSharedLibrary) {
    const id = this.currentSharedLibraryId++;
    const now = /* @__PURE__ */ new Date();
    const sharedLibrary = {
      ...insertSharedLibrary,
      id,
      createdAt: now
    };
    this.sharedLibraries.set(id, sharedLibrary);
    return sharedLibrary;
  }
  async getSharedLibraries(userId) {
    const sharedWithUser = Array.from(this.sharedLibraries.values()).filter((shared) => shared.sharedWithUserId === userId).map((shared) => shared.libraryId);
    return Array.from(this.libraries.values()).filter((library) => sharedWithUser.includes(library.id));
  }
  async unshareLibrary(libraryId, userId) {
    const sharedLibrariesToRemove = Array.from(this.sharedLibraries.values()).filter((shared) => shared.libraryId === libraryId && shared.sharedWithUserId === userId);
    if (sharedLibrariesToRemove.length === 0) return false;
    for (const shared of sharedLibrariesToRemove) {
      this.sharedLibraries.delete(shared.id);
    }
    return true;
  }
  // Study progress methods
  async getStudyProgress(userId, libraryId) {
    const key = `${userId}-${libraryId}`;
    return this.studyProgress.get(key);
  }
  async updateStudyProgress(progress) {
    const key = `${progress.userId}-${progress.libraryId}`;
    const existingProgress = this.studyProgress.get(key);
    const now = /* @__PURE__ */ new Date();
    let newProgress;
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
    const library = this.libraries.get(progress.libraryId);
    if (library) {
      this.libraries.set(progress.libraryId, {
        ...library,
        lastStudiedAt: now
      });
    }
    return newProgress;
  }
};
var storage = new MemStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastStudiedAt: timestamp("last_studied_at"),
  shared: boolean("shared").default(false)
});
var insertLibrarySchema = createInsertSchema(libraries).pick({
  title: true,
  userId: true,
  content: true,
  shared: true
});
var sharedLibraries = pgTable("shared_libraries", {
  id: serial("id").primaryKey(),
  libraryId: integer("library_id").notNull(),
  sharedWithUserId: integer("shared_with_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertSharedLibrarySchema = createInsertSchema(sharedLibraries).pick({
  libraryId: true,
  sharedWithUserId: true
});
var studyProgress = pgTable("study_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  libraryId: integer("library_id").notNull(),
  mastered: jsonb("mastered").notNull(),
  lastStudiedAt: timestamp("last_studied_at").defaultNow().notNull()
});
var insertStudyProgressSchema = createInsertSchema(studyProgress).pick({
  userId: true,
  libraryId: true,
  mastered: true
});
var libdictSchema = z.object({
  format_version: z.string(),
  title: z.string(),
  sections: z.record(
    z.string(),
    z.array(
      z.object({
        term: z.string(),
        definition: z.string()
      })
    )
  )
});

// server/auth.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "libdict-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      secure: process.env.NODE_ENV === "production"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !await comparePasswords(password, user.password)) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password)
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/pdf-converter.ts
var PdfConverter = class {
  /**
   * Convert PDF content to LibDict format
   * @param pdfContent - The PDF content as a buffer or string
   * @param title - The title for the library
   * @param options - Conversion options
   * @returns Promise<LibDict> - The converted LibDict object
   */
  static async convertToLibDict(pdfContent, title, options) {
    const libdict = {
      format_version: "1.0",
      title,
      sections: {
        nouns: [],
        adjectives: [],
        verbs: [],
        adverbs: [],
        prepositions: [],
        conjunctions: []
      }
    };
    return libdict;
  }
  /**
   * Validate if the content is a valid PDF
   * @param content - The content to validate
   * @returns boolean - Whether the content is a valid PDF
   */
  static isValidPdf(content) {
    const header = content.slice(0, 5).toString();
    return header === "%PDF-";
  }
};

// server/routes.ts
import multer from "multer";
import { ZodError as ZodError2 } from "zod";
import { fromZodError as fromZodError2 } from "zod-validation-error";
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB
  }
});
async function registerRoutes(app2) {
  setupAuth(app2);
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  app2.get("/api/libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const libraries2 = await storage.getLibrariesByUserId(userId);
      res.json(libraries2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });
  app2.get("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      const userId = req.user.id;
      if (library.userId !== userId) {
        const sharedLibraries2 = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries2.some((shared) => shared.id === libraryId);
        if (!isShared) {
          return res.status(403).json({ message: "You don't have access to this library" });
        }
      }
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch library" });
    }
  });
  app2.post("/api/libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const libraryData = insertLibrarySchema.parse({
        ...req.body,
        userId
      });
      const library = await storage.createLibrary(libraryData);
      res.status(201).json(library);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create library" });
    }
  });
  app2.patch("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const userId = req.user.id;
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
  app2.delete("/api/libraries/:id", isAuthenticated, async (req, res) => {
    try {
      const libraryId = parseInt(req.params.id);
      const userId = req.user.id;
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
  app2.get("/api/shared-libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const sharedLibraries2 = await storage.getSharedLibraries(userId);
      res.json(sharedLibraries2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared libraries" });
    }
  });
  app2.post("/api/shared-libraries", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { libraryId, sharedWithUserId } = insertSharedLibrarySchema.parse(req.body);
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      if (library.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to share this library" });
      }
      const sharedWithUser = await storage.getUser(sharedWithUserId);
      if (!sharedWithUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const sharedLibrary = await storage.shareLibrary({
        libraryId,
        sharedWithUserId
      });
      await storage.updateLibrary(libraryId, { shared: true });
      res.status(201).json(sharedLibrary);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to share library" });
    }
  });
  app2.delete("/api/shared-libraries/:libraryId/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const libraryId = parseInt(req.params.libraryId);
      const sharedWithUserId = parseInt(req.params.userId);
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
  app2.get("/api/study-progress/:libraryId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const libraryId = parseInt(req.params.libraryId);
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      if (library.userId !== userId) {
        const sharedLibraries2 = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries2.some((shared) => shared.id === libraryId);
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
  app2.post("/api/study-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const progressData = insertStudyProgressSchema.parse({
        ...req.body,
        userId
      });
      const libraryId = progressData.libraryId;
      const library = await storage.getLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }
      if (library.userId !== userId) {
        const sharedLibraries2 = await storage.getSharedLibraries(userId);
        const isShared = sharedLibraries2.some((shared) => shared.id === libraryId);
        if (!isShared) {
          return res.status(403).json({ message: "You don't have access to this library" });
        }
      }
      const progress = await storage.updateStudyProgress(progressData);
      res.json(progress);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update study progress" });
    }
  });
  app2.post(
    "/api/convert-pdf",
    isAuthenticated,
    upload.single("pdfFile"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No PDF file provided" });
        }
        if (!PdfConverter.isValidPdf(req.file.buffer)) {
          return res.status(400).json({ message: "Invalid PDF file" });
        }
        const { title, sectionIdentifier, termDefinitionSeparator } = req.body;
        if (!title) {
          return res.status(400).json({ message: "Title is required" });
        }
        const libdict = await PdfConverter.convertToLibDict(
          req.file.buffer,
          title,
          {
            sectionIdentifier: sectionIdentifier || "headings",
            termDefinitionSeparator: termDefinitionSeparator || "colon"
          }
        );
        const parsedLibdict = libdictSchema.parse(libdict);
        const userId = req.user.id;
        const library = await storage.createLibrary({
          title,
          userId,
          content: parsedLibdict,
          shared: false
        });
        res.status(201).json(library);
      } catch (error) {
        if (error instanceof ZodError2) {
          const validationError = fromZodError2(error);
          return res.status(400).json({ message: validationError.message });
        }
        console.error("PDF conversion error:", error);
        res.status(500).json({ message: "Failed to convert PDF to LibDict" });
      }
    }
  );
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
