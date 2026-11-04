/**
 * Monetag SDK integration point — paste YOUR Monetag tag here.
 *
 * Why this file is small on purpose: Monetag gives you an exact script/tag
 * per zone in its dashboard, and that tag (including its function name)
 * differs by account/zone type. Guessing it here would ship a button that
 * looks like it works but never shows a real ad.
 *
 * What to do:
 *  1. In Monetag, create a Rewarded Interstitial zone and copy its tag.
 *  2. Paste the tag loader in this file so showRewardedAd() returns the
 *     ymid Monetag gives you for that impression.
 *  3. Set the same zone's postback URL in Monetag to:
 *     https://<your-render-url>/api/postback/monetag?secret=<POSTBACK_SECRET>&ymid={ymid}
 *  4. Set AD_PROVIDER=monetag and MONETAG_ZONE_ID in the backend env.
 *
 * Until then, WatchAds shows "Ads not connected" and gives NO credit.
 * A ymid returned here is only REGISTERED (see api.adsRegister) — the
 * backend still waits for Monetag's server postback before crediting.
 */
export async function showRewardedAd(_zoneId) {
  throw new Error(
    'Monetag tag not installed yet. Paste your Monetag rewarded tag in src/lib/monetag.js (see the comment there), then set AD_PROVIDER=monetag on the backend.',
  );
}
