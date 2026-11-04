import { useEffect, useState, useCallback } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Home from './screens/Home.jsx';
import WatchAds from './screens/WatchAds.jsx';
import History from './screens/History.jsx';
import Withdraw from './screens/Withdraw.jsx';
import { api } from './lib/api.js';
import { getTelegram, getDisplayUser } from './lib/telegram.js';

export default function App() {
  const [tab, setTab] = useState('home');
  const [data, setData] = useState(null);
  const [adsStatus, setAdsStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const inTelegram = Boolean(window.Telegram?.WebApp?.initData);

  const refresh = useCallback(async () => {
    const fresh = await api.me();
    setData(fresh);
    return fresh;
  }, []);

  useEffect(() => {
    getTelegram();
    api.adsStatus().then(setAdsStatus).catch(() => setAdsStatus(null));
    if (!inTelegram) {
      // Still render the screens with zero state so the UI can be previewed,
      // but no account is created and no credit can be earned outside Telegram.
      const preview = getDisplayUser();
      setData(preview ? { user: { first_name: preview.first_name, username: preview.username, total_credits: 0 }, adsWatched: 0, todayCredits: 0, history: [] } : null);
      setLoading(false);
      return;
    }
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inTelegram, refresh]);

  if (loading) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-6">
        <div className="text-center"><div className="spinner" /><p className="mt-4 text-slate-300">Loading AdEarn…</p></div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#070b1d] px-5 pb-28 pt-2">
      {!inTelegram && (
        <div className="card mb-4 border-amber-400/30 p-3 text-center text-sm text-amber-200">
          Preview mode: open this app from your Telegram bot to log in and earn. Nothing here is credited outside Telegram.
        </div>
      )}
      {error && (
        <div className="card mb-4 border-rose-400/30 p-3 text-sm text-rose-200">
          {error} — if you just deployed the backend, check VITE_API_URL and that the backend is awake (Render free tier sleeps after 15 min idle).
        </div>
      )}
      {tab === 'home' && <Home data={data} onWatch={() => setTab('ads')} />}
      {tab === 'ads' && <WatchAds adsStatus={adsStatus} refresh={refresh} />}
      {tab === 'history' && <History data={data} />}
      {tab === 'withdraw' && <Withdraw data={data} />}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
