const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * VULNERABILITY #2: BROKEN OBJECT LEVEL AUTHORIZATION (IDOR) - CWE-639 / OWASP A01:2021
 * 
 * Endpoint: GET /api/statements/:id
 * 
 * Vulnerable Implementation:
 * Retrieves financial transaction statements based exclusively on the client-supplied `id` in the URL parameter.
 * The application fails to verify whether the record actually belongs to the authenticated requester.
 * Result: User Alice (ID: 2) can view Admin's confidential statement (ID: 1) or Bob's statements (ID: 4, 5).
 * 
 * Remediated Implementation:
 * Verifies object-level ownership by tying the database query to the authenticated session user ID,
 * or verifying appropriate administrative privileges.
 */

// Middleware to simulate session user (reads from 'x-user-id' header or fallback default)
function getAuthenticatedUser(req) {
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(parseInt(headerUserId, 10));
    if (user) return user;
  }
  // Default to Alice (User ID 2, role 'customer') if no custom header is provided
  return { id: 2, username: 'alice', role: 'customer' };
}

// Get all statements belonging to the logged-in user
router.get('/my-statements', (req, res) => {
  const currentUser = getAuthenticatedUser(req);
  const statements = db.prepare(`
    SELECT s.id, s.reference_no, s.account_number, s.amount, s.type, s.description, s.date, s.confidential_note, u.username as owner
    FROM statements s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
  `).all(currentUser.id);

  return res.json({
    status: 'success',
    authenticatedAs: currentUser,
    count: statements.length,
    statements
  });
});

// Access specific statement by ID (Target of IDOR testing)
router.get('/:id', (req, res) => {
  const statementId = req.params.id;
  const currentUser = getAuthenticatedUser(req);
  const isSecure = req.app.locals.isSecureMode;

  try {
    if (!isSecure) {
      // VULNERABLE: Direct access to any record ID with no authorization check
      const statement = db.prepare(`
        SELECT s.*, u.username as owner_username, u.email as owner_email
        FROM statements s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `).get(statementId);

      if (!statement) {
        return res.status(404).json({ status: 'error', message: 'Statement record not found' });
      }

      const isBreach = statement.user_id !== currentUser.id && currentUser.role !== 'admin';

      return res.json({
        status: 'success',
        mode: 'VULNERABLE (Missing Object-Level Authorization)',
        vulnerability: 'CWE-639: Insecure Direct Object References (IDOR)',
        authenticatedAs: currentUser,
        recordOwnerId: statement.user_id,
        authorizationBypassed: isBreach,
        securityAlert: isBreach ? `[ALERT] User ${currentUser.username} (ID ${currentUser.id}) accessed private record owned by ${statement.owner_username} (ID ${statement.user_id})` : null,
        data: statement
      });
    } else {
      // SECURE: Enforce authorization check - record must belong to current user OR user must be admin
      let statement;
      if (currentUser.role === 'admin') {
        statement = db.prepare(`
          SELECT s.*, u.username as owner_username
          FROM statements s
          JOIN users u ON s.user_id = u.id
          WHERE s.id = ?
        `).get(statementId);
      } else {
        statement = db.prepare(`
          SELECT s.*, u.username as owner_username
          FROM statements s
          JOIN users u ON s.user_id = u.id
          WHERE s.id = ? AND s.user_id = ?
        `).get(statementId, currentUser.id);
      }

      if (!statement) {
        return res.status(403).json({
          status: 'error',
          mode: 'SECURE (Enforced Object Authorization)',
          vulnerability: 'Blocked IDOR Attempt',
          message: 'Access Denied: You do not have permission to view or manipulate this financial document.',
          authenticatedAs: currentUser,
          requestedRecordId: statementId
        });
      }

      return res.json({
        status: 'success',
        mode: 'SECURE',
        authenticatedAs: currentUser,
        data: statement
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
