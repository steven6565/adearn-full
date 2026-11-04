import { Coins, PlayCircle, CalendarDays, TrendingUp } from 'lucide-react';

export default function Home({ data, onWatch }) {
  const user = data?.user;
  const name = user?.first_name || 'there';
  const username = user?.username ? `@${user.username}` : user ? `ID ${user.telegram_id}` : 'Open from Telegram';
  const recent = (data?.history || []).slice(0, 5);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pt-2">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-violet-400/60" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-500/30 text-lg font-bold">
            {(name[0] || 'A').toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm text-slate-400">Welcome back,</p>
          <h1 className="text-xl font-bold leading-tight">{name}</h1>
          <p className="text-xs text-slate-400">{username}</p>
        </div>
      </header>

      <section className="card btn-gradient p-5">
        <p className="text-sm text-violet-100/90">Available balance</p>
        <p className="mt-1 flex items-center gap-2 text-4xl font-extrabold">
          <Coins size={30} /> {user?.total_credits ?? 0}
          <span className="text-base font-medium text-violet-100/90">credits</span>
        </p>
        <p className="mt-2 text-sm text-violet-100/80">1 completed ad = 1 credit. Credits are in-app points in v1.</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <TrendingUp className="mx-auto text-violet-300" size={20} />
          <p className="mt-1 text-lg font-bold">{data?.adsWatched ?? 0}</p>
          <p className="text-[11px] text-slate-400">Ads watched</p>
        </div>
        <div className="card p-3 text-center">
          <CalendarDays className="mx-auto text-violet-300" size={20} />
          <p className="mt-1 text-lg font-bold">{data?.todayCredits ?? 0}</p>
          <p className="text-[11px] text-slate-400">Today</p>
        </div>
        <div className="card p-3 text-center">
          <Coins className="mx-auto text-violet-300" size={20} />
          <p className="mt-1 text-lg font-bold">{user?.total_credits ?? 0}</p>
          <p className="text-[11px] text-slate-400">Total credits</p>
        </div>
      </section>

      <button onClick={onWatch} className="btn-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold">
        <PlayCircle /> Watch Ads
      </button>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Recent earning activity</h2>
        {recent.length === 0 ? (
          <div className="card p-4 text-center text-sm text-slate-400">
            No earnings yet. Watch your first verified ad to see it here.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="card flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{t.description || 'Ad reward'}</p>
                  <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className="font-bold text-emerald-300">+{t.amount}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
