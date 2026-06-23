import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

const todayISO  = () => new Date().toISOString().split('T')[0];
const n         = v => Number(v) || 0;
const round     = v => Math.round(n(v));

const MACROS = [
  { key: 'calories',  devKey: 'dev_calories', label: 'Calorias',      unit: 'kcal' },
  { key: 'protein_g', devKey: 'dev_protein',  label: 'Proteínas',     unit: 'g'    },
  { key: 'carbs_g',   devKey: 'dev_carbs',    label: 'Carboidratos',  unit: 'g'    },
  { key: 'fat_g',     devKey: 'dev_fat',       label: 'Gordura',       unit: 'g'    },
  { key: 'fiber_g',   devKey: 'dev_fiber',    label: 'Fibra',         unit: 'g'    },
  { key: 'sugar_g',   devKey: 'dev_sugar',    label: 'Açúcar',        unit: 'g'    },
];

const MEAL_ICONS = { café: '🌅', almoço: '☀️', jantar: '🌙', lanche: '🍎', ceia: '🌙' };
const mealIcon = type => {
  const k = Object.keys(MEAL_ICONS).find(k => type.toLowerCase().includes(k));
  return k ? MEAL_ICONS[k] : '🍽️';
};

// ── Macro progress bar ────────────────────────────────────────────────────────

function MacroBar({ label, total, meta, unit }) {
  const pct    = meta > 0 ? Math.min((total / meta) * 100, 100) : 0;
  const saldo  = meta - total;
  const isOver = saldo < 0;
  const bar    = isOver ? 'bg-red-400' : pct >= 90 ? 'bg-amber-400' : 'bg-green-400';
  return (
    <div className="grid grid-cols-[1fr_44px_44px_60px] items-center gap-x-3 py-2.5 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm text-gray-700 mb-1.5">{label}</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-800 text-right">{round(total)}</span>
      <span className="text-xs text-gray-400 text-right">{round(meta)}</span>
      <span className={`text-xs font-medium text-right ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
        {isOver ? `−${round(Math.abs(saldo))}` : `+${round(saldo)}`}
        <span className="text-gray-300 ml-0.5 text-[10px]">{unit}</span>
      </span>
    </div>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────

function MealCard({ meal, compliance, onUpdate, onReset }) {
  const status = compliance?.status ?? 'pending';
  const [devOpen,   setDevOpen]   = useState(status === 'deviated');
  const [devFood,   setDevFood]   = useState(compliance?.dev_food || '');
  const [devMacros, setDevMacros] = useState({
    dev_calories: compliance?.dev_calories || '',
    dev_protein:  compliance?.dev_protein  || '',
    dev_carbs:    compliance?.dev_carbs    || '',
    dev_fat:      compliance?.dev_fat      || '',
    dev_fiber:    compliance?.dev_fiber    || '',
    dev_sugar:    compliance?.dev_sugar    || '',
  });

  const saveDeviation = () => onUpdate('deviated', { dev_food: devFood, ...devMacros });
  const markComplied  = () => { setDevOpen(false); onUpdate('complied', {}); };
  const handleReset   = () => { setDevOpen(false); onReset(); };

  const isComplied = status === 'complied';
  const isDeviated = status === 'deviated';

  return (
    <div className={`rounded-2xl border transition-colors ${
      isComplied ? 'border-green-200 bg-green-50/40'
      : isDeviated ? 'border-red-200 bg-red-50/30'
      : 'border-gray-100 bg-white'
    } p-4 mb-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">{mealIcon(meal.meal_type)}</span>
            <p className="font-semibold text-gray-900 text-sm">{meal.meal_type}</p>
            {isComplied && <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">✓ Cumprido</span>}
            {isDeviated && <span className="text-[10px] font-semibold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">✗ Desviou</span>}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{meal.description}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {round(meal.calories)} kcal &nbsp;·&nbsp;
            P {round(meal.protein_g)}g &nbsp;·&nbsp;
            C {round(meal.carbs_g)}g &nbsp;·&nbsp;
            G {round(meal.fat_g)}g
          </p>
        </div>

        {status === 'pending' && (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={markComplied}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors"
            >✅ Cumpri</button>
            <button
              onClick={() => setDevOpen(v => !v)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
            >❌ Desviou</button>
          </div>
        )}
        {status !== 'pending' && (
          <button onClick={handleReset} className="text-gray-300 hover:text-gray-500 p-1 shrink-0" title="Desfazer">
            <X size={14} />
          </button>
        )}
      </div>

      {(devOpen || isDeviated) && (
        <div className="mt-3 pt-3 border-t border-red-100 space-y-2.5">
          <p className="text-xs font-medium text-gray-600">O que você comeu?</p>
          <textarea
            className="input text-sm resize-none h-16 w-full"
            placeholder="Ex: X-Burguer com batata frita e refrigerante…"
            value={devFood}
            onChange={e => setDevFood(e.target.value)}
          />
          <p className="text-[11px] text-gray-400">Preencha os macros abaixo (estimativa):</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { dk: 'dev_calories', label: 'Calorias',     unit: 'kcal' },
              { dk: 'dev_protein',  label: 'Proteínas',    unit: 'g' },
              { dk: 'dev_carbs',    label: 'Carboidratos', unit: 'g' },
              { dk: 'dev_fat',      label: 'Gordura',      unit: 'g' },
              { dk: 'dev_fiber',    label: 'Fibra',        unit: 'g' },
              { dk: 'dev_sugar',    label: 'Açúcar',       unit: 'g' },
            ].map(({ dk, label, unit }) => (
              <div key={dk} className="relative">
                <input
                  type="number" step="0.1" min="0"
                  className="input text-xs py-1.5 pr-7 w-full"
                  placeholder={label}
                  value={devMacros[dk]}
                  onChange={e => setDevMacros(m => ({ ...m, [dk]: e.target.value }))}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">{unit}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveDeviation} className="btn-primary text-xs py-1.5">
              <Check size={12} className="inline mr-1" />Salvar
            </button>
            <button onClick={() => setDevOpen(false)} className="btn-ghost text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main macro panel ──────────────────────────────────────────────────────────

export default function Nutrition() {
  const [date,       setDate]       = useState(todayISO());
  const [mealPlans,  setMealPlans]  = useState([]);
  const [compliance, setCompliance] = useState([]);

  const loadAll = async () => {
    const [plansRes, compRes] = await Promise.all([
      axios.get('/api/meal-plans'),
      axios.get(`/api/compliance?date=${date}`),
    ]);
    setMealPlans(plansRes.data);
    setCompliance(compRes.data);
  };

  useEffect(() => { loadAll(); }, [date]);

  const compByMeal = useMemo(() =>
    Object.fromEntries(compliance.map(c => [c.meal_plan_id, c])),
    [compliance]
  );

  const planTotals = useMemo(() =>
    MACROS.reduce((acc, m) => {
      acc[m.key] = mealPlans.reduce((s, p) => s + n(p[m.key]), 0);
      return acc;
    }, {}),
    [mealPlans]
  );

  const consumed = useMemo(() =>
    MACROS.reduce((acc, m) => {
      acc[m.key] = compliance.reduce((s, c) => {
        if (c.status === 'complied') {
          const plan = mealPlans.find(p => Number(p.id) === Number(c.meal_plan_id));
          return s + n(plan?.[m.key]);
        }
        if (c.status === 'deviated') return s + n(c[m.devKey]);
        return s;
      }, 0);
      return acc;
    }, {}),
    [compliance, mealPlans]
  );

  const shiftDay = delta => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday   = date === todayISO();
  const dateLabel = isToday
    ? 'Hoje'
    : new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });

  const updateCompliance = async (mealId, status, devData) => {
    const d     = new Date(date + 'T12:00:00');
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();
    await axios.post('/api/compliance', { date, meal_plan_id: mealId, status, ...devData, month, year });
    loadAll();
  };

  const resetCompliance = async (mealId) => {
    const c = compByMeal[mealId];
    if (c?.id) { await axios.delete(`/api/compliance/${c.id}`); loadAll(); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
        <p className="text-xs text-gray-400 mt-0.5">Cardápio do nutricionista Gustavo Fonseca</p>
      </div>

      {mealPlans.length > 0 && (
        <div className="card mb-6">
          {/* Date nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <button onClick={() => shiftDay(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-36 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none mb-0.5">Macros do dia</p>
                <p className="font-semibold text-gray-900 text-sm capitalize">{dateLabel}</p>
              </div>
              <button
                onClick={() => shiftDay(1)}
                disabled={isToday}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              {compliance.filter(c => c.status === 'complied').length}/{mealPlans.length} refeições cumpridas
            </p>
          </div>

          {/* Macro bars */}
          <div className="grid grid-cols-[1fr_44px_44px_60px] gap-x-3 mb-1">
            <span />
            <span className="text-[10px] text-gray-400 text-right">Ingerido</span>
            <span className="text-[10px] text-gray-400 text-right">Meta</span>
            <span className="text-[10px] text-gray-400 text-right">Saldo</span>
          </div>
          {MACROS.map(m => (
            <MacroBar key={m.key} label={m.label} unit={m.unit} total={consumed[m.key]} meta={planTotals[m.key]} />
          ))}

          {/* Meal cards */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-3">Refeições do dia</p>
            {mealPlans.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                compliance={compByMeal[meal.id] ?? null}
                date={date}
                onUpdate={(status, devData) => updateCompliance(meal.id, status, devData)}
                onReset={() => resetCompliance(meal.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
