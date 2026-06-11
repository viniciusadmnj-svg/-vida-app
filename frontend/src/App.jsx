import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Diary from './pages/Diary';
import Workouts from './pages/Workouts';
import Finance from './pages/Finance';
import Nutrition from './pages/Nutrition';
import Work from './pages/Work';

const PAGES = {
  dashboard: Dashboard,
  goals:     Goals,
  diary:     Diary,
  workouts:  Workouts,
  finance:   Finance,
  nutrition: Nutrition,
  work:      Work,
};

export default function App() {
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const Page = PAGES[page];

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f4f0]">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        md:relative md:z-auto md:translate-x-0
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar current={page} onNavigate={navigate} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3.5 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 p-0.5 -ml-0.5"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold tracking-tight text-gray-900">✦ Vida</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Page />
        </main>
      </div>
    </div>
  );
}
