import { History as HistoryIcon, Coins } from 'lucide-react';

export default function History({ data }) {
  const history = data?.history || [];
  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-xl font-bold">History</h1>
      {history.length === 0 ? (
        <div className="card p-8 text-center">
          <HistoryIcon className="mx-auto text-slate-500" size={40} />
          <h2 className="mt-3 font-bold">No history yet</h2>
          <p className="mt-1 text-sm text-slate-400">Completed ads and credits earned will appear here with their dates.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((t) => (
            <div key={t.id} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Coins className="text-violet-300" size={20} />
                <div>
                  <p className="text-sm font-medium">{t.description || 'Ad reward'}</p>
                  <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
                </div>
              </div>
              <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {t.amount >= 0 ? `+${t.amount}` : t.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
