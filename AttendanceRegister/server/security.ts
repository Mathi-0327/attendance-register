import type { Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "crypto";

// Security event logging
export interface SecurityEvent {
  type: "rate_limit" | "suspicious_request" | "auth_failure" | "auth_success" | "large_request" | "invalid_input";
  ip: string;
  path: string;
  method: string;
  timestamp: Date;
  details?: Record<string, any>;
}

const securityEvents: SecurityEvent[] = [];
const MAX_SECURITY_EVENTS = 1000; // Keep last 1000 events

export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };
  securityEvents.push(fullEvent);
  
  // Keep only recent events
  if (securityEvents.length > MAX_SECURITY_EVENTS) {
    securityEvents.shift();
  }
  
  console.warn(`[security] ${event.type.toUpperCase()}: ${event.method} ${event.path} from ${event.ip}`, event.details || "");
}

export function getSecurityEvents(limit = 100): SecurityEvent[] {
  return securityEvents.slice(-limit).reverse();
}

// Rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clear rate limits for a specific endpoint (useful when session restarts)
export function clearRateLimitForEndpoint(endpoint: string) {
  const keysToDelete: string[] = [];
  for (const [key] of rateLimitStore) {
    if (key.endsWith(`:${endpoint}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
}

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute (increased for better UX)
  blockDurationMs: 2 * 60 * 1000, // Block for 2 minutes (reduced)
};

// Per-endpoint rate limits
const endpointRateLimits: Record<string, RateLimitConfig> = {
  "/api/attendance": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 submissions per minute (increased for normal usage and testing)
    blockDurationMs: 2 * 60 * 1000, // Block for 2 minutes (reduced)
  },
  "/api/session/toggle": {
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDurationMs: 5 * 60 * 1000,
  },
  "/api/network/check": {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 20, // 20 checks per 10 seconds
  },
};

export function rateLimitMiddleware(config?: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const path = req.path;
    
    // Get endpoint-specific config or use default
    const endpointConfig = endpointRateLimits[path] || config || defaultRateLimitConfig;
    const key = `${clientIp}:${path}`;
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    // Clean up expired entries
    if (entry && entry.resetTime < now) {
      if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
        // Still blocked
        logSecurityEvent({
          type: "rate_limit",
          ip: clientIp,
          path,
          method: req.method,
          details: { reason: "Still blocked", blockUntil: new Date(entry.blockUntil) },
        });
        
        return res.status(429).json({
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please try again after ${Math.ceil((entry.blockUntil - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        });
      }
      // Reset if not blocked or block expired
      entry = undefined;
    }
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + endpointConfig.windowMs,
        blocked: false,
      };
    }
    
    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
      logSecurityEvent({
        type: "rate_limit",
        ip: clientIp,
        path,
        method: req.method,
        details: { reason: "Blocked", blockUntil: new Date(entry.blockUntil) },
      });
      
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again after ${Math.ceil((entry.blockUntil - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
      });
    }
    
    entry.count++;
    
    // Check if limit exceeded
    if (entry.count > endpointConfig.maxRequests) {
      entry.blocked = true;
      if (endpointConfig.blockDurationMs) {
        entry.blockUntil = now + endpointConfig.blockDurationMs;
      }
      
      logSecurityEvent({
        type: "rate_limit",
        ip: clientIp,
        path,
        method: req.method,
        details: {
          count: entry.count,
          maxRequests: endpointConfig.maxRequests,
          blockDuration: endpointConfig.blockDurationMs,
        },
      });
      
      rateLimitStore.set(key, entry);
      
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Maximum ${endpointConfig.maxRequests} requests per ${endpointConfig.windowMs / 1000} seconds.`,
        retryAfter: endpointConfig.blockDurationMs ? Math.ceil(endpointConfig.blockDurationMs / 1000) : undefined,
      });
    }
    
    rateLimitStore.set(key, entry);
    
    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", endpointConfig.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, endpointConfig.maxRequests - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());
    
    next();
  };
}

// Security headers middleware
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy (relaxed for development)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws: wss:;"
    );
  }
  
  // Remove server header
  res.removeHeader("X-Powered-By");
  
  next();
}

// Request size limits
const MAX_REQUEST_SIZE = 1024 * 10; // 10KB for JSON body
const MAX_URL_LENGTH = 2048;

export function requestSizeMiddleware(req: Request, res: Response, next: NextFunction) {
  const urlLength = req.url.length;
  
  if (urlLength > MAX_URL_LENGTH) {
    logSecurityEvent({
      type: "suspicious_request",
      ip: getClientIp(req),
      path: req.path,
      method: req.method,
      details: { reason: "URL too long", length: urlLength },
    });
    
    return res.status(414).json({
      error: "Request URI Too Long",
      message: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
    });
  }
  
  const contentLength = req.headers["content-length"];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      logSecurityEvent({
        type: "large_request",
        ip: getClientIp(req),
        path: req.path,
        method: req.method,
        details: { size, maxSize: MAX_REQUEST_SIZE },
      });
      
      return res.status(413).json({
        error: "Payload Too Large",
        message: `Request body exceeds maximum size of ${MAX_REQUEST_SIZE} bytes`,
      });
    }
  }
  
  next();
}

// Input sanitization
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length (prevent extremely long strings)
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  return sanitized;
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Get client IP (reusable)
export function getClientIp(req: Request): string {
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

// Admin authentication with secure password hashing
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  createHash("sha256").update("admin123").digest("hex"); // Default hash for "admin123"

const adminSessions = new Map<string, { expiresAt: number; ip: string }>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const hash = hashPassword(password);
  return hash === ADMIN_PASSWORD_HASH;
}

export function createAdminSession(ip: string): string {
  const sessionId = randomBytes(32).toString("hex");
  adminSessions.set(sessionId, {
    expiresAt: Date.now() + SESSION_DURATION,
    ip,
  });
  
  // Clean up expired sessions periodically
  if (adminSessions.size > 100) {
    const now = Date.now();
    const entries = Array.from(adminSessions.entries());
    for (const [sid, session] of entries) {
      if (session.expiresAt < now) {
        adminSessions.delete(sid);
      }
    }
  }
  
  return sessionId;
}

export function verifyAdminSession(sessionId: string, ip: string): boolean {
  const session = adminSessions.get(sessionId);
  if (!session) {
    return false;
  }
  
  if (session.expiresAt < Date.now()) {
    adminSessions.delete(sessionId);
    return false;
  }
  
  // Optional: verify IP matches (can be relaxed for NAT/proxy scenarios)
  // if (session.ip !== ip) {
  //   return false;
  // }
  
  return true;
}

export function checkLoginAttempts(ip: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  let attempt = loginAttempts.get(ip);
  
  if (!attempt || attempt.resetTime < now) {
    attempt = { count: 0, resetTime: now + LOGIN_ATTEMPT_WINDOW };
  }
  
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    logSecurityEvent({
      type: "auth_failure",
      ip,
      path: "/api/admin/login",
      method: "POST",
      details: { reason: "Too many login attempts" },
    });
    
    return {
      allowed: false,
      remainingAttempts: 0,
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count,
  };
}

export function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now();
  let attempt = loginAttempts.get(ip);
  
  if (!attempt || attempt.resetTime < now) {
    attempt = { count: 0, resetTime: now + LOGIN_ATTEMPT_WINDOW };
  }
  
  if (success) {
    // Reset on successful login
    loginAttempts.delete(ip);
  } else {
    attempt.count++;
    loginAttempts.set(ip, attempt);
  }
}

// Admin authentication middleware
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers["x-admin-session"] as string | undefined;
  const clientIp = getClientIp(req);
  
  if (!sessionId || !verifyAdminSession(sessionId, clientIp)) {
    logSecurityEvent({
      type: "auth_failure",
      ip: clientIp,
      path: req.path,
      method: req.method,
      details: { reason: "Invalid or missing session" },
    });
    
    return res.status(401).json({
      error: "Unauthorized",
      message: "Admin authentication required",
    });
  }
  
  next();
}

// Request timeout middleware
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logSecurityEvent({
          type: "suspicious_request",
          ip: getClientIp(req),
          path: req.path,
          method: req.method,
          details: { reason: "Request timeout" },
        });
        
        res.status(408).json({
          error: "Request Timeout",
          message: "Request took too long to process",
        });
      }
    }, timeoutMs);
    
    res.on("finish", () => {
      clearTimeout(timer);
    });
    
    next();
  };
}

// CORS configuration
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : []; // Empty means same-origin only
  
  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:5000", "http://127.0.0.1:5000");
  }
  
  // Allow same-origin requests
  if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-session, x-device-id");
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  }
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  next();
}

// Request ID tracking for audit trails
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = randomBytes(8).toString("hex");
  (req as any).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

// IP blacklist/whitelist
const ipBlacklist = new Set<string>();
const ipWhitelist = new Set<string>();

export function addToBlacklist(ip: string) {
  ipBlacklist.add(ip);
  logSecurityEvent({
    type: "suspicious_request",
    ip,
    path: "system",
    method: "BLACKLIST",
    details: { action: "IP added to blacklist" },
  });
}

export function addToWhitelist(ip: string) {
  ipWhitelist.add(ip);
}

export function removeFromBlacklist(ip: string) {
  ipBlacklist.delete(ip);
}

export function isBlacklisted(ip: string): boolean {
  return ipBlacklist.has(ip);
}

export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  
  // Check blacklist first
  if (isBlacklisted(clientIp)) {
    logSecurityEvent({
      type: "suspicious_request",
      ip: clientIp,
      path: req.path,
      method: req.method,
      details: { reason: "Blacklisted IP" },
    });
    
    return res.status(403).json({
      error: "Access Denied",
      message: "Your IP address has been blocked",
    });
  }
  
  // If whitelist exists and is not empty, enforce it
  if (ipWhitelist.size > 0 && !ipWhitelist.has(clientIp) && clientIp !== "127.0.0.1" && !clientIp.startsWith("::ffff:127.0.0.1")) {
    logSecurityEvent({
      type: "suspicious_request",
      ip: clientIp,
      path: req.path,
      method: req.method,
      details: { reason: "IP not in whitelist" },
    });
    
    return res.status(403).json({
      error: "Access Denied",
      message: "Your IP address is not authorized",
    });
  }
  
  next();
}

// Enhanced device fingerprinting
export function generateDeviceFingerprint(req: Request): string {
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";
  
  const fingerprintData = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return createHash("sha256").update(fingerprintData).digest("hex").substring(0, 16);
}

// Anomaly detection - detect unusual patterns
interface RequestPattern {
  ip: string;
  path: string;
  method: string;
  timestamp: number;
}

const recentRequests: RequestPattern[] = [];
const MAX_RECENT_REQUESTS = 1000;

export function detectAnomalies(req: Request): { suspicious: boolean; reason?: string } {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  // Clean old requests
  while (recentRequests.length > 0 && recentRequests[0].timestamp < fiveMinutesAgo) {
    recentRequests.shift();
  }
  
  // Add current request
  recentRequests.push({
    ip: clientIp,
    path: req.path,
    method: req.method,
    timestamp: now,
  });
  
  // Keep only recent requests
  if (recentRequests.length > MAX_RECENT_REQUESTS) {
    recentRequests.shift();
  }
  
  // Check for rapid requests from same IP
  const recentFromIp = recentRequests.filter(r => r.ip === clientIp && r.timestamp > fiveMinutesAgo);
  if (recentFromIp.length > 100) {
    return { suspicious: true, reason: "Too many requests in short time" };
  }
  
  // Check for repeated failed requests
  const failedRequests = recentFromIp.filter(r => 
    r.path.includes("/admin/login") || r.path.includes("/api/attendance")
  );
  if (failedRequests.length > 20) {
    return { suspicious: true, reason: "Repeated failed authentication attempts" };
  }
  
  // Check for scanning behavior (many different paths)
  const uniquePaths = new Set(recentFromIp.map(r => r.path));
  if (uniquePaths.size > 50) {
    return { suspicious: true, reason: "Scanning behavior detected" };
  }
  
  return { suspicious: false };
}

export function anomalyDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const anomaly = detectAnomalies(req);
  
  if (anomaly.suspicious) {
    logSecurityEvent({
      type: "suspicious_request",
      ip: getClientIp(req),
      path: req.path,
      method: req.method,
      details: { reason: anomaly.reason },
    });
    
    // Don't block, just log - rate limiting will handle it
  }
  
  next();
}

// Password complexity validation
export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  // Check for common passwords (basic check)
  const commonPasswords = ["password", "admin", "12345678", "qwerty", "letmein"];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push("Password is too common");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Session rotation - rotate session ID periodically
export function rotateAdminSession(oldSessionId: string, ip: string): string | null {
  const session = adminSessions.get(oldSessionId);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  
  // Create new session
  const newSessionId = createAdminSession(ip);
  
  // Transfer expiry time
  const newSession = adminSessions.get(newSessionId);
  if (newSession) {
    newSession.expiresAt = session.expiresAt;
  }
  
  // Remove old session
  adminSessions.delete(oldSessionId);
  
  return newSessionId;
}

// Enhanced error handling - don't leak sensitive information
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Log full error for debugging
  console.error("[error]", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: getClientIp(req),
    requestId: (req as any).requestId,
  });
  
  // Don't expose stack traces or internal errors in production
  const status = err.status || err.statusCode || 500;
  const message = isDevelopment 
    ? err.message 
    : status === 500 
      ? "Internal Server Error" 
      : err.message;
  
  res.status(status).json({
    error: message,
    requestId: (req as any).requestId,
    ...(isDevelopment && { stack: err.stack }),
  });
}

// Request validation middleware - validate common attack patterns
export function requestValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for SQL injection patterns in query params
  const sqlPatterns = [/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i];
  const url = req.url.toLowerCase();
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(url)) {
      logSecurityEvent({
        type: "suspicious_request",
        ip: getClientIp(req),
        path: req.path,
        method: req.method,
        details: { reason: "Potential SQL injection attempt" },
      });
      
      return res.status(400).json({
        error: "Invalid Request",
        message: "Request contains invalid characters",
      });
    }
  }
  
  // Check for path traversal attempts
  if (url.includes("..") || url.includes("//") || url.includes("\\")) {
    logSecurityEvent({
      type: "suspicious_request",
      ip: getClientIp(req),
      path: req.path,
      method: req.method,
      details: { reason: "Potential path traversal attempt" },
    });
    
    return res.status(400).json({
      error: "Invalid Request",
      message: "Invalid path",
    });
  }
  
  next();
}

