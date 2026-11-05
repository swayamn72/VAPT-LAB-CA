# SecureBank Labs // VAPT Continuous Assessment Project

An educational, containerized Vulnerable Web Application designed to demonstrate the full **Vulnerability Assessment and Penetration Testing (VAPT)** lifecycle: threat assessment, controlled exploitation, documentation, and source code remediation.

Built for the **VAPT Laboratory Continuous Assessment (CA)** (15 Marks Implementation & Documentation + 10 Marks Video Screencast Presentation).

---

## 🚀 Key Features

* **Dual-State Engine (Vulnerable vs. Secure):** Instant toggle between Vulnerable Mode (for demonstrating attacks) and Remediated Secure Mode (for demonstrating code defense).
* **5 Target Vulnerabilities (OWASP Top 10:2021):**
  1. **SQL Injection (CWE-89)** — Parameterized Queries Defense
  2. **Insecure Direct Object Reference (CWE-639)** — Session-Tied Authorization Checks
  3. **Cross-Site Scripting (CWE-79)** — HTML Entity Encoding & Content Security Policy
  4. **Broken Auth & Password Exposure (CWE-256 / CWE-307)** — Salted Bcrypt & Rate Limiting Lockout
  5. **Security Misconfiguration & Stack Trace Leak (CWE-200)** — Hardened Error Handlers & Disabled Debug Endpoints
* **Cybersecurity Interactive UI:** Live test stations, built-in real-time HTTP inspector console, CVSS v3.1 calculator, and side-by-side code diffs.
* **Ready-to-Submit Academic Deliverables:**
  - `docs/VAPT_COMPREHENSIVE_LAB_REPORT.md` (Formal 15-mark submission report)
  - `docs/SCREENCAST_PRESENTATION_SCRIPT.md` (Word-for-word 10-mark screencast script for up to 3 students)
  - `docs/LAB_EXECUTION_GUIDE.md` (Kali Linux, Burp Suite, and Docker instructions)

---

## 🛠️ Quick Start

### 1. Run Directly with Node.js
```bash
# Install dependencies (only once)
npm install

# Start the server
npm start
```
Open **[http://127.0.0.1:3000](http://127.0.0.1:3000)** in your browser.

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

### 3. Run Automated Verification Test Suite
```bash
npm test
```
Validates that all 5 vulnerabilities are active in Vulnerable Mode and all 5 are completely mitigated in Secure Mode.

---

## 👥 Suggested Group Allocation (Max 3 Students)

* **Student 1:** Project setup, architecture, and Vulnerability 1 (SQL Injection).
* **Student 2:** Vulnerability 2 (IDOR) and Vulnerability 3 (XSS).
* **Student 3:** Vulnerability 4 (Broken Auth), Vulnerability 5 (Misconfiguration), and Report compilation.

Refer to `docs/SCREENCAST_PRESENTATION_SCRIPT.md` for exact speaking cues and timestamps.
