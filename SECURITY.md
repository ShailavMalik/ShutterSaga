# Security Documentation - ShutterSaga

**Last Updated:** January 8, 2026  
**Application Version:** 1.0  
**Security Level:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [API Security](#api-security)
6. [File Upload Security](#file-upload-security)
7. [Storage Security](#storage-security)
8. [Input Validation](#input-validation)
9. [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
10. [Security Headers](#security-headers)
11. [Environment & Configuration](#environment--configuration)
12. [Logging & Monitoring](#logging--monitoring)
13. [Threat Model](#threat-model)
14. [Security Best Practices](#security-best-practices)
15. [Incident Response](#incident-response)

---

## Overview

ShutterSaga is a full-stack photo gallery application built with the MERN stack (MongoDB, Express, React, Node.js) and Azure Blob Storage. This document outlines all security measures implemented to protect user data, prevent unauthorized access, and ensure application integrity.

### Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Users and services have minimal necessary permissions
- **Secure by Default**: Security measures are enabled by default
- **Zero Trust**: All requests are validated regardless of origin

---

## Authentication & Authorization

### 1. JWT (JSON Web Token) Authentication

**Implementation:** [`server/middleware/auth.js`](server/middleware/auth.js)

**Features:**

- Bearer token-based authentication
- Token signature verification using HS256 algorithm
- Configurable token expiration (default: 7 days)
- Automatic token validation on protected routes

**Token Structure:**

```javascript
{
  userId: "mongoDBObjectId",
  iat: issuedAtTimestamp,
  exp: expirationTimestamp
}
```

**Security Measures:**

- Tokens signed with secret key from environment variables
- Expired tokens automatically rejected with specific error messages
- Invalid tokens return 403 Forbidden
- Missing tokens return 401 Unauthorized
- User existence verified on every authenticated request

**Protected Routes:**

- All photo upload/edit/delete operations
- User profile access and updates
- Gallery operations

### 2. Password Security

**Implementation:** [`server/models/user.js`](server/models/user.js)

**Features:**

- Bcrypt hashing with salt rounds (10 rounds)
- Automatic password hashing on user creation and updates
- Secure password comparison using bcrypt.compare()
- Plain text passwords never stored or logged

**Password Requirements:**

- Minimum 6 characters
- Validated at schema level

**Process:**

```
Plain Password → Bcrypt Salt Generation → Hash + Store → Compare on Login
```

### 3. OAuth 2.0 Integration

**Implementation:** [`server/routes/auth.js`](server/routes/auth.js)

**Provider:** Google OAuth 2.0

**Features:**

- Google ID token verification
- Secure credential exchange
- Automatic user creation for new OAuth users
- Email validation from OAuth provider

**Security Benefits:**

- No password management for OAuth users
- Leverages Google's security infrastructure
- Reduces attack surface for password-based attacks

---

## Data Protection

### 1. Password Hashing

- **Algorithm:** Bcrypt with salt
- **Salt Rounds:** 10 (2^10 = 1,024 iterations)
- **Pre-save Hook:** Automatic hashing before database storage
- **No Plain Text:** Passwords never stored or transmitted in plain text

### 2. Sensitive Data Handling

**User Model Protection:**

```javascript
// Password excluded from queries
const user = await User.findById(id).select("-password");
```

**Response Sanitization:**

- Password field never included in API responses
- Only necessary user data sent to frontend
- MongoDB ObjectIds properly validated

### 3. Data Encryption in Transit

- HTTPS enforced in production
- TLS 1.2+ for all external communications
- Secure connection to MongoDB (MongoDB Atlas uses TLS by default)
- Azure Blob Storage uses HTTPS endpoints

---

## Network Security

### 1. CORS (Cross-Origin Resource Sharing)

**Implementation:** [`server/middleware/corsMiddleware.js`](server/middleware/corsMiddleware.js)

**Configuration:**

- Whitelist-based origin validation
- Credentials support enabled for authenticated requests
- Restricted HTTP methods: GET, POST, PUT, DELETE, PATCH
- Dynamic origin configuration via environment variables

**Default Allowed Origins:**

```javascript
[
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Alternative dev port
  "https://shuttersaga.shailavmalik.me", // Production domain
  "https://shuttersaga.vercel.app", // Vercel deployment
];
```

**Security Benefits:**

- Prevents unauthorized cross-origin requests
- Blocks malicious websites from accessing API
- Protects against CSRF attacks when combined with credentials

### 2. HTTPS/TLS

**Production Requirements:**

- All traffic encrypted with TLS 1.2+
- SSL certificates managed by hosting providers
- HTTP requests automatically redirected to HTTPS
- Azure Blob Storage accessed via HTTPS only

---

## API Security

### 1. Rate Limiting

**Implementation:** [`server/middleware/rateLimitMiddleware.js`](server/middleware/rateLimitMiddleware.js)

**General API Limiter:**

- **Production:** 100 requests per 15 minutes per IP
- **Development:** 1,000 requests per 15 minutes per IP
- **Window:** 15 minutes (900,000ms)
- **Response:** 429 Too Many Requests

**Authentication Limiter:**

- **Production:** 10 login attempts per 15 minutes per IP
- **Development:** 100 attempts per 15 minutes per IP
- **Routes Protected:** `/api/auth/login`, `/api/auth/register`, `/api/auth/google`

**Security Benefits:**

- Prevents brute force attacks on login endpoints
- Mitigates DoS/DDoS attacks
- Protects against credential stuffing
- Reduces API abuse and resource exhaustion

### 2. Request Size Limits

**Implementation:** [`server/middleware/securityMiddleware.js`](server/middleware/securityMiddleware.js)

**Limits:**

- JSON payloads: 1MB maximum
- URL-encoded bodies: 1MB maximum
- Photo uploads: 10MB per file (via Multer)
- Avatar uploads: 5MB per file

**Security Benefits:**

- Prevents memory exhaustion attacks
- Blocks oversized payload DoS attempts
- Reduces bandwidth consumption

---

## File Upload Security

### 1. File Type Validation

**Photo Uploads:**

```javascript
// Whitelist approach - only these types allowed
allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"];
```

**Avatar Uploads:**

```javascript
allowedTypes: ["image/jpeg", "image/png", "image/webp"];
```

**Validation Method:**

- MIME type verification via Multer
- File extension validation
- Rejected files return 400 Bad Request with clear error message

### 2. File Size Limits

**Implementation:** Multer middleware configuration

- **Photos:** 10MB maximum (`10 * 1024 * 1024` bytes)
- **Avatars:** 5MB maximum (`5 * 1024 * 1024` bytes)

**Security Benefits:**

- Prevents storage exhaustion
- Limits bandwidth consumption
- Blocks oversized file DoS attacks

### 3. Filename Sanitization

**Implementation:** [`server/utils/azureBlob.js`](server/utils/azureBlob.js)

**Process:**

```javascript
// Generates safe, unique blob names
username / timestamp - randomstring.extension;
```

**Features:**

- Username sanitization (removes special characters)
- Timestamp for uniqueness
- Random string for collision prevention
- Lowercase conversion
- Special character replacement with dashes
- Extension validation and preservation

**Security Benefits:**

- Prevents directory traversal attacks
- Avoids filename injection vulnerabilities
- Ensures unique file storage
- Prevents file overwrites

### 4. Memory-Based Upload

**Implementation:** `multer.memoryStorage()`

**Security Benefits:**

- Files stored in memory buffers, not on disk
- Prevents disk-based attacks
- Temporary storage automatically cleared
- No local file system pollution

---

## Storage Security

### 1. Azure Blob Storage

**Configuration:**

- Connection string stored in environment variables
- Container-level access control
- Public blob access (read-only for images)
- Write operations require authentication

**Access Control:**

```javascript
access: "blob"; // Public read for blobs, private list/write
```

**Security Features:**

- SAS (Shared Access Signatures) support available
- Azure Storage encryption at rest (Microsoft-managed keys)
- Geo-redundant storage options
- Built-in DDoS protection by Azure

### 2. User-Specific Directories

**Structure:**

```
container/
  └── username-sanitized/
      ├── 1234567890-abc123.jpg
      ├── 1234567891-def456.png
      └── ...
```

**Benefits:**

- Logical separation of user data
- Easy user data deletion (delete directory)
- Prevents accidental file overwrites
- Simplifies quota management per user

### 3. MongoDB Security

**Connection:**

- MongoDB Atlas with TLS encryption
- Connection string in environment variables
- Database authentication required
- Network access restricted by IP whitelist (Atlas configuration)

**Schema Validation:**

- Mongoose schema validation
- Required fields enforced
- Data type validation
- Field length constraints

---

## Input Validation

### 1. Schema-Level Validation

**User Model:**

```javascript
username: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  minlength: 3
}

email: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true  // Normalized to lowercase
}

password: {
  type: String,
  required: true,
  minlength: 6
}
```

**Photo Model:**

```javascript
title: {
  type: String,
  required: true,
  trim: true
}

blobUrl: {
  type: String,
  required: true
}

contentType: {
  type: String,
  required: true
}

size: {
  type: Number,
  required: true
}
```

### 2. String Sanitization

**Automatic Processing:**

- `trim: true` - Removes leading/trailing whitespace
- `lowercase: true` - Normalizes email addresses
- Type coercion prevention
- Special character handling in usernames

### 3. Request Validation

**Authentication Endpoints:**

- Required field validation
- Email format validation (via Mongoose)
- Password length validation
- Duplicate username/email checks

---

## Rate Limiting & DDoS Protection

### 1. Express Rate Limit

**Configuration:**

- IP-based rate limiting
- Sliding window algorithm
- Per-route and global limiters
- Environment-specific thresholds

**Implementation Locations:**

- Global: Applied to all API routes
- Auth-specific: Login, registration, OAuth endpoints

### 2. Request Throttling

**Strategy:**

- Production: Stricter limits (100 req/15min)
- Development: Relaxed limits (1000 req/15min)
- Auth endpoints: Aggressive limits (10 req/15min)

**Response Handling:**

- 429 status code
- User-friendly error messages
- Retry-After header included

---

## Security Headers

### 1. Helmet.js Integration

**Implementation:** [`server/middleware/securityMiddleware.js`](server/middleware/securityMiddleware.js)

**Headers Set by Helmet:**

**Content-Security-Policy (CSP):**

- Prevents XSS attacks
- Controls resource loading sources
- Blocks inline scripts (unless allowed)

**X-DNS-Prefetch-Control:**

- Controls browser DNS prefetching
- Reduces information leakage

**X-Frame-Options:**

- Prevents clickjacking attacks
- Blocks iframe embedding: `DENY` or `SAMEORIGIN`

**X-Content-Type-Options:**

- Prevents MIME sniffing: `nosniff`
- Forces correct content type interpretation

**Strict-Transport-Security (HSTS):**

- Enforces HTTPS connections
- Prevents protocol downgrade attacks
- Includes subdomains

**X-Download-Options:**

- Prevents file downloads from opening automatically
- IE-specific protection: `noopen`

**X-Permitted-Cross-Domain-Policies:**

- Controls Adobe Flash/PDF cross-domain policies
- Set to `none`

**Referrer-Policy:**

- Controls referrer information leakage
- Default: `no-referrer`

**Cross-Origin-Resource-Policy:**

- Set to `cross-origin` for Azure Blob Storage images
- Allows loading external resources

### 2. Custom Configuration

```javascript
helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
});
```

**Reason:** Allows images from Azure Blob Storage (different domain) to be displayed in the application.

---

## Environment & Configuration

### 1. Environment Variables

**Critical Secrets:**

```
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
MONGODB_URI=<mongodb-atlas-connection-string>
AZURE_STORAGE_CONNECTION_STRING=<azure-connection-string>
AZURE_CONTAINER_NAME=photos
GOOGLE_CLIENT_ID=<google-oauth-client-id>
ALLOWED_ORIGINS=<comma-separated-origins>
NODE_ENV=production
```

### 2. Secret Management

**Best Practices:**

- Never commit secrets to version control
- Use `.env` files locally (excluded via `.gitignore`)
- Use platform-specific secret managers in production:
  - Vercel: Environment Variables
  - Render: Environment Variables
  - Azure: Key Vault (optional)

### 3. Configuration Validation

**Startup Checks:**

- Environment variable presence validation
- Connection string format validation
- Azure container creation/verification
- MongoDB connection verification

---

## Logging & Monitoring

### 1. HTTP Request Logging

**Implementation:** Morgan middleware

**Log Formats:**

- **Production:** `combined` (Apache-style)
  ```
  :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
  ```
- **Development:** `dev` (colored, concise)
  ```
  :method :url :status :response-time ms - :res[content-length]
  ```

**Logged Information:**

- HTTP method (GET, POST, etc.)
- Request URL
- Response status code
- Response time
- IP address (production)
- User agent (production)

### 2. Error Logging

**Implementation:** [`server/handlers/errorHandler.js`](server/handlers/errorHandler.js)

**Features:**

- Console error logging
- Stack traces in development
- Generic error messages in production
- Error categorization by status code

### 3. Security Event Logging

**Logged Events:**

- Failed authentication attempts
- Invalid JWT tokens
- Rate limit violations
- File upload rejections
- CORS policy violations

---

## Threat Model

### 1. Identified Threats

#### High Priority

**SQL Injection**

- **Risk:** Low (using MongoDB, not SQL)
- **Mitigation:** Mongoose ODM with parameterized queries

**XSS (Cross-Site Scripting)**

- **Risk:** Medium
- **Mitigation:** React auto-escaping, CSP headers, input sanitization

**CSRF (Cross-Site Request Forgery)**

- **Risk:** Low
- **Mitigation:** JWT tokens (not cookies), CORS policies

**Brute Force Authentication**

- **Risk:** Medium
- **Mitigation:** Rate limiting (10 attempts/15min), password hashing

**Credential Stuffing**

- **Risk:** Medium
- **Mitigation:** Rate limiting, bcrypt password hashing

**DDoS Attacks**

- **Risk:** Medium
- **Mitigation:** Rate limiting, request size limits, cloud provider protection

#### Medium Priority

**Session Hijacking**

- **Risk:** Low
- **Mitigation:** JWT expiration, HTTPS only

**Man-in-the-Middle (MITM)**

- **Risk:** Low
- **Mitigation:** HTTPS/TLS enforcement

**File Upload Vulnerabilities**

- **Risk:** Medium
- **Mitigation:** Type validation, size limits, memory storage, filename sanitization

**Path Traversal**

- **Risk:** Low
- **Mitigation:** Filename sanitization, Azure Blob abstraction

**Information Disclosure**

- **Risk:** Low
- **Mitigation:** Password exclusion, error message sanitization, production logging

#### Low Priority

**NoSQL Injection**

- **Risk:** Low
- **Mitigation:** Mongoose validation, input sanitization

**Clickjacking**

- **Risk:** Low
- **Mitigation:** X-Frame-Options header

**MIME Sniffing**

- **Risk:** Low
- **Mitigation:** X-Content-Type-Options: nosniff

### 2. Attack Surface

**External Endpoints:**

- `/api/auth/*` - Authentication endpoints
- `/api/photos/*` - Photo management endpoints
- Azure Blob Storage URLs (read-only public access)

**Internal Services:**

- MongoDB Atlas (TLS, IP restricted)
- Azure Blob Storage (authenticated writes)

---

## Security Best Practices

### 1. Development

- Always use environment variables for secrets
- Never log sensitive data (passwords, tokens)
- Validate all user inputs
- Use parameterized queries
- Keep dependencies updated
- Run security audits: `npm audit`

### 2. Deployment

- Use HTTPS in production
- Configure CSP headers properly
- Set secure CORS policies
- Enable rate limiting
- Use production-grade secret management
- Configure proper logging

### 3. Code Review

- Review authentication logic carefully
- Check for sensitive data exposure
- Validate file upload implementations
- Ensure proper error handling
- Verify input validation

### 4. Dependency Management

**Regular Updates:**

```bash
npm audit
npm audit fix
npm outdated
```

**Known Vulnerabilities:**

- Monitor GitHub Dependabot alerts
- Subscribe to security advisories
- Update dependencies monthly

---

## Incident Response

### 1. Security Incident Handling

**Process:**

1. **Detect:** Monitor logs, error rates, unusual patterns
2. **Contain:** Rate limiting, IP blocking, service isolation
3. **Investigate:** Log analysis, request tracing, user reports
4. **Remediate:** Patch vulnerabilities, update configurations
5. **Document:** Incident report, lessons learned
6. **Communicate:** User notifications if data breach

### 2. Data Breach Response

**Immediate Actions:**

1. Isolate affected systems
2. Preserve evidence (logs, backups)
3. Assess scope of breach
4. Notify users if personal data compromised
5. Reset compromised credentials
6. Review and patch vulnerabilities

### 3. Emergency Contacts

- **Development Team:** [Your contact info]
- **Cloud Providers:**
  - Azure Support
  - MongoDB Atlas Support
  - Vercel Support

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets moved to environment variables
- [ ] HTTPS enabled and enforced
- [ ] Rate limiting configured
- [ ] CORS policies set correctly
- [ ] File upload validation working
- [ ] Security headers verified
- [ ] Error messages sanitized (no stack traces)
- [ ] Logging enabled and working
- [ ] Dependencies updated (`npm audit`)
- [ ] MongoDB access restricted
- [ ] Azure Blob Storage permissions set correctly

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check rate limit effectiveness
- [ ] Verify HTTPS certificate
- [ ] Test authentication flows
- [ ] Review access logs
- [ ] Monitor performance metrics
- [ ] Set up alerting for anomalies

### Monthly Maintenance

- [ ] Update dependencies
- [ ] Review security logs
- [ ] Rotate secrets/keys (if applicable)
- [ ] Check for CVEs in dependencies
- [ ] Review user access patterns
- [ ] Test backup and recovery

---

## Compliance & Standards

### OWASP Top 10 Coverage

1. **Broken Access Control:** ✅ JWT authentication, route protection
2. **Cryptographic Failures:** ✅ Bcrypt hashing, HTTPS, TLS
3. **Injection:** ✅ Mongoose ODM, input validation
4. **Insecure Design:** ✅ Defense in depth, least privilege
5. **Security Misconfiguration:** ✅ Helmet headers, secure defaults
6. **Vulnerable Components:** ⚠️ Regular updates required
7. **Authentication Failures:** ✅ Rate limiting, password hashing
8. **Software and Data Integrity:** ✅ Environment validation
9. **Logging & Monitoring Failures:** ✅ Morgan, error handlers
10. **Server-Side Request Forgery:** ✅ No SSRF vectors present

---

## Additional Resources

### Documentation

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Azure Blob Storage Security](https://docs.microsoft.com/en-us/azure/storage/blobs/security-recommendations)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Tools

- `npm audit` - Dependency vulnerability scanning
- [Snyk](https://snyk.io/) - Continuous security monitoring
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing
- [Burp Suite](https://portswigger.net/burp) - Web vulnerability scanner

---

## Version History

| Version | Date            | Changes                        |
| ------- | --------------- | ------------------------------ |
| 1.0     | January 8, 2026 | Initial security documentation |

---

## Contact

For security concerns or to report vulnerabilities:

- **Email:** [your-email@example.com]
- **Response Time:** Within 48 hours
- **Responsible Disclosure:** Please allow 90 days before public disclosure

---

_This document is maintained by the ShutterSaga development team and should be reviewed quarterly or after significant security updates._
