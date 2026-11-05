const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, md5Hash } = require('../database');

/**
 * VULNERABILITY #4: BROKEN AUTHENTICATION & SENSITIVE CREDENTIAL EXPOSURE - CWE-256 / CWE-307 / CWE-312
 * 
 * Endpoints:
 * - POST /api/auth/login
 * - GET  /api/auth/profile
 * 
 * Vulnerable Implementation:
 * 1. Checks passwords against weak, unsalted MD5 hashes (crackable in seconds via rainbow tables).
 * 2. Missing rate-limiting / brute-force protection (allows unlimited rapid automated dictionary attacks).
 * 3. Over-privileged API responses returning complete database records including `password_md5`,
 *    `password_plain`, and confidential PII `national_id`.
 * 
 * Remediated Implementation:
 * 1. Password verification enforced using strong salted bcrypt hashing.
 * 2. Account lockout / rate limiting after repeated consecutive failures.
 * 3. Strict response object filtering to omit sensitive credentials and personal identifiers.
 */

// In-memory brute-force attempt tracker for demonstration
const failedAttemptsMap = new Map();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const isSecure = req.app.locals.isSecureMode;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
  }

  try {
    if (!isSecure) {
      // VULNERABLE:
      // 1. No rate limiting check - vulnerable to automated credential stuffing & brute-force
      // 2. Uses weak MD5 hash check
      const inputMd5 = md5Hash(password);
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user || user.password_md5 !== inputMd5) {
        return res.status(401).json({
          status: 'error',
          mode: 'VULNERABLE',
          message: 'Invalid credentials.',
          rateLimitProtected: false
        });
      }

      // 3. Sensitive Data Exposure: Full record returned with passwords & PII
      return res.json({
        status: 'success',
        mode: 'VULNERABLE (Sensitive Data Exposure)',
        vulnerability: 'CWE-256 / CWE-312: Cleartext/Weak Password Storage & Sensitive PII Leakage',
        message: 'Authentication successful',
        sessionToken: `INSECURE-TOKEN-USER-${user.id}-${Date.now()}`,
        userDataLeaked: user
      });
    } else {
      // SECURE:
      // 1. Rate limiting & Lockout check
      const trackerKey = `${clientIp}_${username}`;
      const attempts = failedAttemptsMap.get(trackerKey) || { count: 0, lockedUntil: 0 };

      if (Date.now() < attempts.lockedUntil) {
        const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        return res.status(429).json({
          status: 'error',
          mode: 'SECURE',
          message: `Account temporarily locked due to excessive failed attempts. Please retry in ${remainingSeconds} seconds.`
        });
      }

      // 2. Secure adaptive bcrypt verification
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      const isValid = user ? bcrypt.compareSync(password, user.password_bcrypt) : false;

      if (!isValid) {
        attempts.count += 1;
        if (attempts.count >= 5) {
          attempts.lockedUntil = Date.now() + 60000; // Lock for 60 seconds
          failedAttemptsMap.set(trackerKey, attempts);
          return res.status(429).json({
            status: 'error',
            mode: 'SECURE',
            message: 'Too many failed login attempts. Account temporarily locked for 60 seconds.'
          });
        }
        failedAttemptsMap.set(trackerKey, attempts);
        return res.status(401).json({
          status: 'error',
          mode: 'SECURE',
          message: 'Invalid username or password.',
          attemptsRemaining: 5 - attempts.count
        });
      }

      // Reset failed counter on success
      failedAttemptsMap.delete(trackerKey);

      // 3. Safe response: Explicitly filter out sensitive credentials
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      };

      return res.json({
        status: 'success',
        mode: 'SECURE',
        message: 'Authentication successful with salted bcrypt verification and rate-limiting active.',
        user: sanitizedUser
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Profile endpoint
router.get('/profile', (req, res) => {
  const isSecure = req.app.locals.isSecureMode;
  const username = req.query.username || 'alice';

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!isSecure) {
      // Returns full record with passwords and national ID
      return res.json({
        status: 'success',
        mode: 'VULNERABLE',
        data: user
      });
    } else {
      // Safe projection
      return res.json({
        status: 'success',
        mode: 'SECURE',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          balance: user.balance
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
