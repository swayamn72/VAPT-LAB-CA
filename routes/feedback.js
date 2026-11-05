const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * VULNERABILITY #3: CROSS-SITE SCRIPTING (XSS) - CWE-79 / OWASP A03:2021
 * 
 * Endpoints:
 * - GET  /api/feedback/preview?msg=... (Reflected XSS)
 * - POST /api/feedback (Stored XSS Submission)
 * - GET  /api/feedback (Stored XSS Retrieval)
 * 
 * Vulnerable Implementation:
 * Accepts user-supplied HTML/JavaScript payloads, stores them in the database without sanitization,
 * and reflects or renders them in browser contexts using raw innerHTML.
 * 
 * Remediated Implementation:
 * Applies HTML entity encoding to neutralize dangerous characters (<, >, ", ', &, /),
 * enforces Content Security Policy (CSP), and instructs front-end rendering via textContent.
 */

// Helper function to sanitize and HTML-encode untrusted text
function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// 1. Reflected XSS Preview Endpoint
router.get('/preview', (req, res) => {
  const msg = req.query.msg || 'No message provided';
  const isSecure = req.app.locals.isSecureMode;

  if (!isSecure) {
    // VULNERABLE: Direct reflection into response body without escaping or CSP
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <div class="preview-box">
        <h4>Feedback Live Preview (Vulnerable Reflected Context)</h4>
        <p>Your message: ${msg}</p>
      </div>
    `);
  } else {
    // SECURE: Escaped HTML output with strict Content-Security-Policy
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
    const safeMsg = sanitizeHtml(msg);
    return res.send(`
      <div class="preview-box">
        <h4>Feedback Live Preview (Secured Context)</h4>
        <p>Your message: ${safeMsg}</p>
      </div>
    `);
  }
});

// 2. Stored XSS: Retrieve all feedback
router.get('/', (req, res) => {
  const isSecure = req.app.locals.isSecureMode;
  try {
    const feedbackList = db.prepare('SELECT id, author, category, message, created_at FROM feedback ORDER BY id DESC').all();

    if (!isSecure) {
      return res.json({
        status: 'success',
        mode: 'VULNERABLE (Raw Content Delivered for innerHTML)',
        vulnerability: 'CWE-79: Stored Cross-Site Scripting',
        count: feedbackList.length,
        items: feedbackList
      });
    } else {
      // Secure: Encode before transmission and flag safe-rendering
      const sanitized = feedbackList.map(item => ({
        ...item,
        author: sanitizeHtml(item.author),
        category: sanitizeHtml(item.category),
        message: sanitizeHtml(item.message)
      }));

      return res.json({
        status: 'success',
        mode: 'SECURE (HTML Encoded & Enforced Context)',
        count: sanitized.length,
        items: sanitized
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. Stored XSS: Submit feedback
router.post('/', (req, res) => {
  const { author, category, message } = req.body;
  const isSecure = req.app.locals.isSecureMode;

  if (!author || !message) {
    return res.status(400).json({ status: 'error', message: 'Author and message are required.' });
  }

  try {
    if (!isSecure) {
      // VULNERABLE: Stores raw payload (e.g. <img src=x onerror=alert(document.domain)>)
      const insert = db.prepare("INSERT INTO feedback (author, category, message, created_at) VALUES (?, ?, ?, datetime('now'))");
      const result = insert.run(author, category || 'General', message);

      return res.json({
        status: 'success',
        mode: 'VULNERABLE',
        message: 'Feedback stored without sanitization. Stored XSS payload active in database.',
        id: result.lastInsertRowid,
        storedPayload: message
      });
    } else {
      // SECURE: Validate input length and encode special characters before storage
      const safeAuthor = sanitizeHtml(author.trim().substring(0, 50));
      const safeCategory = sanitizeHtml((category || 'General').trim().substring(0, 50));
      const safeMessage = sanitizeHtml(message.trim().substring(0, 500));

      const insert = db.prepare("INSERT INTO feedback (author, category, message, created_at) VALUES (?, ?, ?, datetime('now'))");
      const result = insert.run(safeAuthor, safeCategory, safeMessage);

      return res.json({
        status: 'success',
        mode: 'SECURE',
        message: 'Feedback securely sanitized and stored.',
        id: result.lastInsertRowid
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
