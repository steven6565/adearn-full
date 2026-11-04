import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { requireTelegramAuth } from './auth.js';
import { activeProvider, providerStatus } from './providers/index.js';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Upsert the Telegram user on first visit, return dashboard data ---
async function getOrCreateUser(tgUser) {
  const res = await db.query(
    `INSERT INTO users (telegram_id, username, first_name, photo_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE
       SET username = EXCLUDED.username, first_name = EXCLUDED.first_name, photo_url = EXCLUDED.photo_url
     RETURNING *`,
    [tgUser.id, tgUser.username || null, tgUser.first_name || null, tgUser.photo_url || null],
  );
  return res.rows[0];
}

async function dashboardFor(userId) {
  const [userRes, adsRes, todayRes, historyRes] = await Promise.all([
    db.query('SELECT * FROM users WHERE id = $1', [userId]),
    db.query(`SELECT COUNT(*) AS n FROM ad_views WHERE user_id = $1 AND status = 'completed'`, [userId]),
    db.query(
      `SELECT COALESCE(SUM(reward), 0) AS total FROM ad_views
       WHERE user_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE`,
      [userId],
    ),
    db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId],
    ),
  ]);
  return {
    user: userRes.rows[0],
    adsWatched: Number(adsRes.rows[0].n),
    todayCredits: Number(todayRes.rows[0].total),
    history: historyRes.rows,
  };
}

app.post('/api/auth', requireTelegramAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    res.json(await dashboardFor(user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error. Check DATABASE_URL and that schema.sql was run.' });
  }
});

app.get('/api/me', requireTelegramAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.telegramUser);
    res.json(await dashboardFor(user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get('/api/ads/status', (_req, res) => res.json(providerStatus()));

// Step 1 of watching: only checks eligibility. Credits NOTHING.
app.post('/api/ads/start', requireTelegramAuth, async (req, res) => {
  try {
    const provider = activeProvider();
    if (!provider) return res.status(503).json({ error: 'Ads are not connected yet.', ...providerStatus() });
    const user = await getOrCreateUser(req.telegramUser);
    const today = await db.query(
      `SELECT COALESCE(SUM(reward), 0) AS total FROM ad_views
       WHERE user_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE`,
      [user.id],
    );
    const cap = Number(process.env.DAILY_CREDIT_CAP || 20);
    if (Number(today.rows[0].total) >= cap) {
      return res.status(429).json({ error: `Daily limit reached (${cap} credits/day).` });
    }
    res.json({ ok: true, provider: provider.name, clientConfig: provider.clientConfig() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not start ad.' });
  }
});

// Step 3: register the provider event id for this user. Credits NOTHING.
// The provider postback is the only credit trigger (see providers/monetag.js).
app.post('/api/ads/register', requireTelegramAuth, async (req, res) => {
  try {
    const { providerEventId, provider } = req.body || {};
    if (!providerEventId || !provider) return res.status(400).json({ error: 'providerEventId and provider are required.' });
    const user = await getOrCreateUser(req.telegramUser);
    await db.query(
      `INSERT INTO ad_views (user_id, ad_id, provider, provider_event_id, reward, status)
       VALUES ($1, $2, $3, $4, 1, 'pending')
       ON CONFLICT (provider_event_id) DO NOTHING`,
      [user.id, providerEventId, provider, providerEventId],
    );
    res.json({ ok: true, waitingForProviderConfirmation: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not register ad view.' });
  }
});

// Provider postbacks — secret-checked inside each provider handler.
app.get('/api/postback/monetag', async (req, res) => {
  try {
    const { monetag } = await import('./providers/monetag.js');
    await monetag.handlePostback(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});
app.get('/api/postback/adsgram', async (req, res) => {
  const { adsgram } = await import('./providers/adsgram.js');
  await adsgram.handlePostback(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AdEarn backend listening on ${port}`));
