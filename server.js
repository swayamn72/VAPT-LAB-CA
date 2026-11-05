const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const { initDatabase, resetDatabase } = require('./database');

// Import routes
const usersRoutes = require('./routes/users');
const statementsRoutes = require('./routes/statements');
const feedbackRoutes = require('./routes/feedback');
const authRoutes = require('./routes/auth');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
initDatabase();

// Laboratory global state: isSecureMode starts as false (Vulnerable by default for CA assessment)
app.locals.isSecureMode = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers middleware conditionally applied based on mode
app.use((req, res, next) => {
  if (app.locals.isSecureMode) {
    app.disable('x-powered-by');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  } else {
    // Intentionally expose server banner in vulnerable mode
    res.setHeader('X-Powered-By', 'Express/4.21.2 (VulnLab-NodeJS)');
  }
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/users', usersRoutes);
app.use('/api/statements', statementsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);

// Laboratory Mode & Control API
app.get('/api/lab/status', (req, res) => {
  res.json({
    appName: 'SecureBank Labs - VAPT Demonstration Environment',
    isSecureMode: app.locals.isSecureMode,
    modeLabel: app.locals.isSecureMode ? 'SECURE (Remediated)' : 'VULNERABLE (Assessment Mode)',
    targetVulnerabilities: [
      { id: 1, name: 'SQL Injection (SQLi)', cwe: 'CWE-89', owasp: 'A03:2021', endpoint: '/api/users/search' },
      { id: 2, name: 'Broken Object Level Authorization (IDOR)', cwe: 'CWE-639', owasp: 'A01:2021', endpoint: '/api/statements/:id' },
      { id: 3, name: 'Cross-Site Scripting (XSS - Reflected & Stored)', cwe: 'CWE-79', owasp: 'A03:2021', endpoint: '/api/feedback' },
      { id: 4, name: 'Broken Auth & Insecure Password Storage', cwe: 'CWE-256 / CWE-307', owasp: 'A07:2021', endpoint: '/api/auth/login' },
      { id: 5, name: 'Security Misconfiguration & Information Leak', cwe: 'CWE-200 / CWE-16', owasp: 'A05:2021', endpoint: '/api/system/debug' }
    ]
  });
});

app.post('/api/lab/toggle-mode', (req, res) => {
  if (typeof req.body.secure === 'boolean') {
    app.locals.isSecureMode = req.body.secure;
  } else {
    app.locals.isSecureMode = !app.locals.isSecureMode;
  }

  const state = app.locals.isSecureMode ? 'SECURE (Remediated)' : 'VULNERABLE (Assessment)';
  console.log(`[LAB-CONTROL] Lab environment mode switched to: ${state}`);

  res.json({
    status: 'success',
    isSecureMode: app.locals.isSecureMode,
    modeLabel: state,
    message: `Environment successfully switched to ${state}.`
  });
});

app.post('/api/lab/reset-db', (req, res) => {
  const result = resetDatabase();
  res.json(result);
});

// Global fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(` SecureBank VAPT Lab Server running on http://127.0.0.1:${PORT}`);
  console.log(` Current Environment Mode: ${app.locals.isSecureMode ? 'SECURE' : 'VULNERABLE (Default)'}`);
  console.log(` Ready for Burp Suite, Kali Linux, and Browser Testing`);
  console.log(`=======================================================`);
});
