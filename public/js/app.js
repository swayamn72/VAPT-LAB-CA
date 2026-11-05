// State management
let currentLabState = {
  isSecureMode: false,
  modeLabel: 'VULNERABLE (Assessment Mode)'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchLabStatus();
  setupTabNavigation();
  setupEventListeners();
  loadFeedbackList();
});

// Fetch current laboratory environment status
async function fetchLabStatus() {
  try {
    const res = await fetch('/api/lab/status');
    const data = await res.json();
    currentLabState.isSecureMode = data.isSecureMode;
    currentLabState.modeLabel = data.modeLabel;
    updateModeUI();
  } catch (err) {
    console.error('Failed to fetch lab status:', err);
  }
}

// Update UI elements based on Vulnerable vs Secure mode
function updateModeUI() {
  const vulnBtn = document.getElementById('btn-mode-vuln');
  const secureBtn = document.getElementById('btn-mode-secure');
  const bannerBadge = document.getElementById('current-mode-badge');
  const bannerDesc = document.getElementById('current-mode-desc');

  if (currentLabState.isSecureMode) {
    vulnBtn.classList.remove('active', 'vuln');
    secureBtn.classList.add('active', 'secure');
    bannerBadge.className = 'severity-pill sev-low';
    bannerBadge.textContent = 'SECURE / REMEDIATED';
    bannerDesc.textContent = 'Defenses active: Prepared statements, object authorization, HTML encoding, bcrypt hashing & rate limits.';
  } else {
    secureBtn.classList.remove('active', 'secure');
    vulnBtn.classList.add('active', 'vuln');
    bannerBadge.className = 'severity-pill sev-critical';
    bannerBadge.textContent = 'VULNERABLE / LAB MODE';
    bannerDesc.textContent = 'All 5 educational vulnerabilities are currently active and exploitable for assessment.';
  }
}

// Toggle lab mode
async function toggleMode(secure) {
  try {
    logToInspector('POST /api/lab/toggle-mode', { secure });
    const res = await fetch('/api/lab/toggle-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secure })
    });
    const data = await res.json();
    currentLabState.isSecureMode = data.isSecureMode;
    currentLabState.modeLabel = data.modeLabel;
    updateModeUI();
    logToInspector(`[STATUS 200] Mode updated: ${data.modeLabel}`, data);
  } catch (err) {
    console.error('Failed to toggle mode:', err);
  }
}

// Reset Database
async function resetLabDatabase() {
  if (!confirm('Reset the database to initial seed data?')) return;
  try {
    logToInspector('POST /api/lab/reset-db', {});
    const res = await fetch('/api/lab/reset-db', { method: 'POST' });
    const data = await res.json();
    logToInspector('[STATUS 200] Database Reset Complete', data);
    alert('Laboratory database has been reset to seed values.');
    loadFeedbackList();
  } catch (err) {
    console.error('Failed to reset DB:', err);
  }
}

// Tab navigation handler
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(`panel-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// Setup Event Listeners for Stations
function setupEventListeners() {
  document.getElementById('btn-mode-vuln').addEventListener('click', () => toggleMode(false));
  document.getElementById('btn-mode-secure').addEventListener('click', () => toggleMode(true));
  document.getElementById('btn-reset-db').addEventListener('click', resetLabDatabase);

  // Station 1: SQL Injection
  document.getElementById('form-sqli').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('input-sqli-query').value;
    const url = `/api/users/search?q=${encodeURIComponent(query)}`;
    logToInspector(`GET ${url}`);
    const res = await fetch(url);
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] SQL Query Result`, data);
    renderStation1Results(data);
  });

  // Station 2: IDOR
  document.getElementById('form-idor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statementId = document.getElementById('input-idor-id').value;
    const simulatedUserId = document.getElementById('select-idor-user').value;
    const url = `/api/statements/${statementId}`;
    
    logToInspector(`GET ${url} [Header: x-user-id: ${simulatedUserId}]`);
    const res = await fetch(url, {
      headers: { 'x-user-id': simulatedUserId }
    });
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] IDOR Test Result`, data);
    renderStation2Results(data, res.status);
  });

  // Station 3: XSS Form Submission
  document.getElementById('form-xss').addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('input-xss-author').value;
    const category = document.getElementById('select-xss-category').value;
    const message = document.getElementById('input-xss-msg').value;

    logToInspector('POST /api/feedback', { author, category, message });
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, category, message })
    });
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] Feedback Submission`, data);
    loadFeedbackList();
  });

  // Station 4: Auth & Credential Leakage
  document.getElementById('form-auth').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('input-auth-user').value;
    const password = document.getElementById('input-auth-pass').value;

    logToInspector('POST /api/auth/login', { username, password });
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] Authentication Response`, data);
    renderStation4Results(data, res.status);
  });

  // Station 5: Misconfiguration / Debug Dump
  document.getElementById('btn-test-debug').addEventListener('click', async () => {
    const url = '/api/system/debug';
    logToInspector(`GET ${url}`);
    const res = await fetch(url);
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] Debug Diagnostic Output`, data);
    renderStation5Results(data, res.status);
  });

  document.getElementById('btn-test-crash').addEventListener('click', async () => {
    const url = '/api/system/crash-test';
    logToInspector(`GET ${url}`);
    const res = await fetch(url);
    const data = await res.json();
    logToInspector(`[STATUS ${res.status}] Exception Response`, data);
    renderStation5Results(data, res.status);
  });
}

// Helper to fill quick payloads from chips
function fillPayload(inputId, text) {
  const el = document.getElementById(inputId);
  if (el) {
    el.value = text;
    el.focus();
  }
}

// Display results in station containers
function renderStation1Results(data) {
  const container = document.getElementById('result-sqli');
  container.innerHTML = `
    <div style="background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 6px; border: 1px solid #1f293d;">
      <div style="font-size: 0.75rem; color: #38bdf8; margin-bottom: 4px;">Executed SQL:</div>
      <code style="color: #fca5a5; font-size: 0.8rem;">${escapeHtml(data.executedSql || '')}</code>
      <div style="margin-top: 8px; font-size: 0.8rem; color: #94a3b8;">Records Retrieved: <strong>${data.count ?? 0}</strong></div>
    </div>
  `;
}

function renderStation2Results(data, status) {
  const container = document.getElementById('result-idor');
  if (status === 200) {
    container.innerHTML = `
      <div style="background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 6px; border: 1px solid ${data.authorizationBypassed ? '#ef4444' : '#10b981'};">
        <div style="font-weight: 600; color: ${data.authorizationBypassed ? '#f87171' : '#34d399'}; font-size: 0.85rem;">
          ${data.authorizationBypassed ? '⚠️ IDOR BREACH DETECTED: Unauthorized Access' : '✓ Authorized Access'}
        </div>
        <div style="font-size: 0.8rem; margin-top: 4px; color: #cbd5e1;">
          Statement ID: ${data.data.id} | Amount: $${data.data.amount} | Ref: ${data.data.reference_no}
        </div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
          Record Owner: <strong>${data.data.owner_username}</strong> | Requester: <strong>${data.authenticatedAs.username}</strong>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 0.75rem; border-radius: 6px; color: #fca5a5; font-size: 0.8rem;">
        ⛔ ${data.message || 'Access Denied'}
      </div>
    `;
  }
}

async function loadFeedbackList() {
  try {
    const res = await fetch('/api/feedback');
    const data = await res.json();
    const container = document.getElementById('feedback-feed');
    if (!container) return;

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<div style="color: #64748b; font-size: 0.8rem;">No feedback recorded yet.</div>';
      return;
    }

    container.innerHTML = data.items.map(item => {
      // In Vulnerable mode, the item.message is deliberately rendered raw to demonstrate DOM-based or Stored XSS
      const renderContent = currentLabState.isSecureMode ? escapeHtml(item.message) : item.message;
      return `
        <div style="background: #090d16; border: 1px solid #1f293d; padding: 0.6rem; border-radius: 6px; margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">
            <span><strong>${escapeHtml(item.author)}</strong> (${escapeHtml(item.category)})</span>
            <span>${escapeHtml(item.created_at || '')}</span>
          </div>
          <div style="font-size: 0.85rem; color: #e2e8f0;">${renderContent}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load feedback:', err);
  }
}

function renderStation4Results(data, status) {
  const container = document.getElementById('result-auth');
  if (status === 200) {
    const isLeak = !!data.userDataLeaked;
    container.innerHTML = `
      <div style="background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 6px; border: 1px solid ${isLeak ? '#ef4444' : '#10b981'};">
        <div style="font-weight: 600; color: ${isLeak ? '#f87171' : '#34d399'}; font-size: 0.85rem;">
          ${isLeak ? '⚠️ SENSITIVE CREDENTIALS EXPOSED IN RESPONSE' : '✓ SECURE AUTHENTICATION (Masked)'}
        </div>
        <pre style="font-size: 0.75rem; margin-top: 6px; color: #94a3b8;">${JSON.stringify(isLeak ? data.userDataLeaked : data.user, null, 2)}</pre>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 0.75rem; border-radius: 6px; color: #fca5a5; font-size: 0.8rem;">
        ⛔ ${data.message || 'Login failed'}
      </div>
    `;
  }
}

function renderStation5Results(data, status) {
  const container = document.getElementById('result-system');
  container.innerHTML = `
    <div style="background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 6px; border: 1px solid #1f293d;">
      <div style="font-size: 0.75rem; color: #38bdf8; margin-bottom: 4px;">Server Response (HTTP ${status}):</div>
      <pre style="font-size: 0.75rem; color: #e2e8f0; max-height: 180px; overflow-y: auto;">${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}

// Live Inspector Terminal logger
function logToInspector(header, details) {
  const inspector = document.getElementById('inspector-content');
  if (!inspector) return;

  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.style.marginBottom = '0.75rem';
  entry.style.borderLeft = '2px solid #38bdf8';
  entry.style.paddingLeft = '8px';

  let detailStr = '';
  if (details) {
    detailStr = `<pre style="margin-top: 4px; color: #94a3b8;">${typeof details === 'object' ? JSON.stringify(details, null, 2) : escapeHtml(details)}</pre>`;
  }

  entry.innerHTML = `
    <div style="color: #38bdf8; font-size: 0.75rem;">[${time}] ${escapeHtml(header)}</div>
    ${detailStr}
  `;

  inspector.appendChild(entry);
  inspector.scrollTop = inspector.scrollHeight;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
