/**
 * Canopy push server — the piece that makes reminders arrive even when
 * the app (and the browser) are fully closed.
 *
 * What it does:
 *   1. Accepts a browser's push subscription (POST /subscribe).
 *   2. Accepts the current list of pending reminders from the client
 *      (POST /reminders) — title, body, and when it's due.
 *   3. Once a minute, checks for anything due and sends it via real
 *      Web Push (using the `web-push` library, which implements the
 *      actual encryption/signing — nothing here hand-rolls crypto).
 *
 * What it deliberately doesn't do:
 *   - No user accounts, no multi-tenant anything. This is built for one
 *     person running their own instance, protected by a shared secret.
 *   - No database — reminders/subscriptions live in a local data.json
 *     file. Fine for personal use; swap for a real DB if this ever
 *     needs to serve more than a handful of devices.
 *   - It has NOT been run end-to-end by the assistant that wrote it —
 *     there was no network access available to install dependencies
 *     or test a real push round-trip in that environment. This follows
 *     the standard, documented `web-push` usage pattern, but treat this
 *     as a solid first draft to verify yourself, not a guarantee.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { subscriptions: [], reminders: [] };
  }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error(
    'Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env\n' +
    'Generate a pair with: npx web-push generate-vapid-keys'
  );
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// A shared secret, not real auth — this is a single-user personal
// server, not a public service. Anyone who has this string can post
// fake reminders or read the subscription; keep it private the same
// way you'd keep an API key private.
const SHARED_SECRET = process.env.SHARED_SECRET;
function requireAuth(req, res, next) {
  if (!SHARED_SECRET) return next(); // no secret set — fine for local testing only, not for a public deploy
  if (req.headers['x-canopy-secret'] !== SHARED_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.get('/', (req, res) => res.json({ ok: true, service: 'canopy-push-server' }));

app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Register (or replace) this device's push subscription.
app.post('/subscribe', requireAuth, (req, res) => {
  const { subscription } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'missing subscription' });
  }
  const data = loadData();
  data.subscriptions = data.subscriptions.filter(s => s.endpoint !== subscription.endpoint);
  data.subscriptions.push(subscription);
  saveData(data);
  res.json({ ok: true });
});

app.post('/unsubscribe', requireAuth, (req, res) => {
  const { endpoint } = req.body || {};
  const data = loadData();
  data.subscriptions = data.subscriptions.filter(s => s.endpoint !== endpoint);
  saveData(data);
  res.json({ ok: true });
});

// Replace the full set of pending reminders. The client re-sends this
// whole list whenever its local reminder schedule changes, so the
// server's picture of "what's due and when" stays current without
// needing incremental diff/patch logic.
app.post('/reminders', requireAuth, (req, res) => {
  const { reminders } = req.body || {};
  if (!Array.isArray(reminders)) {
    return res.status(400).json({ error: 'reminders must be an array' });
  }
  const data = loadData();
  data.reminders = reminders.map(r => ({
    id: r.id,
    title: r.title,
    body: r.body || '',
    sendAt: r.sendAt, // epoch ms
    sent: false
  }));
  saveData(data);
  res.json({ ok: true, count: data.reminders.length });
});

async function sendToAllSubscriptions(payload) {
  const data = loadData();
  const stillValid = [];
  for (const sub of data.subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      stillValid.push(sub);
    } catch (err) {
      // 404/410 means the subscription is dead (uninstalled, revoked,
      // expired) — drop it instead of retrying forever. Anything else,
      // keep it and just log the failure.
      if (err.statusCode !== 410 && err.statusCode !== 404) stillValid.push(sub);
      console.error('push send failed:', err.statusCode, err.body || err.message);
    }
  }
  data.subscriptions = stillValid;
  saveData(data);
}

// Runs every minute: anything due and not yet sent gets pushed to every
// registered subscription (in practice, one — your own device/browser).
setInterval(async () => {
  const data = loadData();
  const now = Date.now();
  const due = data.reminders.filter(r => !r.sent && r.sendAt <= now);
  if (!due.length) return;
  for (const r of due) {
    await sendToAllSubscriptions({ title: r.title, body: r.body });
    r.sent = true;
  }
  saveData(data);
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Canopy push server listening on :' + PORT));
