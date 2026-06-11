import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Check, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const diffDays = (a, b) => {
  const ms = new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00');
  return Math.round(ms / 86400000);
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function MonthCalendar({ goal, checkedDays, onToggle }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  const t = today();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toDateStr = (day) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const inRange = (dateStr) => {
    if (dateStr < goal.start_date) return false;
    if (goal.end_date && dateStr > goal.end_date) return false;
    return true;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mt-2">
      {/* Header do mês */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-gray-600">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{w}</div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = toDateStr(day);
          const done = checkedDays.has(dateStr);
          const isToday = dateStr === t;
          const isFuture = dateStr > t;
          const inGoalRange = inRange(dateStr);
          const disabled = isFuture || !inGoalRange;

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => onToggle(dateStr)}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                ${done
                  ? 'bg-brand-500 text-white'
                  : isToday && !disabled
                  ? 'ring-2 ring-brand-500 ring-offset-1 text-brand-600 hover:bg-brand-50'
                  : disabled
                  ? 'text-gray-200 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {done ? <Check size={10} /> : day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete, onRefresh }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const checkedDays = new Set(goal.checkins);
  const progress = Math.min((checkedDays.size / goal.target_value) * 100, 100);

  const toggleDay = async (date) => {
    await axios.post(`/api/goals/${goal.id}/checkin`, { date });
    onRefresh();
  };

  const t = today();
  const daysLeft = goal.end_date ? diffDays(t, goal.end_date) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div className={`card flex flex-col gap-3 ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
            {isExpired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Expirada</span>
            )}
            {progress >= 100 && !isExpired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">Concluída ✓</span>
            )}
          </div>
          {goal.description && <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>}
          {goal.end_date && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${isExpired ? 'text-gray-400' : isDueSoon ? 'text-amber-500' : 'text-gray-400'}`}>
              <CalendarClock size={11} />
              {isExpired
                ? `Encerrou em ${new Date(goal.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : daysLeft === 0
                ? 'Encerra hoje!'
                : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''} · até ${new Date(goal.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}`
              }
            </div>
          )}
        </div>
        <button onClick={() => onDelete(goal.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-2 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {checkedDays.size}/{goal.target_value} {goal.unit}
        </span>
      </div>

      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="text-xs text-brand-500 hover:text-brand-600 text-left transition-colors"
      >
        {showCalendar ? 'Fechar calendário' : 'Ver dias →'}
      </button>

      {showCalendar && (
        <MonthCalendar goal={goal} checkedDays={checkedDays} onToggle={toggleDay} />
      )}
    </div>
  );
}

function NewGoalModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', target_value: 30, unit: 'dias', start_date: today(), end_date: '' });

  const handleDateChange = (field, value) => {
    const updated = { ...form, [field]: value };
    if (updated.start_date && updated.end_date && updated.end_date > updated.start_date) {
      updated.target_value = diffDays(updated.start_date, updated.end_date) + 1;
    }
    setForm(updated);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await axios.post('/api/goals', { ...form, end_date: form.end_date || null });
    onCreated();
    onClose();
  };

  const autoCalc = form.start_date && form.end_date && form.end_date > form.start_date;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Nova meta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="input" placeholder="Título da meta" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <textarea className="input resize-none h-20" placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Início</label>
              <input className="input" type="date" value={form.start_date} onChange={e => handleDateChange('start_date', e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Prazo final <span className="text-gray-300">(opcional)</span></label>
              <input className="input" type="date" min={form.start_date} value={form.end_date} onChange={e => handleDateChange('end_date', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">
                Objetivo {autoCalc && <span className="text-brand-500">(auto)</span>}
              </label>
              <input className="input" type="number" min="1" max="3650" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Unidade</label>
              <input className="input" placeholder="ex: dias, km, kg" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          {autoCalc && (
            <p className="text-xs text-brand-500 -mt-1">
              {new Date(form.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} → {new Date(form.end_date + 'T00:00:00').toLocaleDateString('pt-BR')} = {form.target_value} dias
            </p>
          )}
          <button type="submit" className="btn-primary mt-1">Criar meta</button>
        </form>
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const { data } = await axios.get('/api/goals');
    setGoals(data);
  };

  useEffect(() => { load(); }, []);

  const deleteGoal = async (id) => {
    if (!confirm('Deletar esta meta?')) return;
    await axios.delete(`/api/goals/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova meta
        </button>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>Nenhuma meta ainda.</p>
          <p className="text-sm mt-1">Crie sua primeira meta para começar!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map(g => (
          <GoalCard key={g.id} goal={g} onDelete={deleteGoal} onRefresh={load} />
        ))}
      </div>

      {showModal && <NewGoalModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
