import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Upload, FileText, Sparkles,
  Check, X, Pencil, Trash2, Plus,
} from 'lucide-react';

const todayISO  = () => new Date().toISOString().split('T')[0];
const n         = v => Number(v) || 0;
const round     = v => Math.round(n(v));

const MACROS = [
  { key: 'calories',  devKey: 'dev_calories', label: 'Calorias',      unit: 'kcal' },
  { key: 'protein_g', devKey: 'dev_protein',  label: 'Proteínas',     unit: 'g'    },
  { key: 'carbs_g',   devKey: 'dev_carbs',    label: 'Carboidratos',  unit: 'g'    },
  { key: 'fat_g',     devKey: 'dev_fat',      label: 'Gordura',       unit: 'g'    },
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

function MealCard({ meal, compliance, onUpdate, onReset, date }) {
  const status = compliance?.status ?? 'pending';
  const [devOpen,      setDevOpen]      = useState(status === 'deviated');
  const [devFood,      setDevFood]      = useState(compliance?.dev_food      || '');
  const [devMacros,    setDevMacros]    = useState({
    dev_calories: compliance?.dev_calories || '',
    dev_protein:  compliance?.dev_protein  || '',
    dev_carbs:    compliance?.dev_carbs    || '',
    dev_fat:      compliance?.dev_fat      || '',
    dev_fiber:    compliance?.dev_fiber    || '',
    dev_sugar:    compliance?.dev_sugar    || '',
  });
  const [estimating, setEstimating] = useState(false);

  const estimate = async () => {
    if (!devFood.trim()) return;
    setEstimating(true);
    try {
      const { data } = await axios.post('/api/meal-plans/estimate-macros', { food: devFood });
      setDevMacros({
        dev_calories: data.calories  ?? '',
        dev_protein:  data.protein_g ?? '',
        dev_carbs:    data.carbs_g   ?? '',
        dev_fat:      data.fat_g     ?? '',
        dev_fiber:    data.fiber_g   ?? '',
        dev_sugar:    data.sugar_g   ?? '',
      });
    } finally { setEstimating(false); }
  };

  const saveDeviation = () => {
    onUpdate('deviated', { dev_food: devFood, ...devMacros });
  };

  const markComplied = () => {
    setDevOpen(false);
    onUpdate('complied', {});
  };

  const handleReset = () => {
    setDevOpen(false);
    onReset();
  };

  const isComplied  = status === 'complied';
  const isDeviated  = status === 'deviated';

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

        {/* Action buttons */}
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

      {/* Deviation form */}
      {(devOpen || isDeviated) && (
        <div className="mt-3 pt-3 border-t border-red-100 space-y-2.5">
          <p className="text-xs font-medium text-gray-600">O que você comeu?</p>
          <textarea
            className="input text-sm resize-none h-16 w-full"
            placeholder="Ex: X-Burguer com batata frita e refrigerante…"
            value={devFood}
            onChange={e => setDevFood(e.target.value)}
          />
          <button
            onClick={estimate}
            disabled={estimating || !devFood.trim()}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-40 font-medium"
          >
            <Sparkles size={12} />
            {estimating ? 'Estimando…' : 'Estimar macros com IA'}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {[
              { dk: 'dev_calories', label: 'Calorias', unit: 'kcal' },
              { dk: 'dev_protein',  label: 'Proteínas', unit: 'g' },
              { dk: 'dev_carbs',    label: 'Carboidratos', unit: 'g' },
              { dk: 'dev_fat',      label: 'Gordura', unit: 'g' },
              { dk: 'dev_fiber',    label: 'Fibra', unit: 'g' },
              { dk: 'dev_sugar',    label: 'Açúcar', unit: 'g' },
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

// ── PDF upload modal ──────────────────────────────────────────────────────────

function PdfUploadModal({ onClose, onSaved }) {
  const [phase,   setPhase]   = useState('upload'); // upload | parsing | review
  const [meals,   setMeals]   = useState([]);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhase('parsing');
    setError('');
    try {
      const form = new FormData();
      form.append('pdf', file);
      const { data } = await axios.post('/api/meal-plans/parse-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMeals(data.meals.map((m, i) => ({ ...m, _id: i })));
      setPhase('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar PDF');
      setPhase('upload');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.post('/api/meal-plans/bulk', { meals });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const updateMeal = (i, field, val) =>
    setMeals(ms => ms.map((m, j) => j === i ? { ...m, [field]: val } : m));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Importar cardápio — PDF</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>

        {phase === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <FileText size={28} className="text-brand-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800 mb-1">Envie o PDF do seu cardápio</p>
              <p className="text-xs text-gray-400">A IA vai ler e extrair cada refeição com os macros</p>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            <button className="btn-primary" onClick={() => fileRef.current?.click()}>Escolher PDF</button>
          </div>
        )}

        {phase === 'parsing' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Lendo o cardápio…</p>
          </div>
        )}

        {phase === 'review' && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              <span className="font-semibold text-gray-700">{meals.length}</span> refeições encontradas. Revise e ajuste se necessário.
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {meals.map((m, i) => (
                <div key={m._id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/60">
                  <div className="flex gap-2 mb-2">
                    <input
                      className="input py-1 text-sm w-36 shrink-0"
                      placeholder="Refeição"
                      value={m.meal_type}
                      onChange={e => updateMeal(i, 'meal_type', e.target.value)}
                    />
                    <input
                      className="input py-1 text-sm flex-1"
                      placeholder="O que comer"
                      value={m.description}
                      onChange={e => updateMeal(i, 'description', e.target.value)}
                    />
                    <button onClick={() => setMeals(ms => ms.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { f: 'calories',  u: 'kcal' },
                      { f: 'protein_g', u: 'g Prot' },
                      { f: 'carbs_g',   u: 'g Carb' },
                      { f: 'fat_g',     u: 'g Gord' },
                      { f: 'fiber_g',   u: 'g Fibra' },
                      { f: 'sugar_g',   u: 'g Açúcar' },
                    ].map(({ f, u }) => (
                      <div key={f} className="relative">
                        <input
                          type="number" step="0.1" min="0"
                          className="input py-1 text-xs pr-1 w-full text-right"
                          value={m[f] || ''}
                          onChange={e => updateMeal(i, f, e.target.value)}
                        />
                        <span className="absolute -top-2 left-1 text-[9px] text-gray-400">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
              <button className="btn-ghost text-sm" onClick={() => setPhase('upload')}>Trocar PDF</button>
              <button className="btn-primary ml-auto text-sm" onClick={save} disabled={saving || meals.length === 0}>
                {saving ? 'Salvando…' : `Salvar ${meals.length} refeições`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main macro panel ──────────────────────────────────────────────────────────

export default function Nutrition() {
  const [date,       setDate]       = useState(todayISO());
  const [mealPlans,  setMealPlans]  = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  const loadAll = async () => {
    const [plansRes, compRes] = await Promise.all([
      axios.get('/api/meal-plans'),
      axios.get(`/api/compliance?date=${date}`),
    ]);
    setMealPlans(plansRes.data);
    setCompliance(compRes.data);
  };

  useEffect(() => { loadAll(); }, [date]);

  // Compliance keyed by meal_plan_id for O(1) lookup
  const compByMeal = useMemo(() =>
    Object.fromEntries(compliance.map(c => [c.meal_plan_id, c])),
    [compliance]
  );

  // Plan totals (full day if everything followed)
  const planTotals = useMemo(() =>
    MACROS.reduce((acc, m) => {
      acc[m.key] = mealPlans.reduce((s, p) => s + n(p[m.key]), 0);
      return acc;
    }, {}),
    [mealPlans]
  );

  // Consumed totals from compliance records
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

  const hasPlan = mealPlans.length > 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-ghost flex items-center gap-1.5 border border-brand-500/30 text-brand-500 hover:bg-brand-500/5"
        >
          <Upload size={14} /> {hasPlan ? 'Atualizar cardápio' : 'Importar cardápio (PDF)'}
        </button>
      </div>

      {/* No meal plan CTA */}
      {!hasPlan && (
        <div className="card text-center py-12 mb-6">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-700 mb-1">Nenhum cardápio importado</p>
          <p className="text-sm text-gray-400 mb-4">Faça upload do PDF do seu cardápio e a IA extrai cada refeição com os macros automaticamente.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary mx-auto">
            <Upload size={14} className="inline mr-1.5" /> Importar cardápio
          </button>
        </div>
      )}

      {hasPlan && (
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
            <div className="text-right">
              <p className="text-[10px] text-gray-400">
                {compliance.filter(c => c.status === 'complied').length}/{mealPlans.length} refeições cumpridas
              </p>
            </div>
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

      {showUpload && (
        <PdfUploadModal
          onClose={() => setShowUpload(false)}
          onSaved={() => { loadAll(); setShowUpload(false); }}
        />
      )}
    </div>
  );
}
