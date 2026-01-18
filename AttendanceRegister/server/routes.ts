import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, getWebSocketServer } from "./websocket";
import { attendanceFormSchema } from "@shared/schema";
import { validateClientIp, getNetworkConfig } from "./network";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize network configuration
  getNetworkConfig();
  
  // Setup WebSocket server
  setupWebSocket(httpServer);

  // Get client IP address
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    // Handle IPv6-mapped IPv4 addresses
    const remoteAddr = req.socket.remoteAddress || "";
    if (remoteAddr.startsWith("::ffff:")) {
      return remoteAddr.substring(7);
    }
    return remoteAddr || "unknown";
  };

  // Middleware to validate IP address (same network check)
  const validateIpMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const validation = validateClientIp(clientIp);
    
    if (!validation.allowed) {
      return res.status(403).json({
        error: "Network Access Denied",
        message: validation.reason || "You must be on the same network as the server to access this system.",
        clientIp,
      });
    }
    
    next();
  };

  // Get client device info
  const getClientDevice = (req: Request): string => {
    const userAgent = req.headers["user-agent"] || "Unknown";
    // Simple device detection
    if (userAgent.includes("Mobile")) {
      return "Mobile Browser";
    }
    return "Desktop Browser";
  };

  // API Routes
  // Note: Admin routes don't need IP validation (they're password protected)
  // But attendance submission routes do need IP validation

  // Get all attendance records (admin only, no IP check needed)
  app.get("/api/attendance", async (_req: Request, res: Response) => {
    try {
      const records = await storage.getAllAttendanceRecords();
      res.json({ records });
    } catch (error) {
      console.error("[api] Error fetching records:", error);
      res.status(500).json({ error: "Failed to fetch records" });
    }
  });

  // Get session status
  app.get("/api/session", (_req: Request, res: Response) => {
    res.json({ active: storage.isSessionActive() });
  });

  // Get network info (for client to check if on same network)
  app.get("/api/network/check", (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const validation = validateClientIp(clientIp);
    const config = getNetworkConfig();
    
    res.json({
      clientIp,
      serverIp: config.serverIp,
      allowed: validation.allowed,
      message: validation.allowed 
        ? "You are on the same network" 
        : validation.reason || "Network access denied",
    });
  });

  // Toggle session (start/stop)
  app.post("/api/session/toggle", (req: Request, res: Response) => {
    try {
      const currentState = storage.isSessionActive();
      const newState = !currentState;
      
      storage.setSessionActive(newState);
      
      const verifiedState = storage.isSessionActive();
      console.log(`[session] Toggled from ${currentState ? 'Active' : 'Inactive'} to ${verifiedState ? 'Active' : 'Inactive'}`);
      
      if (verifiedState !== newState) {
        console.error(`[session] State mismatch! Expected ${newState}, got ${verifiedState}`);
      }
      
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifySessionToggled(verifiedState);
      }
      
      // Ensure we always send a valid JSON response
      res.status(200).json({ active: verifiedState });
    } catch (error) {
      console.error("[api] Error toggling session:", error);
      res.status(500).json({ 
        error: "Failed to toggle session",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Submit attendance (requires same network IP)
  app.post("/api/attendance", validateIpMiddleware, async (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      
      // Double-check IP validation (should already be validated by middleware)
      const validation = validateClientIp(clientIp);
      if (!validation.allowed) {
        return res.status(403).json({
          error: "Network Access Denied",
          message: validation.reason || "You must be on the same network as the server.",
        });
      }

      // Check if session is active
      if (!storage.isSessionActive()) {
        return res.status(403).json({ error: "Session is not active" });
      }

      // Validate input
      const validationResult = attendanceFormSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const { name, studentId, department } = validationResult.data;

      // Check for duplicate submission (same student ID in current session)
      const existingRecords = await storage.getAllAttendanceRecords();
      const recentSubmission = existingRecords.find(
        (r) => r.studentId === studentId
      );

      if (recentSubmission) {
        // Check if submitted within last hour (prevent duplicates)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (recentSubmission.timestamp > oneHourAgo) {
          return res.status(409).json({ 
            error: "You have already submitted attendance today" 
          });
        }
      }

      // Additional security: Check if same IP has submitted multiple times (prevent proxy abuse)
      const sameIpSubmissions = existingRecords.filter(
        (r) => r.ipAddress === clientIp
      );
      if (sameIpSubmissions.length >= 10) {
        return res.status(429).json({
          error: "Too many submissions from this IP address",
          message: "Maximum submissions per IP address reached. Please contact the administrator.",
        });
      }

      // Get client info
      const ipAddress = getClientIp(req);
      const device = getClientDevice(req);

      // Allow clients to provide a persistent device identifier. Prefer the header
      // `x-device-id` or a `deviceId` field in the request body. If absent, fall
      // back to IP + device type (less reliable).
      const headerDeviceId = (req.headers["x-device-id"] || undefined) as string | undefined;
      const bodyDeviceId = (req.body && typeof req.body.deviceId === "string") ? req.body.deviceId as string : undefined;
      const clientProvidedDeviceId = headerDeviceId || bodyDeviceId;

      // Build the canonical device id used to claim the session
      const currentDeviceId = clientProvidedDeviceId ?? `${ipAddress}::${device}`;

      const claimingDevice = storage.getSessionClaimingDevice();

      if (claimingDevice && claimingDevice !== currentDeviceId) {
        return res.status(403).json({
          error: "Another device has already claimed this active session",
          message: clientProvidedDeviceId
            ? "A different deviceId has already claimed this session. Ask the host to reset the session to allow another device."
            : "Another device has already claimed this active session (server fallback used). To fix this reliably, use a persistent deviceId: store a generated UUID in localStorage and send it as the `x-device-id` header or `deviceId` in the request body when submitting attendance.",
        });
      }

      // If no device has claimed the session yet, set this device as the claimant.
      if (!claimingDevice) {
        storage.setSessionClaimingDevice(currentDeviceId);
      }

      // Create attendance record
      const record = await storage.createAttendanceRecord({
        name,
        studentId,
        department: department || undefined,
        ipAddress,
        device,
        status: "present",
      });

      // Notify all connected clients via WebSocket
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyAttendanceRecorded(record);
      }

      res.status(201).json({ record });
    } catch (error) {
      console.error("[api] Error creating attendance record:", error);
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });

  // Clear all records
  app.delete("/api/attendance", async (_req: Request, res: Response) => {
    try {
      await storage.clearAllRecords();
      
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyRecordsCleared();
      }
      
      res.json({ message: "All records cleared" });
    } catch (error) {
      console.error("[api] Error clearing records:", error);
      res.status(500).json({ error: "Failed to clear records" });
    }
  });

  return httpServer;
}
