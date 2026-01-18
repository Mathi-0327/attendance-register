import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, getWebSocketServer } from "./websocket";
import { attendanceFormSchema, studentRegistrationSchema, studentLoginSchema } from "@shared/schema";
import { validateClientIp, getNetworkConfig } from "./network";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize network configuration
  getNetworkConfig();

  // Setup WebSocket server
  setupWebSocket(httpServer);

  // Helper to get client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    const remoteAddr = req.socket.remoteAddress || "";
    if (remoteAddr.startsWith("::ffff:")) {
      return remoteAddr.substring(7);
    }
    return remoteAddr || "unknown";
  };

  // IP Validation Middleware
  const validateIpMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const validation = validateClientIp(clientIp);

    if (!validation.allowed) {
      return res.status(403).json({
        error: "Network Access Denied",
        message: validation.reason || "You must be on the same network as the server.",
        clientIp,
      });
    }
    next();
  };

  // Device Info Helper
  const getClientDevice = (req: Request): string => {
    const userAgent = req.headers["user-agent"] || "Unknown";
    return userAgent.includes("Mobile") ? "Mobile Browser" : "Desktop Browser";
  };

  // --- API Routes ---

  // Network Check
  app.get("/api/network/check", (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const validation = validateClientIp(clientIp);
    const config = getNetworkConfig();
    res.json({
      clientIp,
      serverIp: config.serverIp,
      allowed: validation.allowed,
      message: validation.allowed ? "You are on the same network" : validation.reason || "Network access denied",
    });
  });

  // Session Status
  app.get("/api/session", async (_req: Request, res: Response) => {
    const session = await storage.getActiveSession();
    res.json({ active: !!session, session });
  });

  // Toggle Session
  app.post("/api/session/toggle", async (req: Request, res: Response) => {
    try {
      const activeSession = await storage.getActiveSession();
      let updatedSession;

      if (activeSession) {
        // Stop session
        updatedSession = await storage.updateSession(activeSession.id, false, new Date());
      } else {
        // Start new session
        updatedSession = await storage.createSession({
          name: req.body.name || `Session ${new Date().toLocaleDateString()}`,
          isActive: true,
          startTime: new Date(),
        });
      }

      const wsServer = getWebSocketServer();
      if (wsServer) wsServer.notifySessionToggled(updatedSession.isActive);

      res.json({ active: updatedSession.isActive, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle session" });
    }
  });

  // Attendance Records
  app.get("/api/attendance", async (_req: Request, res: Response) => {
    try {
      const records = await storage.getAllAttendanceRecords();
      res.json({ records });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch records" });
    }
  });

  // Submit Attendance
  app.post("/api/attendance", validateIpMiddleware, async (req: Request, res: Response) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        return res.status(403).json({ error: "No active session" });
      }

      const validated = attendanceFormSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: "Validation failed", details: validated.error.errors });
      }

      const { name, studentId, department } = validated.data;
      const clientIp = getClientIp(req);
      const device = getClientDevice(req);

      // Duplicate Check
      const records = await storage.getAllAttendanceRecords();
      const duplicate = records.find(r => r.studentId === studentId && r.sessionId === activeSession.id);
      if (duplicate) {
        return res.status(409).json({ error: "Attendance already submitted for this session" });
      }

      const record = await storage.createAttendanceRecord({
        sessionId: activeSession.id,
        name,
        studentId,
        department,
        ipAddress: clientIp,
        device,
        status: "present",
      });

      const wsServer = getWebSocketServer();
      if (wsServer) wsServer.notifyAttendanceRecorded(record);

      res.status(201).json({ record });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit attendance" });
    }
  });

  // Clear Records
  app.delete("/api/attendance", async (_req: Request, res: Response) => {
    try {
      await storage.clearAllRecords();
      const wsServer = getWebSocketServer();
      if (wsServer) wsServer.notifyRecordsCleared();
      res.json({ message: "All records cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear records" });
    }
  });

  // --- Student Registration & Login ---

  app.post("/api/students/register", async (req: Request, res: Response) => {
    try {
      const validated = studentRegistrationSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: "Invalid registration data", details: validated.error.errors });
      }

      const existing = await storage.getStudentById(validated.data.studentId);
      if (existing) {
        return res.status(400).json({ error: "Student ID already registered" });
      }

      const student = await storage.createStudent(validated.data);
      res.status(201).json({ message: "Registration successful", student });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/students/login", async (req: Request, res: Response) => {
    try {
      const validated = studentLoginSchema.safeParse(req.body);
      if (!validated.success) return res.status(400).json({ error: "Invalid login data" });

      const student = await storage.getStudentById(validated.data.studentId);
      if (!student || student.password !== validated.data.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ message: "Login successful", student });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/students", async (_req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      res.json({ students });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  return httpServer;
}
