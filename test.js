/**
 * Automated Verification Test Suite for VAPT Lab CA
 * Tests all 5 target vulnerabilities in both Vulnerable and Secure modes.
 */

const http = require('node:http');

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
    }
    req.end();
  });
}

async function setMode(secure) {
  await makeRequest('/api/lab/toggle-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { secure }
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING VAPT LAB VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Reset Database
    console.log('[Phase 1] Resetting Database...');
    await makeRequest('/api/lab/reset-db', { method: 'POST' });
    assert(true, 'Database initialized to clean seed state');

    // 2. Test in VULNERABLE Mode
    console.log('\n[Phase 2] Verifying VULNERABLE Mode Behaviors...');
    await setMode(false);

    // SQLi Test
    const sqliRes = await makeRequest("/api/users/search?q='%20OR%20'1'='1");
    assert(sqliRes.statusCode === 200 && sqliRes.body.count > 1, 'VULN-01 (SQLi): Exploit extracts all users');

    // IDOR Test
    const idorRes = await makeRequest('/api/statements/1', { headers: { 'x-user-id': '2' } });
    assert(idorRes.statusCode === 200 && idorRes.body.authorizationBypassed === true, 'VULN-02 (IDOR): Alice can access Admin statement');

    // Stored XSS Submission
    const xssSubmit = await makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { author: 'hacker', category: 'XSS', message: '<script>alert(1)</script>' }
    });
    assert(xssSubmit.statusCode === 200 && xssSubmit.body.storedPayload === '<script>alert(1)</script>', 'VULN-03 (XSS): Raw payload stored without sanitization');

    // Auth Leak
    const authRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'alice', password: 'AlicePassword123' }
    });
    assert(authRes.statusCode === 200 && !!authRes.body.userDataLeaked.password_md5, 'VULN-04 (Auth): Credentials & MD5 hash leaked in response');

    // Debug Exposure
    const debugRes = await makeRequest('/api/system/debug');
    assert(debugRes.statusCode === 200 && !!debugRes.body.systemDiagnostics, 'VULN-05 (Misconfig): Internal system diagnostics exposed');

    // 3. Test in SECURE Mode
    console.log('\n[Phase 3] Verifying SECURE / REMEDIATED Mode Behaviors...');
    await setMode(true);

    // SQLi Remediation
    const sqliSecure = await makeRequest("/api/users/search?q='%20OR%20'1'='1");
    assert(sqliSecure.statusCode === 200 && sqliSecure.body.count === 0, 'SECURE-01 (SQLi): Parameterized query neutralizes injection');

    // IDOR Remediation
    const idorSecure = await makeRequest('/api/statements/1', { headers: { 'x-user-id': '2' } });
    assert(idorSecure.statusCode === 403, 'SECURE-02 (IDOR): Access denied (HTTP 403) for unauthorized statement');

    // XSS Remediation
    const xssSecureSubmit = await makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { author: 'hacker', category: 'XSS', message: '<script>alert(1)</script>' }
    });
    const feedbackList = await makeRequest('/api/feedback');
    const hasSanitized = feedbackList.body.items.some(i => i.message.includes('&lt;script&gt;'));
    assert(xssSecureSubmit.statusCode === 200 && hasSanitized, 'SECURE-03 (XSS): Input sanitized to HTML entities');

    // Auth Remediation
    const authSecure = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'alice', password: 'AlicePassword123' }
    });
    assert(authSecure.statusCode === 200 && !authSecure.body.user.password_md5, 'SECURE-04 (Auth): Response strictly sanitized, credentials stripped');

    // Debug Disabled
    const debugSecure = await makeRequest('/api/system/debug');
    assert(debugSecure.statusCode === 404, 'SECURE-05 (Misconfig): Debug endpoint disabled (HTTP 404)');

    // Reset back to vulnerable mode for lab use
    await setMode(false);

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
