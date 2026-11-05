# VIDEO PRESENTATION & SCREENCAST DEMONSTRATION SCRIPT
## VAPT Laboratory Continuous Assessment (10 Marks Deliverable)

* **Project Title:** Design, Assessment, Exploitation, and Remediation of a Vulnerable Financial Portal (SecureBank Labs)
* **Target Environment:** `http://127.0.0.1:3000`
* **Target Video Length:** 7:30 to 9:00 Minutes
* **Team Structure:** Up to 3 Students

---

### Team Roles & Responsibility Allocation Table

| Speaker | Role | Presentation Segment | Time Stamp | Primary Deliverable Focus |
|---|---|---|---|---|
| **Student 1** | Team Lead & Threat Modeler | Project Intro, Lab Architecture, & Finding 1 (SQL Injection) | `0:00 - 2:45` | Architecture, Scope, SQLi Exploitation & Parameterization |
| **Student 2** | DAST & Web Exploitation Specialist | Finding 2 (IDOR) & Finding 3 (Cross-Site Scripting) | `2:45 - 5:30` | Object Authorization Breach & DOM/Stored XSS Defenses |
| **Student 3** | Secure Code & Compliance Engineer | Finding 4 (Auth/PII Leak), Finding 5 (Misconfig), & Summary | `5:30 - 8:15` | Password Hashing, Rate-Limiting, Error Sanitization & Conclusion |

---

## Detailed Scene-by-Scene Script & Recording Directives

---

### SCENE 1: Introduction, Scope & Environment Setup (Student 1)
* **Timestamp:** `0:00 - 1:15`
* **On-Screen Display:** 
  1. Title slide showing Student Names, IDs, Course Code, and Project Title.
  2. Switch screen to the SecureBank Labs web interface (`http://127.0.0.1:3000`) with the top banner showing `VULNERABLE / LAB MODE`.
  3. Briefly show terminal running `node server.js` or `docker-compose up`.

* **Spoken Script (Student 1):**
> *"Respected Evaluator and peers, welcome to our VAPT Laboratory Continuous Assessment demonstration. Our team consists of [Student 1 Name], [Student 2 Name], and [Student 3 Name].*
>
> *For this assessment, we designed, containerized, and configured a custom financial web application called SecureBank Labs. The application is hosted strictly within an isolated, authorized laboratory environment on our local loopback interface at port 3000.*
>
> *Our objective was to execute an end-to-end VAPT lifecycle: discovering vulnerabilities mapped to the OWASP Top 10, executing controlled Proof-of-Concept exploits using Kali Linux and Burp Suite, documenting the root causes, and implementing verified, industry-standard code remediations.*
>
> *Notice our application includes an interactive state toggle in the top navigation: we start in 'Vulnerable Mode' to demonstrate the flaws, and will switch to 'Secure Mode' to prove that our remediations effectively neutralize every attack vector."*

---

### SCENE 2: Finding 1 — SQL Injection (Student 1)
* **Timestamp:** `1:15 - 2:45`
* **On-Screen Display:**
  1. Click **Station 1: SQL Injection (SQLi)** on the web portal.
  2. In the Customer Search input, show a regular query (`alice`) returning 1 record.
  3. Enter the PoC payload: `' OR '1'='1`.
  4. Click **Execute Search Request**. Show the inspector terminal displaying the raw query and all 4 user records extracted, including the Administrator account and confidential balances.
  5. Show the source code file `routes/users.js` highlighting the string concatenation bug.
  6. Flip the toggle switch to **🛡️ Secure Mode**.
  7. Re-run `' OR '1'='1'`. Show that zero unauthorized records are returned and the query now uses bound parameters `?`.

* **Spoken Script (Student 1):**
> *"I will now demonstrate our first finding, cataloged as SEC-01: SQL Injection, classified under CWE-89 and OWASP Category A03:2021 with a Critical CVSS score of 9.8.*
>
> *In `routes/users.js`, the search functionality was constructed using raw string interpolation with backticks, directly inserting untrusted user input into the SQL statement. When an attacker inputs single-quote OR one equals one, the syntax of the query is altered, forcing the boolean evaluation to always resolve to TRUE.*
>
> *As you can see on screen, executing this payload immediately dumps the entire customer database, including the executive Administrator account and account balances.*
>
> *To remediate this, we updated the query engine to use prepared statements with bound parameters (`?`). Let us toggle to Secure Mode right now and execute the exact same payload. As demonstrated in the live inspector, the database engine now treats our input strictly as literal data string, completely eliminating the SQL injection vulnerability. I will now hand over to [Student 2] to demonstrate IDOR and XSS."*

---

### SCENE 3: Finding 2 — Insecure Direct Object References / IDOR (Student 2)
* **Timestamp:** `2:45 - 4:10`
* **On-Screen Display:**
  1. Switch back to **⚠️ Vulnerable Mode**.
  2. Navigate to **Station 2: Broken Object Authorization (IDOR)**.
  3. Select user **Alice (Customer, ID: 2)** in the dropdown.
  4. Alice's legitimate statements are ID 2 and 3. Enter target statement ID `1` (which belongs to Admin).
  5. Click **Fetch Statement Document**.
  6. Point out the red breach alert: Alice successfully accessed Admin's confidential $120,000 dividend payout.
  7. Toggle to **🛡️ Secure Mode** and click the button again. Show the `HTTP 403 Forbidden` response.

* **Spoken Script (Student 2):**
> *"Thank you, [Student 1]. I will be covering our second and third vulnerabilities.*
>
> *Our second finding is an Insecure Direct Object Reference, or IDOR, logged under CWE-639 and OWASP Category A01: Broken Access Control, rated High severity with a CVSS score of 8.5.*
>
> *In a banking application, sensitive transaction statements must only be viewable by their rightful owner. However, in our vulnerable implementation, the endpoint queries records solely based on the numeric ID passed in the URL, with zero verification of the requester's session identity.*
>
> *Here, I am authenticated as Alice, a regular customer with User ID 2. By simply requesting Statement ID 1, which belongs to the Executive Admin, Alice is able to view a private $120,000 dividend disbursement record.*
>
> *To remediate this flaw, we updated `routes/statements.js` to enforce object-level authorization by appending `AND user_id = currentUser.id` to the SQL query. Let's switch to Secure Mode: when Alice now requests Statement ID 1, the server immediately denies access with an HTTP 403 Forbidden status, proving horizontal privilege escalation is blocked."*

---

### SCENE 4: Finding 3 — Cross-Site Scripting / XSS (Student 2)
* **Timestamp:** `4:10 - 5:30`
* **On-Screen Display:**
  1. Switch back to **⚠️ Vulnerable Mode**.
  2. Navigate to **Station 3: Cross-Site Scripting (Stored XSS)**.
  3. Enter Author `attacker` and message: `<b style='color:#ef4444'>[XSS Verified]</b> <img src=x onerror='console.log(document.cookie)'>`.
  4. Click **Submit Ticket Message**.
  5. Show that the feed renders red bold text and triggers the image error event in the browser console.
  6. Toggle to **🛡️ Secure Mode**.
  7. Re-submit an XSS payload like `<img src=x onerror=alert(1)>`.
  8. Show that the HTML is rendered as inert text (`&lt;img ...&gt;`) and Content-Security-Policy headers block script execution.

* **Spoken Script (Student 2):**
> *"Our third finding is Stored Cross-Site Scripting, cataloged under CWE-79 and OWASP A03:2021 with a CVSS score of 7.2.*
>
> *The feedback and support ticketing mechanism accepted raw client strings and directly injected them into the DOM using `innerHTML`. This allows an attacker to store persistent malicious payloads that execute arbitrary JavaScript within the session context of any victim viewing the feed.*
>
> *On screen, we submit a payload containing an `<img>` tag with an `onerror` event. In vulnerable mode, the script executes instantly.*
>
> *To fix this, we implemented context-aware HTML entity encoding on all incoming and outgoing messages, transitioned front-end DOM manipulation to safe `textContent` properties, and deployed a Content Security Policy header restricting unauthorized inline scripts. In Secure Mode, the tags are neutralized into safe characters, eliminating any execution risk. I will now hand over to [Student 3]."*

---

### SCENE 5: Finding 4 — Broken Authentication & Credential Exposure (Student 3)
* **Timestamp:** `5:30 - 6:45`
* **On-Screen Display:**
  1. Switch back to **⚠️ Vulnerable Mode**.
  2. Navigate to **Station 4: Broken Auth & PII Data Exposure**.
  3. Log in with `alice` / `AlicePassword123`.
  4. Point out the JSON response in the live inspector: highlight that the server returned `password_plain`, `password_md5`, and `national_id` (SSN).
  5. Toggle to **🛡️ Secure Mode**.
  6. Attempt 5 rapid incorrect passwords (`WrongPass1`, `WrongPass2`...) to demonstrate the account lockout trigger (`HTTP 429 Too Many Requests`).
  7. Log in with the correct password and show that the response now strictly whitelists non-sensitive fields.

* **Spoken Script (Student 3):**
> *"Thank you, [Student 2]. I will present our fourth and fifth findings, followed by our defense-in-depth conclusions.*
>
> *Finding 4 involves Broken Authentication and Sensitive Data Exposure, classified under CWE-256 and CWE-307, with a High CVSS score of 7.5.*
>
> *In vulnerable mode, passwords were stored using unsalted MD5 hashes—which can be cracked in seconds via precomputed rainbow tables. Furthermore, the login response returned the entire raw database record, directly exposing cleartext credentials, password hashes, and national identification numbers. The endpoint also lacked rate-limiting, leaving it open to dictionary brute-forcing.*
>
> *In our remediation, we upgraded password storage to slow, salted bcrypt hashing, implemented an account lockout mechanism that temporarily locks IP addresses after five failed attempts, and filtered API responses to only return necessary, public profile fields."*

---

### SCENE 6: Finding 5 — Security Misconfiguration & Stack Trace Leaks (Student 3)
* **Timestamp:** `6:45 - 7:45`
* **On-Screen Display:**
  1. Navigate to **Station 5: Security Misconfiguration & Info Disclosure**.
  2. In Vulnerable Mode, click **Query /api/system/debug**. Point out exposed OS architecture, directory paths, and secret database maintenance tokens.
  3. Click **Query /api/system/crash-test**. Show the full code call stack trace dumped to the user.
  4. Switch to **🛡️ Secure Mode**.
  5. Re-query both buttons: `/debug` returns `404 Not Found`, and the crash test returns a generic error with an opaque `Incident ID`.

* **Spoken Script (Student 3):**
> *"Our fifth finding is Security Misconfiguration and Information Disclosure, cataloged under CWE-200 and CWE-16 with a CVSS score of 6.5.*
>
> *Internal diagnostic endpoints (`/api/system/debug`) were left accessible in production, leaking the host platform, Node runtime version, and secret database maintenance keys. In addition, unhandled exceptions dumped full system file paths and stack traces to clients.*
>
> *We remediated this by disabling diagnostic endpoints in production, stripping the `X-Powered-By` fingerprint header, and configuring a centralized error handler that logs stack traces internally while returning only a sanitized, opaque Incident ID to the user."*

---

### SCENE 7: Summary, Report Presentation & Conclusion (All Students / Student 3)
* **Timestamp:** `7:45 - 8:30`
* **On-Screen Display:**
  1. Click the **📑 Full VAPT Report** tab in the web interface to display the comprehensive documentation.
  2. Scroll through the CVSS matrix, risk ratings, and methodology diagram.
  3. Concluding slide with student names and thank you message.

* **Spoken Script (Student 3):**
> *"To conclude, we have prepared a comprehensive 20-page formal VAPT report following OWASP and PTES standards, available in our repository under `docs/VAPT_COMPREHENSIVE_LAB_REPORT.md`.*
>
> *Through this continuous assessment, our group gained hands-on experience in the complete security lifecycle: from threat modeling and black-box dynamic testing with Burp Suite, to source code analysis and engineering defense-in-depth remediations.*
>
> *All five vulnerabilities have been verified as remediated with zero regressions. Thank you very much for your time and evaluation."*

---
*End of Screencast Presentation Script.*
