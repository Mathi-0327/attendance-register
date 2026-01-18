import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { IncomingMessage } from "http";
import { storage } from "./storage";
import type { AttendanceRecord } from "@shared/schema";
import { validateClientIp } from "./network";

export interface WebSocketMessage {
  type: "attendance_recorded" | "session_toggled" | "records_cleared" | "initial_data";
  data?: any;
}

class WSServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(httpServer: Server) {
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      // Get client IP from WebSocket request
      const clientIp = this.getClientIp(req);
      const validation = validateClientIp(clientIp);
      
      // For WebSocket, we allow connections but log warnings for external IPs
      // The actual API endpoints will block them
      if (!validation.allowed) {
        console.warn(`[websocket] Connection from external IP: ${clientIp} - ${validation.reason}`);
        // Still allow connection but they won't be able to submit attendance
      } else {
        console.log(`[websocket] Client connected from ${clientIp}. Total clients: ${this.clients.size}`);
      }
      
      this.clients.add(ws);

      // Send initial data to newly connected client
      this.sendInitialData(ws);

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[websocket] Client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on("error", (error) => {
        console.error("[websocket] Error:", error);
      });
    });
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    const remoteAddr = req.socket.remoteAddress || "";
    if (remoteAddr.startsWith("::ffff:")) {
      return remoteAddr.substring(7);
    }
    return remoteAddr || "unknown";
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      const records = await storage.getAllAttendanceRecords();
      const sessionActive = storage.isSessionActive();
      
      const message: WebSocketMessage = {
        type: "initial_data",
        data: {
          records,
          sessionActive,
        },
      };
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("[websocket] Error sending initial data:", error);
    }
  }

  broadcast(message: WebSocketMessage) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  notifyAttendanceRecorded(record: AttendanceRecord) {
    this.broadcast({
      type: "attendance_recorded",
      data: record,
    });
  }

  notifySessionToggled(active: boolean) {
    this.broadcast({
      type: "session_toggled",
      data: { active },
    });
  }

  notifyRecordsCleared() {
    this.broadcast({
      type: "records_cleared",
    });
  }
}

let wsServerInstance: WSServer | null = null;

export function setupWebSocket(httpServer: Server): WSServer {
  if (!wsServerInstance) {
    wsServerInstance = new WSServer(httpServer);
  }
  return wsServerInstance;
}

export function getWebSocketServer(): WSServer | null {
  return wsServerInstance;
}

