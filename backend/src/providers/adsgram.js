/**
 * Adsgram — modular second provider, NOT enabled in v1.
 * Adsgram's normal flow is a client-side callback, which alone is NOT trusted
 * for credits (it can be forged from the device). Adsgram's server-side
 * Reward URL is the verified path, and it is documented for larger publishers.
 * So this file intentionally does nothing until you configure a server
 * confirmation: add AD_PROVIDER=adsgram, implement handlePostback() the same
 * way monetag.js does (secret check + UNIQUE provider_event_id + credit once),
 * and only then flip the frontend on. Do not wire the client callback to credits.
 */
export const adsgram = {
  name: 'adsgram',
  isConfigured() {
    return false; // Deliberate: no server confirmation configured yet.
  },
  clientConfig() {
    return null;
  },
  async handlePostback(_req, res) {
    return res.status(503).send('adsgram not configured');
  },
};
