import crypto from 'node:crypto';

/**
 * Verify Telegram WebApp initData on the server.
 * Never trust initDataUnsafe from the client — it can be forged in seconds.
 * Algorithm (Telegram docs): sort all fields except `hash` as `key=<value>`,
 * join with "\n", HMAC-SHA256 with key = SHA256(botToken), compare to `hash`.
 * Also rejects data older than 24h so a leaked initData string cannot be replayed forever.
 */
export function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = Number(params.get('auth_date') || 0);
  if (!hash || !authDate) return null;
  if (Date.now() / 1000 - authDate > 24 * 60 * 60) return null;

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // timingSafeEqual avoids leaking the hash through timing differences.
  if (computed.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))) return null;

  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

/** Express middleware: client must send raw initData in X-Telegram-Init-Data. */
export function requireTelegramAuth(req, res, next) {
  const initData = req.get('x-telegram-init-data') || req.body?.initData || '';
  const user = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Invalid or expired Telegram login. Open the app from Telegram again.' });
  }
  req.telegramUser = user;
  next();
}
