import { Wallet, Lock, Clock } from 'lucide-react';

export default function Withdraw({ data }) {
  const balance = data?.user?.total_credits ?? 0;
  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-bold">Withdraw</h1>
      <section className="card p-5 text-center">
        <p className="text-sm text-slate-400">Available credits</p>
        <p className="mt-1 text-4xl font-extrabold">{balance}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-400"><Clock size={14} /> Status: Coming soon</p>
      </section>
      <section className="card border-violet-400/30 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-violet-500/20">
          <Lock className="text-violet-300" size={26} />
        </div>
        <h2 className="mt-4 text-lg font-bold">Withdrawals are coming soon!</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Keep watching ads and collecting credits. Stay tuned for future updates.
        </p>
        <button disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold text-slate-400">
          <Wallet /> Withdraw — locked
        </button>
        <p className="mt-3 text-xs text-slate-500">Withdrawals are intentionally disabled in v1. Credits are in-app points only.</p>
      </section>
    </div>
  );
}
