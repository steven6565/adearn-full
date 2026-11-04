import { useState } from 'react';
import { PlayCircle, Coins, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { showRewardedAd } from '../lib/monetag.js';

export default function WatchAds({ adsStatus, refresh }) {
  const [phase, setPhase] = useState('idle'); // idle | loading | waiting | done | error
  const [message, setMessage] = useState('');

  async function pollForCredit(startBalance) {
    // The provider postback can take seconds to minutes. Poll for up to 90s.
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const fresh = await refresh();
        if (fresh && (fresh.user?.total_credits ?? 0) > startBalance) {
          setPhase('done');
          return;
        }
      } catch { /* keep polling */ }
    }
    setPhase('error');
    setMessage('Still waiting for the provider confirmation. If the ad completed, the credit will appear once Monetag confirms it — check History later. No credit was given from this device alone.');
  }

  async function handleWatch() {
    setPhase('loading');
    setMessage('');
    try {
      const start = await api.adsStart();
      const startData = await refresh();
      const startBalance = startData?.user?.total_credits ?? 0;
      setPhase('loading');
      // This is the real provider call. If the tag is not installed, it throws
      // and we stop here — deliberately, with no fake credit and no fake success.
      const ymid = await showRewardedAd(start.clientConfig?.zoneId);
      if (!ymid) throw new Error('Provider did not return an ad event id.');
      await api.adsRegister(ymid, start.provider);
      setPhase('waiting');
      setMessage('Ad finished on your device. Waiting for the provider to confirm it on the server before any credit is given…');
      await pollForCredit(startBalance);
    } catch (err) {
      setPhase('error');
      setMessage(err.message || 'Could not show an ad.');
    }
  }

  if (!adsStatus) {
    return <div className="card p-5 text-center text-sm text-slate-400">Checking ad availability…</div>;
  }

  if (!adsStatus.configured) {
    return (
      <div className="space-y-5">
        <h1 className="pt-2 text-xl font-bold">Watch Ads</h1>
        <div className="card p-5 text-center">
          <AlertTriangle className="mx-auto text-amber-300" size={36} />
          <h2 className="mt-3 font-bold">Ads are not connected yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{adsStatus.message}</p>
          <p className="mt-3 text-sm text-slate-400">
            Owner setup: create a Monetag rewarded zone, paste its tag in <code>src/lib/monetag.js</code>, set its postback URL, then set <code>AD_PROVIDER=monetag</code> on the backend.
          </p>
        </div>
        <button disabled className="w-full cursor-not-allowed rounded-2xl bg-white/10 py-4 font-bold text-slate-400">
          Watch Ad — unavailable until a provider is connected
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-bold">Watch Ads</h1>
      <div className="card p-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-slate-300"><Coins className="text-violet-300" /> Reward: 1 credit per completed ad</p>
        <p className="mt-1 text-xs text-slate-400">Credit is added only after the provider confirms completion on the server.</p>
      </div>

      {phase === 'loading' && (
        <div className="card pop p-6 text-center">
          <div className="spinner" />
          <p className="mt-4 font-medium">Advertisement running…</p>
          <p className="text-sm text-slate-400">Please wait until it finishes.</p>
        </div>
      )}
      {phase === 'waiting' && (
        <div className="card pop p-6 text-center">
          <div className="spinner" />
          <p className="mt-4 font-medium">Waiting for provider confirmation…</p>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      )}
      {phase === 'done' && (
        <div className="card pop border-emerald-400/40 p-6 text-center">
          <CheckCircle2 className="mx-auto text-emerald-300" size={48} />
          <h2 className="mt-3 text-lg font-bold">+1 credit earned!</h2>
          <p className="text-sm text-slate-300">Confirmed by the provider. Your balance has been updated.</p>
          <button onClick={() => setPhase('idle')} className="btn-gradient mt-4 w-full rounded-2xl py-3 font-bold">Watch another</button>
        </div>
      )}
      {phase === 'error' && (
        <div className="card pop p-5 text-center">
          <AlertTriangle className="mx-auto text-amber-300" size={32} />
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{message}</p>
          <button onClick={() => setPhase('idle')} className="btn-gradient mt-4 w-full rounded-2xl py-3 font-bold">Try again</button>
        </div>
      )}
      {phase === 'idle' && (
        <button onClick={handleWatch} className="btn-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold">
          <PlayCircle /> Watch Ad
        </button>
      )}
      <p className="text-center text-xs text-slate-500">Status: provider connected ({adsStatus.provider}). Duplicate rewards are blocked by the provider event id.</p>
    </div>
  );
}
