import { db } from './db.js';

const DAILY_CAP = Number(process.env.DAILY_CREDIT_CAP || 20);

/**
 * Credit a provider-confirmed ad, keyed by its provider event id (ymid).
 * This is the ONLY credit path. It is called from a postback handler, never
 * from a frontend click.
 *
 * Steps, all in one transaction:
 *  1. Find the pending claim the authenticated user registered for this ymid.
 *     Registering alone (frontend sends ymid after the ad shows) never credits.
 *  2. Re-check the daily cap inside the transaction.
 *  3. Flip pending -> completed, bump balance, write the transaction row.
 * A retried postback finds no pending row, so it cannot double-pay.
 * provider_event_id is also UNIQUE in the schema as a second guard.
 */
export async function creditByEventId({ provider, providerEventId }) {
  if (!providerEventId) return { credited: false, reason: 'missing_event_id' };
  return db.tx(async (client) => {
    const claimRes = await client.query(
      `SELECT av.id, av.user_id, av.reward, u.total_credits
       FROM ad_views av JOIN users u ON u.id = av.user_id
       WHERE av.provider = $1 AND av.provider_event_id = $2 AND av.status = 'pending'
       FOR UPDATE`,
      [provider, providerEventId],
    );
    if (claimRes.rows.length === 0) return { credited: false, reason: 'no_pending_claim_or_duplicate' };
    const claim = claimRes.rows[0];

    const todayRes = await client.query(
      `SELECT COALESCE(SUM(reward), 0) AS total FROM ad_views
       WHERE user_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE`,
      [claim.user_id],
    );
    if (Number(todayRes.rows[0].total) + claim.reward > DAILY_CAP) {
      return { credited: false, reason: 'daily_cap' };
    }

    await client.query(
      `UPDATE ad_views SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [claim.id],
    );
    await client.query(
      'UPDATE users SET total_credits = total_credits + $1 WHERE id = $2',
      [claim.reward, claim.user_id],
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'earn', $2, $3)`,
      [claim.user_id, claim.reward, `Rewarded ad completed via ${provider}`],
    );
    return { credited: true, newBalance: claim.total_credits + claim.reward };
  });
}
