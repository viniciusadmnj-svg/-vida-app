import { X, LayoutDashboard, Target, BookOpen, Dumbbell, Wallet, Salad, Briefcase } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'goals',     label: 'Metas',       icon: Target          },
  { id: 'diary',     label: 'Diário',      icon: BookOpen        },
  { id: 'workouts',  label: 'Treinos',     icon: Dumbbell        },
  { id: 'finance',   label: 'Financeiro',  icon: Wallet          },
  { id: 'nutrition', label: 'Alimentação', icon: Salad           },
  { id: 'work',      label: 'Trabalho',    icon: Briefcase       },
];

export default function Sidebar({ current, onNavigate, onClose }) {
  return (
    <aside className="w-60 h-full bg-white border-r border-gray-200 flex flex-col pt-7 pb-4 px-3 gap-1 shadow-xl md:shadow-none">
      <div className="px-3 mb-5 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-gray-900">✦ Vida</span>
        {/* Botão fechar só aparece no mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={17} />
        </button>
      </div>

      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full
            ${current === id
              ? 'bg-brand-500/10 text-brand-600'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </aside>
  );
}
