const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const dbPath = path.join(__dirname, 'vapt_lab.db');
const db = new DatabaseSync(dbPath);

function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT,
      password_plain TEXT,
      password_md5 TEXT,
      password_bcrypt TEXT,
      role TEXT,
      national_id TEXT,
      balance REAL,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      reference_no TEXT,
      account_number TEXT,
      amount REAL,
      type TEXT,
      description TEXT,
      date TEXT,
      confidential_note TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      category TEXT,
      message TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Check if data is already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
}

function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function seedDatabase() {
  console.log('[DB] Seeding initial lab records...');

  // Pre-hashed passwords
  const salt = bcrypt.genSaltSync(10);
  const adminBcrypt = bcrypt.hashSync('Admin@2026!Sec', salt);
  const aliceBcrypt = bcrypt.hashSync('AlicePassword123', salt);
  const bobBcrypt = bcrypt.hashSync('BobPass!998', salt);
  const charlieBcrypt = bcrypt.hashSync('CharlieSecure#44', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_plain, password_md5, password_bcrypt, role, national_id, balance, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertUser.run('admin', 'admin@secbank.lab', 'Admin@2026!Sec', md5Hash('Admin@2026!Sec'), adminBcrypt, 'admin', 'SSN-001-99-4412', 250000.00);
  insertUser.run('alice', 'alice@customer.lab', 'AlicePassword123', md5Hash('AlicePassword123'), aliceBcrypt, 'customer', 'SSN-089-22-1092', 14250.75);
  insertUser.run('bob', 'bob@customer.lab', 'BobPass!998', md5Hash('BobPass!998'), bobBcrypt, 'customer', 'SSN-451-33-8821', 890.20);
  insertUser.run('charlie', 'charlie@audit.lab', 'CharlieSecure#44', md5Hash('CharlieSecure#44'), charlieBcrypt, 'auditor', 'SSN-902-11-7734', 5400.00);

  // Seed financial statements
  const insertStatement = db.prepare(`
    INSERT INTO statements (user_id, reference_no, account_number, amount, type, description, date, confidential_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStatement.run(1, 'TXN-ADM-0091', 'AC-990011-ADM', 120000.00, 'CREDIT', 'Executive Dividend Disbursement', '2026-10-15', 'RESTRICTED: Board approval ref #EXEC-912');
  insertStatement.run(2, 'TXN-ALC-1044', 'AC-441022-ALC', 3500.00, 'CREDIT', 'Consulting Monthly Payout', '2026-10-18', 'Client project Alpha escrow release');
  insertStatement.run(2, 'TXN-ALC-1045', 'AC-441022-ALC', 450.00, 'DEBIT', 'Cloud Infrastructure Payment', '2026-10-19', 'Automated recurring billing');
  insertStatement.run(3, 'TXN-BOB-2011', 'AC-881923-BOB', 1200.00, 'CREDIT', 'Salary Deposit', '2026-10-01', 'Verified payroll ACH');
  insertStatement.run(3, 'TXN-BOB-2012', 'AC-881923-BOB', 75.50, 'DEBIT', 'Utility Payment', '2026-10-05', 'Water & electricity bill payment');
  insertStatement.run(4, 'TXN-CHR-3001', 'AC-771239-CHR', 5000.00, 'CREDIT', 'Auditor Retainer Fee', '2026-10-10', 'Q3 security verification retainer');

  // Seed feedback / ticket messages
  const insertFeedback = db.prepare(`
    INSERT INTO feedback (author, category, message, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  insertFeedback.run('alice', 'Account Support', 'Can you please review my transaction limits?', );
  insertFeedback.run('bob', 'Mobile App Bug', 'The statement export button was unresponsive yesterday.');
  insertFeedback.run('security_team', 'Compliance Alert', 'Quarterly VAPT scheduled for systems in October 2026.');

  // System config
  const insertConfig = db.prepare('INSERT INTO system_config (key, value) VALUES (?, ?)');
  insertConfig.run('DATABASE_VERSION', 'SQLite 3.46 (Embedded)');
  insertConfig.run('APP_ENVIRONMENT', 'LABORATORY_ISOLATED');
  insertConfig.run('MAINTENANCE_KEY', 'SEC-MAINT-TOKEN-9941-XJ8');
  insertConfig.run('INTERNAL_API_SECRET', 'shhh_super_secret_jwt_hmac_key_2026_xyz');

  console.log('[DB] Seeding completed successfully.');
}

function resetDatabase() {
  console.log('[DB] Resetting database to initial seed state...');
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS statements;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS feedback;
    DROP TABLE IF EXISTS system_config;
    PRAGMA foreign_keys = ON;
  `);
  initDatabase();
  return { status: 'success', message: 'Database reset to clean laboratory state.' };
}

module.exports = {
  db,
  initDatabase,
  resetDatabase,
  md5Hash
};
