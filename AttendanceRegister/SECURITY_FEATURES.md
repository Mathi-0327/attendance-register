# Security Features Documentation

This document outlines all security features implemented in the Attendance Register application.

## 🔒 Core Security Features

### 1. **Security Headers**
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **Content-Security-Policy**: Restricts resource loading (production)
- **X-Powered-By**: Removed to hide server technology

### 2. **Rate Limiting**
- **General API**: 60 requests/minute
- **Attendance Submission**: 5 requests/minute (10-minute block)
- **Session Toggle**: 10 requests/minute (5-minute block)
- **Network Check**: 20 requests/10 seconds
- **Login Endpoint**: 5 attempts/15 minutes (30-minute block)
- Automatic IP blocking after exceeding limits

### 3. **Request Validation**
- **Request Size Limits**: 10KB max body, 2048 char max URL
- **Request Timeout**: 30-second timeout per request
- **SQL Injection Detection**: Blocks SQL keywords in URLs
- **Path Traversal Protection**: Blocks `..`, `//`, `\\` patterns
- **Input Sanitization**: Removes null bytes, trims, length limits

### 4. **Network Security**
- **IP Validation**: Only same-network IPs can submit attendance
- **IP Blacklist**: Admin can block specific IPs
- **IP Whitelist**: Optional IP whitelist enforcement
- **Network Detection**: Automatic detection of server network

### 5. **Authentication & Authorization**

#### Admin Authentication
- **Password Hashing**: SHA-256 hashing (configurable via `ADMIN_PASSWORD_HASH` env var)
- **Session Management**: Secure session IDs with 24-hour expiry
- **Session Rotation**: Ability to rotate session IDs
- **Brute Force Protection**: 
  - Max 5 login attempts per 15 minutes
  - 30-minute block after exceeding limit
  - Automatic tracking and logging

#### Password Security
- **Password Complexity Validation** (optional):
  - Minimum 8 characters
  - Requires uppercase, lowercase, and numbers
  - Blocks common passwords

### 6. **Anomaly Detection**
- **Rapid Request Detection**: Flags IPs with >100 requests in 5 minutes
- **Failed Authentication Tracking**: Detects repeated failed logins
- **Scanning Behavior Detection**: Identifies IPs accessing many different paths
- **Automatic Logging**: All anomalies logged to security events

### 7. **Security Logging & Monitoring**
- **Security Event Types**:
  - Rate limit violations
  - Suspicious requests
  - Authentication failures/successes
  - Large requests
  - Invalid inputs
- **Event Storage**: Last 1000 security events
- **Admin Endpoint**: `/api/admin/security-events` to view logs
- **Request ID Tracking**: Every request gets unique ID for audit trails

### 8. **CORS Configuration**
- **Same-Origin Default**: Only same-origin requests allowed by default
- **Development Mode**: Allows localhost origins
- **Configurable**: Set `ALLOWED_ORIGINS` env var for production
- **Credential Support**: Allows credentials for authenticated requests

### 9. **Device Fingerprinting**
- **Enhanced Fingerprinting**: Combines IP, User-Agent, Accept-Language, Accept-Encoding
- **SHA-256 Hashing**: Creates unique device identifiers
- **Session Claiming**: Prevents multiple devices from claiming same session

### 10. **Error Handling**
- **Secure Error Messages**: No stack traces in production
- **Request ID Inclusion**: Errors include request ID for tracking
- **Development Mode**: Full error details in development
- **Error Logging**: All errors logged with context

## 🛡️ Protected Endpoints

### Admin-Only Endpoints (Require Authentication)
- `GET /api/attendance` - View all attendance records
- `POST /api/session/toggle` - Start/stop attendance session
- `DELETE /api/attendance` - Clear all records
- `GET /api/admin/security-events` - View security logs
- `POST /api/admin/ip/blacklist` - Block an IP
- `POST /api/admin/ip/whitelist` - Whitelist an IP
- `DELETE /api/admin/ip/blacklist/:ip` - Remove IP from blacklist
- `GET /api/admin/device-fingerprint` - Get device fingerprint
- `POST /api/admin/rotate-session` - Rotate admin session

### Public Endpoints (Network Protected)
- `POST /api/attendance` - Submit attendance (requires same network)
- `GET /api/session` - Check session status
- `GET /api/network/check` - Check network access

### Authentication Endpoints
- `POST /api/admin/login` - Admin login (rate limited)
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/verify` - Verify admin session

## 🔐 Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Admin routes require authentication
3. **Input Validation**: All inputs validated and sanitized
4. **Output Encoding**: Prevents XSS attacks
5. **Secure Defaults**: Secure configuration by default
6. **Security Monitoring**: Comprehensive logging
7. **Rate Limiting**: Prevents abuse and DDoS
8. **Session Security**: Secure session management
9. **Error Handling**: No information leakage
10. **Request Tracking**: Full audit trail

## 📊 Security Metrics

- **Rate Limit Effectiveness**: Blocks excessive requests automatically
- **Anomaly Detection**: Identifies suspicious patterns
- **Security Events**: Tracked and accessible via admin panel
- **Request IDs**: Every request tracked for debugging

## 🚀 Additional Recommendations

### For Production Deployment:

1. **HTTPS Enforcement**:
   ```bash
   # Use reverse proxy (nginx/traefik) with SSL certificates
   # Set environment variable: FORCE_HTTPS=true
   ```

2. **Environment Variables**:
   ```bash
   ADMIN_PASSWORD_HASH=<sha256-hash-of-password>
   ALLOWED_ORIGINS=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Password Security**:
   - Use strong passwords (8+ chars, mixed case, numbers)
   - Change default password immediately
   - Consider implementing password change endpoint

4. **Monitoring**:
   - Set up alerts for security events
   - Monitor rate limit violations
   - Track authentication failures

5. **Backup & Recovery**:
   - Regular backups of attendance data
   - Security event log retention policy

6. **Network Security**:
   - Use VPN for remote access
   - Firewall rules for server
   - Regular security updates

## 🔍 Security Testing

To test security features:

1. **Rate Limiting**: Send rapid requests to any endpoint
2. **Authentication**: Try invalid login attempts
3. **Input Validation**: Send malformed data
4. **SQL Injection**: Try SQL keywords in URLs
5. **Path Traversal**: Try `../` in paths
6. **Network Access**: Try accessing from different network

## 📝 Security Event Types

- `rate_limit` - Rate limit exceeded
- `suspicious_request` - Unusual request pattern detected
- `auth_failure` - Failed authentication attempt
- `auth_success` - Successful authentication
- `large_request` - Request exceeds size limits
- `invalid_input` - Input validation failed

## 🎯 Security Compliance

This implementation follows:
- OWASP Top 10 security practices
- CWE/SANS Top 25 security guidelines
- Express.js security best practices
- Node.js security recommendations

---

**Last Updated**: 2024
**Version**: 1.0.0


