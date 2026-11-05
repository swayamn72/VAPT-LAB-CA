const express = require('express');
const router = express.Router();
const os = require('node:os');
const { db } = require('../database');

/**
 * VULNERABILITY #5: SECURITY MISCONFIGURATION & INFORMATION DISCLOSURE - CWE-200 / CWE-16 / OWASP A05:2021
 * 
 * Endpoints:
 * - GET /api/system/debug (Debug Diagnostic Dump)
 * - GET /api/system/crash-test (Unhandled Exception Stack Trace Leak)
 * - GET /api/system/config-keys (Database Internal Secrets)
 * 
 * Vulnerable Implementation:
 * 1. Diagnostic endpoints left accessible in production, dumping OS architecture, process env vars,
 *    and internal secret tokens.
 * 2. Unhandled errors dump full internal file-system paths and call stack traces to clients.
 * 3. Server technology banners exposed (e.g. `X-Powered-By: Express`).
 * 
 * Remediated Implementation:
 * 1. Sensitive debug/diagnostic endpoints blocked and disabled outside of local dev environments.
 * 2. Centralized exception handling that logs internally and returns an opaque Incident ID to users.
 * 3. Technology fingerprint headers stripped and defense-in-depth headers applied.
 */

// Debug diagnostic endpoint
router.get('/debug', (req, res) => {
  const isSecure = req.app.locals.isSecureMode;

  if (!isSecure) {
    // VULNERABLE: Dumps sensitive system state, OS information, environment variables
    const internalConfigs = db.prepare('SELECT * FROM system_config').all();

    return res.json({
      status: 'success',
      mode: 'VULNERABLE (Verbose Debug Information Leaked)',
      vulnerability: 'CWE-200: Information Exposure & Security Misconfiguration',
      systemDiagnostics: {
        nodeVersion: process.version,
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptimeSeconds: os.uptime(),
        totalMemoryBytes: os.totalmem(),
        freeMemoryBytes: os.freemem(),
        workingDirectory: process.cwd(),
        environmentVariables: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          PATH: process.env.PATH,
          DATABASE_FILE: 'vapt_lab.db',
          SESSION_SECRET: 'dev-lab-insecure-cookie-key-12345'
        },
        databaseSecrets: internalConfigs
      }
    });
  } else {
    // SECURE: Debug endpoints are completely disabled and return standard 404
    return res.status(404).json({
      status: 'error',
      mode: 'SECURE',
      message: 'Resource not found. Diagnostic endpoints are disabled in hardened production environments.'
    });
  }
});

// Crash test endpoint demonstrating verbose stack trace leak vs sanitized error
router.get('/crash-test', (req, res, next) => {
  const isSecure = req.app.locals.isSecureMode;

  try {
    // Simulate unexpected critical error
    throw new Error('DatabaseConnectionTimeoutException: Connection pool exhausted at line 144 of /server/database/pool.js');
  } catch (err) {
    if (!isSecure) {
      // VULNERABLE: Stack trace leaked directly in HTTP response
      return res.status(500).json({
        status: 'error',
        mode: 'VULNERABLE (Detailed Stack Trace Exposed)',
        vulnerability: 'CWE-209: Generation of Error Message Containing Sensitive Information',
        errorMessage: err.message,
        exceptionName: err.name,
        stackTrace: err.stack.split('\n')
      });
    } else {
      // SECURE: Generic error with an opaque tracking ID
      const incidentId = 'INC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      console.error(`[INTERNAL-LOG] [${incidentId}] Critical Exception:`, err.message);

      return res.status(500).json({
        status: 'error',
        mode: 'SECURE',
        message: 'An unexpected internal error occurred. Our engineering team has been notified.',
        incidentId: incidentId
      });
    }
  }
});

module.exports = router;
