import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
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

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security middleware (apply early, in order)
app.use(requestIdMiddleware); // Add request IDs first for tracking
app.use(corsMiddleware); // CORS before other security checks
app.use(ipFilterMiddleware); // IP filtering early
app.use("/api", requestValidationMiddleware); // Validate request patterns
app.use("/api", anomalyDetectionMiddleware); // Detect suspicious patterns
app.use(securityHeadersMiddleware); // Security headers
app.use(requestSizeMiddleware); // Request size limits
app.use(timeoutMiddleware(30000)); // 30 second timeout

// Apply general rate limiting to all routes
app.use(rateLimitMiddleware());

app.use(
  express.json({
    limit: "10kb", // Enforce 10KB limit
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10kb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
  await registerRoutes(httpServer, app);

  // Use secure error handler
  app.use(secureErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    port,
    "0.0.0.0",
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
