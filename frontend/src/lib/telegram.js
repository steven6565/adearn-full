// Telegram WebApp helpers. initDataUnsafe is display-only here;
// the raw initData string is what the backend verifies.
export function getTelegram() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
  return tg || null;
}

export function getInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

export function getDisplayUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}
