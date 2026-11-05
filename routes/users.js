const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * VULNERABILITY #1: SQL INJECTION (SQLi) - CWE-89 / OWASP A03:2021
 * 
 * Endpoint: GET /api/users/search?q=...
 * 
 * Vulnerable Implementation:
 * Directly concatenates user input into the raw SQL string without parameterization.
 * Allows attackers to inject arbitrary SQL statements (e.g. `' OR '1'='1` or `' UNION SELECT ...`).
 * 
 * Remediated Implementation:
 * Uses prepared statements with bound parameter placeholders (?), preventing query structure manipulation.
 */
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const isSecure = req.app.locals.isSecureMode;

  try {
    if (!isSecure) {
      // VULNERABLE: Direct string interpolation into SQL statement
      const rawSql = `SELECT id, username, email, role, balance FROM users WHERE username LIKE '%${query}%' OR email = '${query}'`;
      console.log(`[SQLi-DEBUG] Executing Raw Query: ${rawSql}`);
      
      const results = db.prepare(rawSql).all();
      return res.json({
        status: 'success',
        mode: 'VULNERABLE (Unsanitized Concatenation)',
        vulnerability: 'CWE-89: SQL Injection',
        executedSql: rawSql,
        count: results.length,
        data: results
      });
    } else {
      // SECURE: Parameterized query with bound parameters
      const sanitizedSql = 'SELECT id, username, email, role, balance FROM users WHERE username LIKE ? OR email = ?';
      const searchPattern = `%${query}%`;
      console.log(`[SECURE-QUERY] Executing Parameterized Query with params: [${searchPattern}, ${query}]`);
      
      const results = db.prepare(sanitizedSql).all(searchPattern, query);
      return res.json({
        status: 'success',
        mode: 'SECURE (Parameterized Statement)',
        remediation: 'Parameterized queries with bound variables neutralize SQL meta-characters',
        executedSql: `${sanitizedSql} [Parameters: "${searchPattern}", "${query}"]`,
        count: results.length,
        data: results
      });
    }
  } catch (err) {
    if (!isSecure) {
      // In vulnerable mode, verbose SQL error details leak database internal state
      return res.status(500).json({
        status: 'error',
        mode: 'VULNERABLE',
        message: 'Database query execution error',
        databaseError: err.message,
        stack: err.stack
      });
    } else {
      // In secure mode, generic error message without database internals
      return res.status(500).json({
        status: 'error',
        mode: 'SECURE',
        message: 'Unable to process search request at this time.'
      });
    }
  }
});

// Helper route to list all users for laboratory reference
router.get('/', (req, res) => {
  const isSecure = req.app.locals.isSecureMode;
  try {
    if (!isSecure) {
      // Vulnerable: returns all internal database columns including hashes and national ID
      const users = db.prepare('SELECT * FROM users').all();
      return res.json({ status: 'success', mode: 'VULNERABLE (PII & Credentials Leaked)', users });
    } else {
      // Secure: only safe public fields
      const users = db.prepare('SELECT id, username, email, role, balance FROM users').all();
      return res.json({ status: 'success', mode: 'SECURE', users });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
