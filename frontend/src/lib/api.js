import { getInitData } from './telegram.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function call(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getInitData(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  me: () => call('/api/me', { method: 'GET' }),
  adsStatus: () => fetch(`${API}/api/ads/status`).then((r) => r.json()),
  adsStart: () => call('/api/ads/start', { method: 'POST' }),
  adsRegister: (providerEventId, provider) =>
    call('/api/ads/register', {
      method: 'POST',
      body: JSON.stringify({ providerEventId, provider }),
    }),
};
