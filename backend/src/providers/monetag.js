import { creditByEventId } from '../credit.js';

/**
 * Monetag (v1 verified provider).
 * Correct flow — no step here trusts the device for money:
 *  1. Frontend: POST /api/ads/start (checks daily cap, user exists)
 *  2. Frontend: shows the Monetag rewarded ad, gets its ymid from the SDK
 *  3. Frontend: POST /api/ads/register { ymid } with Telegram initData.
 *     This only records "user X saw ymid Y". It credits NOTHING.
 *  4. Monetag's server: GET /api/postback/monetag?secret=...&ymid={ymid}
 *     AFTER it confirms the event. Only this step credits, once per ymid.
 * Configure this exact postback URL in the Monetag dashboard, with only
 * valued events routed to it. Monetag retries postbacks for hours, and
 * retries are safe here: the second call finds no pending claim.
 */
export const monetag = {
  name: 'monetag',
  isConfigured() {
    return Boolean(process.env.MONETAG_ZONE_ID && process.env.POSTBACK_SECRET);
  },
  clientConfig() {
    return { zoneId: process.env.MONETAG_ZONE_ID || null };
  },
  async handlePostback(req, res) {
    if (req.query.secret !== process.env.POSTBACK_SECRET) {
      return res.status(403).send('forbidden');
    }
    const ymid = req.query.ymid;
    if (!ymid) return res.status(400).send('missing ymid');
    const result = await creditByEventId({ provider: 'monetag', providerEventId: ymid });
    // Always 200 for duplicates / no-pending: Monetag should stop retrying.
    return res.status(200).send(result.credited ? 'ok' : `ignored:${result.reason}`);
  },
};
