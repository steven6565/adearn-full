import { monetag } from './monetag.js';
import { adsgram } from './adsgram.js';

const providers = { monetag, adsgram };

/** The active provider comes from env only — never from the frontend. */
export function activeProvider() {
  const name = (process.env.AD_PROVIDER || 'none').toLowerCase();
  const provider = providers[name];
  if (!provider || !provider.isConfigured()) return null;
  return provider;
}

export function providerStatus() {
  const provider = activeProvider();
  if (!provider) {
    return {
      configured: false,
      provider: null,
      availableAds: 0,
      message: 'Ads are not connected yet. Connect Monetag in the backend (MONETAG_ZONE_ID + postback URL) — no fake ads are shown and no credits are given until a provider confirms a real ad.',
    };
  }
  return {
    configured: true,
    provider: provider.name,
    // Real fill is decided by the provider at show time, not by us.
    // We do not invent an "available ads" number.
    availableAds: null,
    message: 'Ads connected. Rewards are credited only after the provider confirms completion on the server.',
    clientConfig: provider.clientConfig(),
  };
}
