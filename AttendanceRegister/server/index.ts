import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import {
  securityHeadersMiddleware,
  requestSizeMiddleware,
  rateLimitMiddleware,
  timeoutMiddleware,
  corsMiddleware,
  requestIdMiddleware,
  ipFilterMiddleware,
  anomalyDetectionMiddleware,
  requestValidationMiddleware,
  secureErrorHandler,
} from "./security";

const app = express();
const httpServer = createServer(app);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security middleware (apply early, in order)
app.use(requestIdMiddleware);
app.use(corsMiddleware);

// STRICT SECURITY: Always filter by IP (Same Network Check)
app.use(ipFilterMiddleware);

app.use("/api", requestValidationMiddleware);
app.use("/api", anomalyDetectionMiddleware);
app.use(securityHeadersMiddleware);
app.use(requestSizeMiddleware);
app.use(timeoutMiddleware(30000));

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "attendance-register-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for local network access (HTTP)
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(rateLimitMiddleware());

app.use(
  express.json({
    limit: "10kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    log("Starting local network host initialization...");
    await registerRoutes(httpServer, app);

    app.use(secureErrorHandler);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      log(`SUCCESS: Your Attendance Register is LIVE on your Wi-Fi!`);
      log(`Have students join your Wi-Fi and open your local IP on port ${port}`);
    });
  } catch (error) {
    console.error("FATAL ERROR DURING STARTUP:", error);
    process.exit(1);
  }
})();
