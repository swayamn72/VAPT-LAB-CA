# COMPLETE SCREENCAST PRESENTATION: SCRIPT & STEP-BY-STEP ACTION GUIDE
## VAPT Continuous Assessment Video Recording (10 Marks)

* **Target Application:** SecureBank Labs (`http://127.0.0.1:3000`)
* **Presentation Format:** Screen recording with voiceover (OBS / Zoom / Windows Game Bar `Win + G` / Loom)
* **Estimated Duration:** 7:30 to 8:30 minutes
* **Suitability:** Can be presented by **1 student** or divided among **up to 3 students**.

---

## 📋 PRE-RECORDING CHECKLIST (DO THIS BEFORE CLICKING RECORD)

1. **Start the Lab Server:**
   Open PowerShell or Terminal in the project folder:
   ```powershell
   cd "c:\Users\swaya\OneDrive\Desktop\VAPT LAB CA"
   npm start
   ```
   *(Ensure you see: `SecureBank VAPT Lab Server running on http://127.0.0.1:3000`)*

2. **Open Browser:**
   - Go to `http://127.0.0.1:3000`.
   - Press **F11** or maximize the window to make it full screen and clutter-free.
   - Verify the top toggle is set to **⚠️ Vulnerable Mode** (red pill is active).
   - Click the **🔄 Reset DB** button in the top right so all seed data is fresh.

3. **Open VS Code (Optional / Side Window):**
   - Keep VS Code open with the `routes/` folder if you want to quickly Alt+Tab to show real code files, or simply use the **"🔍 Vulnerable vs Remediated Diffs"** tab built directly into the web interface.

---

# 🎬 SCENE-BY-SCENE ACTION & SPOKEN SCRIPT

---

### SEGMENT 0: INTRO & SCOPE (0:00 - 1:15)
*Target Time: 1 minute 15 seconds*  
*Speaker: Student 1 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Show your title slide or opening desktop screen with project details.
2. Switch window to `http://127.0.0.1:3000` on the **🎯 Test Stations** tab.
3. Move your mouse cursor across the top bar: hover briefly over the **SECUREBANK LABS** logo, the **ACADEMIC CA LAB** badge, and the **⚠️ Vulnerable Mode** pill.
4. Scroll slightly to show the 5 stations laid out cleanly.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Hello everyone and respected evaluator. Welcome to our demonstration for the Vulnerability Assessment and Penetration Testing Continuous Assessment.*
>
> *Our team members are **[State Student 1 Name]**, **[State Student 2 Name]**, and **[State Student 3 Name]**.*
>
> *For this assessment, we designed and configured an educational financial portal called **SecureBank Labs**. The application is containerized and hosted in a strictly authorized, isolated laboratory environment on our local loopback interface at port 3000.*
>
> *Today, we will walk you through the end-to-end security lifecycle of five critical vulnerabilities mapped to the OWASP Top 10. For each vulnerability, we will assess the threat, demonstrate a controlled Proof-of-Concept exploit, inspect the technical root cause in the source code, apply the secure remediation, and re-test to verify complete mitigation.*
>
> *Notice our application features an interactive dual-state toggle at the top. We will start in Vulnerable Mode to demonstrate the flaws, and switch to Secure Mode to validate our defenses in real time."*

---

### SEGMENT 1: FINDING 1 — SQL INJECTION (CWE-89) (1:15 - 2:45)
*Target Time: 1 minute 30 seconds*  
*Speaker: Student 1 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. On the web portal, scroll to **Station 1: SQL Injection (SQLi)**.
2. In the search input box, clear any text and type `alice`. Click **Execute Search Request**.
3. Point your mouse to the result showing **1 record** returned for Alice.
4. Now click the quick payload chip: `' OR '1'='1` (or paste it into the box).
5. Click **Execute Search Request**.
6. Point to the result box and the bottom **HTTP Inspector** console: highlight that **all 4 database records** appeared, including `admin` with a balance of $250,000.
7. Click the top tab **"🔍 Vulnerable vs Remediated Diffs"**. Scroll to **Finding 1: SQL Injection**.
8. Move mouse over the red box (`routes/users.js`) showing `${query}` template string interpolation, then the green box showing `?` parameterized placeholders.
9. Click back to **"🎯 Test Stations"**.
10. Click the **🛡️ Secure Mode** toggle in the top bar (it turns green).
11. Click **Execute Search Request** again with `' OR '1'='1`.
12. Point out that **0 records** are returned and the query was safely parameterized.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Our first finding is **SQL Injection**, cataloged under **CWE-89** and **OWASP Category A03:2021 – Injection**, rated at a **Critical CVSS v3.1 score of 9.8**.*
>
> *Here in Station 1, the customer search bar is intended to look up users by username or email. When we perform a legitimate search for 'alice', the application returns a single expected user.*
>
> *However, because user input is concatenated directly into the raw SQL query without sanitization, an attacker can supply SQL meta-characters. Let us input single quote OR one equals one.*
>
> *When we execute this request, the injected condition alters the query logic so it always evaluates to TRUE. Looking at our live inspector, we have successfully extracted every user record from the database—including executive administrator accounts and confidential account balances.*
>
> *Reviewing the code diff in `routes/users.js`, the flaw originates from string template literals directly interpolating the raw query string into the SQL statement.*
>
> *To remediate this, we replaced raw concatenation with parameterized queries using bound question mark placeholders. Let us toggle the environment into **Secure Mode**.*
>
> *Now, when we execute the exact same `' OR '1'='1` payload, the SQLite engine treats the entire payload strictly as a literal search string. Zero unauthorized records are returned, completely neutralizing the attack vector."*

---

### SEGMENT 2: FINDING 2 — BROKEN OBJECT-LEVEL AUTHORIZATION / IDOR (CWE-639) (2:45 - 4:10)
*Target Time: 1 minute 25 seconds*  
*Speaker: Student 2 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Click the top toggle back to **⚠️ Vulnerable Mode** (red).
2. Scroll to **Station 2: Broken Object Authorization (IDOR)**.
3. Show the **Authenticated As** dropdown is set to **Alice (User ID 2, Customer)**.
4. Show the **Target Statement ID** input: type `2` (Alice's own statement) and click **Fetch Statement Document**.
5. Point to the green check: Alice views her own $3,500 consulting payout.
6. Now change the **Target Statement ID** to `1` (which belongs to Admin).
7. Click **Fetch Statement Document**.
8. Point mouse to the red alert banner: **⚠️ IDOR BREACH DETECTED: Unauthorized Access**, showing Alice has just read Admin's confidential $120,000 executive dividend payout.
9. Click the top toggle to **🛡️ Secure Mode** (green).
10. Click **Fetch Statement Document** again for ID `1`.
11. Point to the red error banner: **⛔ Access Denied: You do not have permission to view or manipulate this financial document (HTTP 403 Forbidden)**.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Next is our second finding: **Broken Object-Level Authorization**, commonly known as **IDOR**, cataloged under **CWE-639** and **OWASP Category A01:2021 – Broken Access Control**, with a **High CVSS score of 8.5**.*
>
> *In a financial portal, bank statements must remain strictly confidential to their rightful owner. Here, we are logged in as customer Alice with User ID 2. When Alice queries her own statement, Statement ID 2, she receives her valid consulting transaction.*
>
> *However, the endpoint queries records solely based on the numeric ID parameter in the URL, failing to verify whether the record actually belongs to the active session user.*
>
> *If Alice simply changes the ID in the request from 2 to 1—which belongs to the Executive Administrator—and clicks Fetch, the server fulfills the request without checking authorization. Alice is able to view private executive dividend disbursements totaling $120,000, along with restricted board approval notes.*
>
> *To fix this, we updated `routes/statements.js` to enforce session ownership by binding the query to `WHERE id = ? AND user_id = currentUser.id`.*
>
> *Let us switch into **Secure Mode** and re-send the request for Statement 1. As you can see, the server immediately denies the request with an **HTTP 403 Forbidden**, successfully blocking horizontal and vertical privilege escalation."*

---

### SEGMENT 3: FINDING 3 — STORED CROSS-SITE SCRIPTING / XSS (CWE-79) (4:10 - 5:25)
*Target Time: 1 minute 15 seconds*  
*Speaker: Student 2 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Switch toggle back to **⚠️ Vulnerable Mode** (red).
2. Scroll to **Station 3: Cross-Site Scripting (Stored XSS)**.
3. In Author, enter `attacker`. In Category, leave `Security Alert`.
4. In Message Content, click the quick chip: `<img src=x onerror=alert(1)>` (or type `<b style='color:#ef4444'>[XSS Verified]</b> <img src=x onerror="console.log('XSS Triggered')">`).
5. Click **Submit Ticket Message**.
6. Point to the **Live Feed Rendering** below the form: show that the injected HTML renders styled red text and executes the image onerror script in the browser.
7. Switch toggle to **🛡️ Secure Mode** (green).
8. Enter another payload in Message: `<img src=x onerror=alert(1)>`.
9. Click **Submit Ticket Message**.
10. Point to the newly added item in the feed: show that the payload is safely encoded and displayed as plain literal text (`&lt;img src=x onerror=alert(1)&gt;`), and no script executed.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Our third finding is **Stored Cross-Site Scripting**, logged under **CWE-79** and **OWASP Category A03:2021 – Injection**, carrying a **High CVSS score of 7.2**.*
>
> *The customer support and feedback feed allows users to submit messages. In vulnerable mode, the backend accepts raw strings and persists them directly into SQLite without character sanitization. Simultaneously, the frontend injects this text into the page using the dangerous `innerHTML` property.*
>
> *When an attacker submits a ticket containing an HTML image tag with an onerror JavaScript handler, the payload is permanently stored in the database. Any bank representative or user who loads this feed has the script automatically executed within their browser session, which could lead to cookie theft or session hijacking.*
>
> *To remediate this vulnerability, we implemented a dual-layer defense: first, context-aware HTML entity encoding on all incoming and outgoing text to convert brackets into `&lt;` and `&gt;`; and second, enforcing a strict Content Security Policy.*
>
> *Switching to **Secure Mode**, when we submit an identical XSS payload, it is sanitized into inert text and rendered safely without execution."*

---

### SEGMENT 4: FINDING 4 — BROKEN AUTHENTICATION & PII DATA EXPOSURE (CWE-256 / 307) (5:25 - 6:40)
*Target Time: 1 minute 15 seconds*  
*Speaker: Student 3 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Switch toggle back to **⚠️ Vulnerable Mode** (red).
2. Scroll to **Station 4: Broken Auth & PII Data Exposure**.
3. Credentials are pre-filled as `alice` / `AlicePassword123`. Click **Test Login Endpoint**.
4. Point your cursor to the JSON output in the station result and in the bottom **HTTP Inspector**:
   - Highlight `"password_plain": "AlicePassword123"`
   - Highlight `"password_md5": "b3e344..."`
   - Highlight `"national_id": "SSN-089-22-1092"`
5. Point out that the endpoint returns the whole user row with passwords and national ID.
6. Now switch toggle to **🛡️ Secure Mode** (green).
7. In the password box, click the chip **Simulate Failed Attempt** (username `admin`, password `WrongPassword1`).
8. Click **Test Login Endpoint** 5 times rapidly.
9. On the 5th attempt, point to the error banner: **⛔ Account temporarily locked for 60 seconds (HTTP 429 Too Many Requests)**.
10. Now select `alice` / `AlicePassword123` and login successfully: show that the JSON response now strictly whitelists non-sensitive profile fields (`id`, `username`, `email`, `role`, `balance`), completely stripping hashes and SSNs.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Our fourth finding covers **Broken Authentication, Weak Password Storage, and Sensitive Data Exposure**, classified under **CWE-256** and **CWE-307** with a **High CVSS score of 7.5**.*
>
> *When reviewing the vulnerable authentication flow, we identified three major flaws:*
> *First, passwords were verified using unsalted MD5 hashes, which are trivial to crack using offline rainbow tables.*
> *Second, upon successful authentication, the server dumps the entire database record back in the JSON response—leaking cleartext passwords, password hashes, and confidential National ID numbers.*
> *Third, the login endpoint has no throttling, leaving it completely vulnerable to automated dictionary brute-force attacks.*
>
> *To remediate these issues in `routes/auth.js`, we upgraded password verification to salted, adaptive **bcrypt** key stretching, implemented explicit field whitelisting to strip sensitive credentials from responses, and added an IP-based brute-force tracker.*
>
> *Switching to **Secure Mode**, notice that when we simulate five rapid incorrect password attempts, the server automatically triggers an **HTTP 429 lockout**, protecting accounts against credential stuffing. When we log in legitimately, only safe, non-confidential profile details are returned."*

---

### SEGMENT 5: FINDING 5 — SECURITY MISCONFIGURATION & INFO DISCLOSURE (CWE-200 / 16) (6:40 - 7:45)
*Target Time: 1 minute 5 seconds*  
*Speaker: Student 3 (or Solo Presenter)*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Switch toggle back to **⚠️ Vulnerable Mode** (red).
2. Scroll down to **Station 5: Security Misconfiguration & Information Disclosure**.
3. Click the button: **Query /api/system/debug (Diagnostics Dump)**.
4. Point mouse to the JSON output in the live inspector:
   - Highlight Node version, OS platform (`win32` / `linux`), and working directory path.
   - Highlight leaked database secrets: `MAINTENANCE_KEY` and `INTERNAL_API_SECRET`.
5. Click the button: **Query /api/system/crash-test (Stack Trace Test)**.
6. Point to the full multi-line call stack trace leaking source code line numbers.
7. Switch toggle to **🛡️ Secure Mode** (green).
8. Click **Query /api/system/debug**: show that it now returns **HTTP 404 Not Found** with a message that diagnostic routes are disabled in production.
9. Click **Query /api/system/crash-test**: show that the server now returns a generic user-friendly error with an opaque tracking ID like `INC-9A4B82`, keeping internal stack traces logged privately.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"Our fifth finding is **Security Misconfiguration and Information Disclosure**, categorized under **CWE-200** and **CWE-16** with a **CVSS score of 6.5**.*
>
> *In vulnerable mode, an internal diagnostic endpoint at `/api/system/debug` was left reachable in production. Querying it dumps runtime environment variables, operating system platform details, absolute file paths, and high-privilege maintenance keys.*
>
> *Furthermore, unhandled exceptions at `/api/system/crash-test` returned raw JavaScript stack traces, exposing internal code structure to potential attackers.*
>
> *To remediate this, we disabled all diagnostic endpoints in hardened production mode, returning a standard 404 Not Found. We also implemented a centralized error handler that logs detailed traces to private server logs and returns only an opaque Incident ID to the client, while adding security headers like `X-Frame-Options: DENY` and stripping the `X-Powered-By` banner."*

---

### SEGMENT 6: SUMMARY, REPORT OVERVIEW & CONCLUSION (7:45 - 8:30)
*Target Time: 45 seconds*  
*Speaker: Student 3 / All Students*

#### 🖱️ WHAT YOU DO ON SCREEN:
1. Click the **📊 Vulnerability Matrix & CVSS** tab in the top navigation:
   - Slowly scroll down the table showing all 5 findings, CWEs, OWASP 2021 tags, CVSS v3.1 vector strings, and scores.
2. Click the **📑 Full VAPT Report** tab:
   - Scroll briefly through the Executive Summary and mention the document link `docs/VAPT_COMPREHENSIVE_LAB_REPORT.md`.
3. Switch back to your opening title slide or camera feed for closing remarks.

#### 🎙️ WHAT YOU SAY (Word for Word):
> *"To summarize our work, we have consolidated our findings into a comprehensive 20-page formal VAPT report following OWASP and PTES standards, available in our repository under `docs/VAPT_COMPREHENSIVE_LAB_REPORT.md`.*
>
> *As shown in our Vulnerability Matrix, all five critical issues—ranging from SQL Injection and IDOR to Stored XSS, Broken Authentication, and Misconfigurations—have been identified, exploited with controlled Proof-of-Concepts, documented with CVSS v3.1 metrics, and proven 100% remediated.*
>
> *This continuous assessment gave our group invaluable hands-on experience in both sides of cybersecurity: ethical penetration testing and defense-in-depth secure code engineering.*
>
> *Thank you very much for your time and evaluation."*

---

## 💡 PRO TIPS FOR RECORDING

1. **Keep Your Speech Paced:** Speak clearly and deliberately. Don't rush; the timings above leave plenty of breathing room.
2. **Move the Mouse With Purpose:** When you speak about a specific value (like the `$120,000` amount or the `password_md5` hash), use your cursor to circle or hover over it.
3. **If You Make a Mistake While Speaking:** Just pause for 2 seconds, take a breath, and re-read that sentence. You can easily cut out the silence in video editing software (e.g., Clipchamp, DaVinci Resolve, or CapCut).
4. **Live Reset Available Anytime:** If your data looks cluttered or you want to start fresh, simply click the **🔄 Reset DB** button at the top right of the application.
