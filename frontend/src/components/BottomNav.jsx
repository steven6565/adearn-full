import { Home, PlayCircle, History, Wallet } from 'lucide-react';

const ITEMS = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'ads', label: 'Watch Ads', Icon: PlayCircle },
  { id: 'history', label: 'History', Icon: History },
  { id: 'withdraw', label: 'Withdraw', Icon: Wallet },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md border-t border-white/10 bg-[#0a0f26]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-4">
        {ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${active ? 'text-violet-300' : 'text-slate-400'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
