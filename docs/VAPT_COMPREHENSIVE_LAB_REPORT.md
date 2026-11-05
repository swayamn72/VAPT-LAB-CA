# VULNERABILITY ASSESSMENT & PENETRATION TESTING (VAPT) COMPREHENSIVE LAB REPORT

**Target Application:** SecureBank Labs Financial Portal  
**Target Environment:** Isolated Laboratory Environment (`http://127.0.0.1:3000`)  
**Assessment Standard:** OWASP Top 10 (2021) / NIST SP 800-115 / PTES  
**Testing Methodology:** Gray-Box Penetration Testing (Black-Box DAST + White-Box SAST)  
**Date of Assessment:** October 2026  
**Document Classification:** Confidential — Academic Continuous Assessment (CA)  

---

### Student Group Members (Max. 3 Students)
* **Student 1 (Lead Security Analyst):** [Name & Registration / Roll Number]
* **Student 2 (Exploitation & DAST Specialist):** [Name & Registration / Roll Number]
* **Student 3 (Remediation & Secure Code Engineer):** [Name & Registration / Roll Number]

---

## 1. Executive Summary

During October 2026, an authorized Vulnerability Assessment and Penetration Testing (VAPT) exercise was conducted against the **SecureBank Labs** web application in an isolated, private sandbox environment. The primary objective of this assessment was to identify security vulnerabilities, evaluate their business and technical impact through controlled Proof-of-Concept (PoC) verifications, formulate code-level remediations, and validate the effectiveness of implemented patches.

### Key Assessment Findings Overview
A total of **five (5) significant security vulnerabilities** were identified, thoroughly analyzed, and remediated:

* **1 Critical Severity Finding:** SQL Injection (CWE-89, CVSS 9.8) enabling complete database extraction and administrative authentication bypass.
* **3 High Severity Findings:** 
  * Insecure Direct Object Reference (CWE-639, CVSS 8.5) resulting in unauthorized horizontal and vertical access to customer and executive financial statements.
  * Insecure Credential Storage & Missing Rate Limiting (CWE-256 / CWE-307, CVSS 7.5) exposing plaintext/MD5 passwords and allowing unrestricted automated brute-force attacks.
  * Stored and Reflected Cross-Site Scripting (CWE-79, CVSS 7.2) allowing client-side session hijacking and DOM manipulation.
* **1 Medium Severity Finding:** Security Misconfiguration & Verbose Stack Trace Information Disclosure (CWE-200 / CWE-16, CVSS 6.5).

Following the identification phase, each vulnerability was remediated in the codebase using industry-standard secure coding practices. A comprehensive re-test demonstrated **100% remediation success**, reducing the overall residual risk to an acceptable baseline.

---

## 2. Assessment Scope & Lab Environment Architecture

### 2.1 Scope of Assessment
Testing was strictly confined to the authorized, locally hosted SecureBank instance:
* **Target Domain / IP:** `http://127.0.0.1:3000`
* **Underlying Runtimes:** Node.js v22.x, SQLite 3.46 (Embedded via `node:sqlite`), Express.js 4.x
* **Network Topology:** Isolated loopback adapter and private Docker bridge network (`vapt_isolated_net`), ensuring zero external network exposure.
* **Rules of Engagement:** Non-destructive testing only. Denial-of-Service (DoS) and physical attacks were strictly out of scope.

### 2.2 Tooling Utilized
* **Kali Linux (v2024.x / Rolling):** Penetration testing distribution hosting toolsets.
* **Burp Suite Community Edition (v2024.x):** Intercepting proxy, HTTP repeater, and request manipulation.
* **cURL & Python Requests:** Scripted HTTP verification and header analysis.
* **Mozilla Firefox Developer Edition:** Client-side DOM inspection and cookie audit.
* **Visual Studio Code / Antigravity IDE:** Source code review (SAST) and patch implementation.

---

## 3. Assessment Methodology

The engagement adhered to the **Penetration Testing Execution Standard (PTES)** and **OWASP Web Security Testing Guide (WSTG)**:

```
[1. Scoping & Pre-Engagement] ──> [2. Reconnaissance & Crawling] ──> [3. Vulnerability Analysis]
                                                                              │
[6. Re-Testing & Validation] <── [5. Secure Remediation] <── [4. Controlled PoC Exploitation]
```

1. **Reconnaissance & Mapping:** Discovery of web endpoints, API structures, parameter formats, and server headers.
2. **Vulnerability Analysis:** Hybrid static code review (SAST) and dynamic traffic interception (DAST) to detect structural flaws.
3. **Controlled Exploitation:** Formulating minimal, reliable Proof-of-Concepts to establish the severity and feasibility of unauthorized actions.
4. **Remediation Engineering:** Writing defense-in-depth secure code (parameterized queries, session-tied authorization checks, context-aware encoding, salted adaptive hashing, and security headers).
5. **Post-Remediation Verification:** Repeating identical attack payloads to confirm total mitigation without causing functional regressions.

---

## 4. Vulnerability Summary Matrix

| Finding ID | Vulnerability Title | CWE Identifier | OWASP Top 10 (2021) | CVSS v3.1 Vector String | Base Score | Severity | Remediation Status |
|---|---|---|---|---|:---:|:---:|:---:|
| **SEC-01** | SQL Injection in Customer Search | CWE-89 | A03:2021 - Injection | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` | **9.8** | Critical | **VERIFIED RESOLVED** |
| **SEC-02** | Insecure Direct Object Reference (IDOR) | CWE-639 | A01:2021 - Broken Access Control | `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` | **8.5** | High | **VERIFIED RESOLVED** |
| **SEC-03** | Stored Cross-Site Scripting (XSS) | CWE-79 | A03:2021 - Injection | `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N` | **7.2** | High | **VERIFIED RESOLVED** |
| **SEC-04** | Insecure Password Storage & Brute Force | CWE-256 / CWE-307 | A07:2021 - Auth Failures | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N` | **7.5** | High | **VERIFIED RESOLVED** |
| **SEC-05** | Debug Disclosure & Stack Trace Leak | CWE-200 / CWE-16 | A05:2021 - Security Misconfiguration | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` | **6.5** | Medium | **VERIFIED RESOLVED** |

---

## 5. Detailed Technical Findings & Remediation

---

### Finding 1 [SEC-01]: SQL Injection in Customer Search (CWE-89)

#### 1.1 Technical Summary
* **Affected Endpoint:** `GET /api/users/search?q={USER_INPUT}`
* **Vulnerability Class:** Common Weakness Enumeration 89 (SQL Injection)
* **OWASP Classification:** A03:2021 – Injection
* **CVSS v3.1 Score:** **9.8 (Critical)** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`

#### 1.2 Vulnerability Description & Technical Root Cause
The user search functionality takes untrusted input from the `q` query string parameter and interpolates it directly into an SQLite database query via JavaScript string template literals. 

**Vulnerable Source Code (`routes/users.js`):**
```javascript
// Flawed direct string interpolation
const rawSql = `SELECT id, username, email, role, balance 
                FROM users 
                WHERE username LIKE '%${query}%' OR email = '${query}'`;
const results = db.prepare(rawSql).all();
```
Because no parameterization or character escaping is applied, meta-characters such as `'` break out of the string literal, allowing attackers to inject arbitrary SQL statements.

#### 1.3 Step-by-Step Proof-of-Concept (PoC)
1. **Burp Suite / cURL Request:**
```http
GET /api/users/search?q='%20OR%20'1'='1 HTTP/1.1
Host: 127.0.0.1:3000
User-Agent: Mozilla/5.0 (Kali Linux)
```

2. **Server Response (Vulnerable Mode):**
```json
{
  "status": "success",
  "mode": "VULNERABLE (Unsanitized Concatenation)",
  "vulnerability": "CWE-89: SQL Injection",
  "executedSql": "SELECT id, username, email, role, balance FROM users WHERE username LIKE '%' OR '1'='1%' OR email = '' OR '1'='1'",
  "count": 4,
  "data": [
    { "id": 1, "username": "admin", "email": "admin@secbank.lab", "role": "admin", "balance": 250000 },
    { "id": 2, "username": "alice", "email": "alice@customer.lab", "role": "customer", "balance": 14250.75 },
    { "id": 3, "username": "bob", "email": "bob@customer.lab", "role": "customer", "balance": 890.2 },
    { "id": 4, "username": "charlie", "email": "charlie@audit.lab", "role": "auditor", "balance": 5400 }
  ]
}
```
**Impact:** Complete extraction of the user database, unauthorized enumeration of administrative balances, and potential remote database manipulation.

#### 1.4 Secure Remediation
Replace raw string concatenation with **parameterized queries** utilizing bound parameters (`?`). The SQLite database engine compiles the query structure prior to binding the input, treating all user input purely as literal data.

**Remediated Code (`routes/users.js`):**
```javascript
// Parameterized query using bound placeholders
const sanitizedSql = `SELECT id, username, email, role, balance 
                      FROM users 
                      WHERE username LIKE ? OR email = ?`;
const searchPattern = `%${query}%`;
const results = db.prepare(sanitizedSql).all(searchPattern, query);
```

#### 1.5 Verification of Remediation
When submitting the same payload (`' OR '1'='1`) against the remediated endpoint, the database searches strictly for the literal string `%' OR '1'='1%`, returning zero matches without syntax errors:
```json
{
  "status": "success",
  "mode": "SECURE (Parameterized Statement)",
  "count": 0,
  "data": []
}
```

---

### Finding 2 [SEC-02]: Broken Object-Level Authorization / IDOR (CWE-639)

#### 2.1 Technical Summary
* **Affected Endpoint:** `GET /api/statements/:id`
* **Vulnerability Class:** CWE-639 (Insecure Direct Object References)
* **OWASP Classification:** A01:2021 – Broken Access Control
* **CVSS v3.1 Score:** **8.5 (High)** — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`

#### 2.2 Technical Root Cause
The financial statement endpoint fetches transaction records exclusively by looking up the primary key supplied in the URL parameter (`req.params.id`). The application fails to verify whether the requesting user owns the requested statement or possesses administrative authorization.

**Vulnerable Source Code (`routes/statements.js`):**
```javascript
// Missing ownership authorization validation
const statement = db.prepare(`SELECT * FROM statements WHERE id = ?`).get(req.params.id);
return res.json({ data: statement });
```

#### 2.3 Proof-of-Concept (PoC)
1. User **Alice** (Customer, User ID 2) logs in.
2. Alice navigates to Statement ID 1 (which belongs to executive **Admin**, User ID 1).
3. **HTTP Request:**
```http
GET /api/statements/1 HTTP/1.1
Host: 127.0.0.1:3000
x-user-id: 2
```
4. **HTTP Response:**
```json
{
  "status": "success",
  "mode": "VULNERABLE (Missing Object-Level Authorization)",
  "vulnerability": "CWE-639: Insecure Direct Object References (IDOR)",
  "authenticatedAs": { "id": 2, "username": "alice", "role": "customer" },
  "recordOwnerId": 1,
  "authorizationBypassed": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "reference_no": "TXN-ADM-0091",
    "amount": 120000.00,
    "description": "Executive Dividend Disbursement",
    "confidential_note": "RESTRICTED: Board approval ref #EXEC-912"
  }
}
```
**Impact:** Total breach of financial confidentiality. Any low-privileged customer can iterate through all financial records across the entire institution.

#### 2.4 Secure Remediation
Implement strict object-level access controls binding data queries to the authenticated session context. Non-administrative users are strictly restricted to records where `user_id = session.user.id`.

**Remediated Code (`routes/statements.js`):**
```javascript
let statement;
if (currentUser.role === 'admin') {
  statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(statementId);
} else {
  // Enforce session ownership
  statement = db.prepare('SELECT * FROM statements WHERE id = ? AND user_id = ?')
                .get(statementId, currentUser.id);
}

if (!statement) {
  return res.status(403).json({
    status: 'error',
    message: 'Access Denied: You do not have permission to view this financial document.'
  });
}
```

#### 2.5 Verification of Remediation
Re-attempting the request as Alice (User ID 2) for Statement ID 1 yields:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "status": "error",
  "mode": "SECURE (Enforced Object Authorization)",
  "message": "Access Denied: You do not have permission to view or manipulate this financial document."
}
```

---

### Finding 3 [SEC-03]: Stored Cross-Site Scripting (XSS) in Feedback Feed (CWE-79)

#### 3.1 Technical Summary
* **Affected Endpoint:** `POST /api/feedback` and `GET /api/feedback`
* **Vulnerability Class:** CWE-79 (Improper Neutralization of Input During Web Page Generation)
* **OWASP Classification:** A03:2021 – Injection
* **CVSS v3.1 Score:** **7.2 (High)** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`

#### 3.2 Technical Root Cause
The customer support feedback mechanism accepts raw strings from clients and inserts them into the database without encoding. The front-end renders these messages directly using `.innerHTML`.

**Vulnerable Source Code:**
* Backend (`routes/feedback.js`):
```javascript
db.prepare('INSERT INTO feedback (author, message) VALUES (?, ?)').run(author, message);
```
* Frontend (`public/js/app.js`):
```javascript
// Dangerous direct innerHTML assignment
container.innerHTML = `<div>${feedback.message}</div>`;
```

#### 3.3 Proof-of-Concept (PoC)
1. **Submission Request:**
```http
POST /api/feedback HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json

{
  "author": "attacker",
  "category": "Support",
  "message": "<img src=x onerror=\"alert('XSS-Stored-Vulnerability-Verified');\">"
}
```
2. When any customer or bank officer opens the Support Feed, the browser executes the injected JavaScript within their session context.  
**Impact:** Session token theft, arbitrary account actions, and UI phishing / defacement.

#### 3.4 Secure Remediation
Apply a two-layer defense:
1. **Context-Aware HTML Entity Encoding** on input/output (converting `<`, `>`, `&`, `"`, `'` to safe HTML entities).
2. **Safe DOM Insertion** via `textContent` rather than `innerHTML`.
3. **Content Security Policy (CSP)** header to disallow inline script execution:
   `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';`

**Remediated Code:**
```javascript
function sanitizeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
}

const safeMessage = sanitizeHtml(req.body.message);
db.prepare('INSERT INTO feedback (author, message) VALUES (?, ?)').run(safeAuthor, safeMessage);
```

#### 3.5 Verification of Remediation
The payload `<img src=x onerror=alert(1)>` is stored as `&lt;img src=x onerror=alert(1)&gt;` and rendered as inert visible text on the page without script execution.

---

### Finding 4 [SEC-04]: Broken Authentication, Insecure Password Hashing & Sensitive Data Leak (CWE-256 / CWE-307)

#### 4.1 Technical Summary
* **Affected Endpoint:** `POST /api/auth/login` and `GET /api/auth/profile`
* **Vulnerability Class:** CWE-256 (Plaintext/Weak Password Storage) & CWE-307 (Improper Restriction of Excessive Authentication Attempts)
* **OWASP Classification:** A07:2021 – Identification and Authentication Failures
* **CVSS v3.1 Score:** **7.5 (High)** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N`

#### 4.2 Technical Root Cause
1. Passwords are saved and verified using unsalted MD5 hashes (`crypto.createHash('md5')`).
2. The login route implements no throttling, IP rate limiting, or account lockout.
3. Upon successful login or profile query, the database model dumps the complete table row, leaking `password_md5`, `password_plain`, and confidential PII `national_id`.

#### 4.3 Proof-of-Concept (PoC)
1. **Authentication Request:**
```http
POST /api/auth/login HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json

{
  "username": "alice",
  "password": "AlicePassword123"
}
```
2. **Exposed Server Response:**
```json
{
  "status": "success",
  "mode": "VULNERABLE (Sensitive Data Exposure)",
  "sessionToken": "INSECURE-TOKEN-USER-2-1729758200112",
  "userDataLeaked": {
    "id": 2,
    "username": "alice",
    "password_plain": "AlicePassword123",
    "password_md5": "b3e344e21a2db12f671bb57234c9359a",
    "national_id": "SSN-089-22-1092",
    "balance": 14250.75
  }
}
```
**Impact:** Password cracking in seconds using rainbow tables, automated credential stuffing, and severe identity theft liability.

#### 4.4 Secure Remediation
1. Enforce slow, salted key derivation using **bcrypt** (`bcrypt.compareSync()`).
2. Implement IP and account-based rate limiting with a 60-second backoff lockout after 5 consecutive failures.
3. Whitelist public fields in API responses, stripping credentials and SSNs.

**Remediated Code (`routes/auth.js`):**
```javascript
// Rate limiting lockout check
if (Date.now() < attempts.lockedUntil) {
  return res.status(429).json({ message: 'Account locked due to excessive failed attempts.' });
}

// Bcrypt verification
const isValid = bcrypt.compareSync(password, user.password_bcrypt);
if (!isValid) {
  registerFailedAttempt();
  return res.status(401).json({ message: 'Invalid credentials.' });
}

// Explicit field projection
return res.json({
  user: { id: user.id, username: user.username, email: user.email, role: user.role }
});
```

#### 4.5 Verification of Remediation
* 5 rapid incorrect login attempts trigger `HTTP 429 Too Many Requests`.
* Successful login returns strictly safe fields: `{ "id": 2, "username": "alice", "email": "alice@customer.lab", "role": "customer" }`.

---

### Finding 5 [SEC-05]: Security Misconfiguration & Verbose Stack Trace Information Disclosure (CWE-200 / CWE-16)

#### 5.1 Technical Summary
* **Affected Endpoint:** `GET /api/system/debug` and `GET /api/system/crash-test`
* **Vulnerability Class:** CWE-200 (Information Exposure) & CWE-209 (Error Message Stack Trace Leak)
* **OWASP Classification:** A05:2021 – Security Misconfiguration
* **CVSS v3.1 Score:** **6.5 (Medium)** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`

#### 5.2 Technical Root Cause
Diagnostic routes were left enabled in production, leaking the server operating system, Node.js version, working directory paths, database maintenance tokens, and system secrets. Unhandled server exceptions exposed complete code call stacks to clients.

#### 5.3 Proof-of-Concept (PoC)
1. Querying `GET /api/system/debug` exposed:
   * Node version: `v22.20.0`, Platform: `win32`, Working Directory: `C:\Users\...\VAPT LAB CA`
   * Database Secrets: `MAINTENANCE_KEY: SEC-MAINT-TOKEN-9941-XJ8`, `INTERNAL_API_SECRET: shhh_super_secret_...`
2. Querying `GET /api/system/crash-test` returned:
   * Internal file paths and line numbers: `Connection pool exhausted at line 144 of /server/database/pool.js`

#### 5.4 Secure Remediation
1. Disable diagnostic and debug endpoints in production environments (returning `404 Not Found`).
2. Intercept exceptions with a centralized error handler that logs detailed traces to private server logs and returns an opaque tracking ID to users.
3. Remove the `X-Powered-By: Express` fingerprint header and add defensive security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

**Remediated Code (`routes/system.js` & `server.js`):**
```javascript
// Disabled debug route in production
router.get('/debug', (req, res) => {
  return res.status(404).json({ error: 'Endpoint not found.' });
});

// Centralized error handler returning opaque Incident ID
const incidentId = 'INC-' + crypto.randomUUID().substring(0, 8);
console.error(`[INTERNAL ERROR] [${incidentId}]`, err.stack);
return res.status(500).json({ error: 'An unexpected internal error occurred.', incidentId });
```

---

## 6. Strategic Security Recommendations & Hardening Checklist

To maintain defense-in-depth across the SDLC, the following technical controls are recommended:

1. **Static Analysis & Dependency Audits:** Integrate `npm audit`, Snyk, or SonarQube in CI/CD pipelines to detect vulnerable third-party modules.
2. **Automated Dynamic Testing:** Schedule regular automated DAST scans using OWASP ZAP within staging environments.
3. **Principle of Least Privilege:** Ensure database connection accounts possess only minimum necessary DML privileges (`SELECT`, `INSERT`, `UPDATE`), disallowing `DROP` or administrative execution.
4. **Mandatory Security Headers:** Enforce `Helmet.js` middleware across all Node.js services to ensure consistent application of HSTS, CSP, and Anti-Clickjacking headers.
5. **Session & Token Management:** Migrate from custom session identifiers to signed, short-lived JWT tokens or cryptographic sessions stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.

---

## 7. Conclusion

The comprehensive VAPT exercise successfully assessed, exploited, documented, and remediated five fundamental web application vulnerabilities. Through the implementation of parameterized queries, object authorization verification, output encoding, bcrypt key stretching, and environment hardening, the SecureBank Labs platform was transitioned from a highly exploitable prototype to a robust, enterprise-hardened application.

---
*Report compiled and certified for Academic VAPT Laboratory Continuous Assessment.*
