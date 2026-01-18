import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, getWebSocketServer } from "./websocket";
import { attendanceFormSchema, studentRegistrationSchema, studentLoginSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup WebSocket server
  setupWebSocket(httpServer);

  // Helper to get client Public IP (works on Render)
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "unknown";
  };

  // Device Info Helper
  const getClientDevice = (req: Request): string => {
    const userAgent = req.headers["user-agent"] || "Unknown";
    return userAgent.includes("Mobile") ? "Mobile Browser" : "Desktop Browser";
  };

  // --- API Routes ---

  // Network Check (Updated for Host=Student logic)
  app.get("/api/network/check", async (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const activeSession = await storage.getActiveSession();

    let allowed = true;
    let message = "You are ready to submit.";

    if (activeSession && activeSession.authorizedIp) {
      if (clientIp !== activeSession.authorizedIp) {
        allowed = false;
        message = "Access Denied: You are not on the same Wi-Fi network as the Moderator.";
      }
    }

    res.json({
      clientIp,
      authorizedIp: activeSession?.authorizedIp,
      allowed,
      message,
    });
  });

  // QR Code URL Helper
  app.get("/api/qr-code", async (req: Request, res: Response) => {
    const currentUrl = `${req.protocol}://${req.get('host')}`;
    const attendanceUrl = `${currentUrl}/attendance`;
    res.json({
      url: attendanceUrl,
      qrData: attendanceUrl
    });
  });

  // Session Status
  app.get("/api/session", async (_req: Request, res: Response) => {
    const session = await storage.getActiveSession();
    res.json({ active: !!session, session });
  });

  // Toggle Session (Now captures Host IP)
  app.post("/api/session/toggle", async (req: Request, res: Response) => {
    try {
      const activeSession = await storage.getActiveSession();
      const hostIp = getClientIp(req);
      let updatedSession;

      if (activeSession) {
        // Stop session
        updatedSession = await storage.updateSession(activeSession.id, false, new Date());
      } else {
        // Start new session and LOCK it to the Host's current Public IP
        updatedSession = await storage.createSession({
          name: req.body.name || `Session ${new Date().toLocaleDateString()}`,
          isActive: true,
          startTime: new Date(),
          authorizedIp: hostIp,
        });
        console.log(`[session] Started and locked to Host IP: ${hostIp}`);
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

  // Submit Attendance (The Core Security Logic)
  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        return res.status(403).json({ error: "No active session" });
      }

      const clientIp = getClientIp(req);

      // --- THE MAIN SECURITY GOAL ---
      // Check if Student IP matched the Host IP saved when session started
      if (activeSession.authorizedIp && clientIp !== activeSession.authorizedIp) {
        return res.status(403).json({
          error: "Network Security Violation",
          message: "You must be on the same Wi-Fi network as the Moderator to submit attendance."
        });
      }

      const validated = attendanceFormSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: "Validation failed", details: validated.error.errors });
      }

      const { name, studentId, department } = validated.data;
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

  // --- Admin Specific Routes (called directly from AdminDashboard.tsx) ---

  // Admin: Get all students
  app.get("/api/admin/students", async (_req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      res.json({ students });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Admin: Delete a student
  app.delete("/api/admin/students/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      // Assuming storage has a deleteStudent method or similar, 
      // but let's check or implement if missing. 
      // For now, let's assume we need to add it to IStorage.
      await storage.deleteStudent(student.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Admin: Get all sessions (history) with their records
  app.get("/api/admin/sessions", async (_req: Request, res: Response) => {
    try {
      const allSessions = await storage.getAllSessions();
      const allRecords = await storage.getAllAttendanceRecords();

      const sessionsWithRecords = allSessions.map(session => ({
        ...session,
        records: allRecords.filter(r => r.sessionId === session.id)
      }));

      res.json({ sessions: sessionsWithRecords });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Admin: Get Stats
  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    try {
      const records = await storage.getAllAttendanceRecords();
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;

      const departmentBreakdown = records.reduce((acc: any, r) => {
        const dept = r.department || 'Other';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      res.json({
        total,
        present,
        late,
        departmentBreakdown
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
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

