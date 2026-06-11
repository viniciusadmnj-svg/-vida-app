import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Check, ChevronDown, BookOpen, Pencil, AlertCircle } from 'lucide-react';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

function CardapioModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ meal_name: '', description: '' });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => { const { data } = await axios.get('/api/diet-plan'); setItems(data); };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.meal_name.trim()) return;
    await axios.post('/api/diet-plan', form);
    setForm({ meal_name: '', description: '' });
    setAdding(false);
    load();
  };

  const del = async (id) => { await axios.delete(`/api/diet-plan/${id}`); load(); };
  const saveEdit = async (id) => { await axios.put(`/api/diet-plan/${id}`, editForm); setEditId(null); load(); };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-900">Meu Cardápio</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Defina o que você deve comer em cada refeição da sua dieta.</p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {items.map(item => editId === item.id ? (
            <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 border border-gray-200">
              <input className="input py-1 text-sm" placeholder="Refeição" value={editForm.meal_name} onChange={e => setEditForm(f => ({ ...f, meal_name: e.target.value }))} />
              <textarea className="input py-1 text-sm resize-none h-20" placeholder="O que comer..." value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item.id)} className="btn-primary text-xs py-1.5">Salvar</button>
                <button onClick={() => setEditId(null)} className="btn-ghost text-xs">Cancelar</button>
              </div>
            </div>
          ) : (
            <div key={item.id} className="group flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.meal_name}</p>
                {item.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { setEditId(item.id); setEditForm({ meal_name: item.meal_name, description: item.description }); }} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
                <button onClick={() => del(item.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && !adding && (
            <p className="text-center text-gray-400 text-sm py-6">Nenhuma refeição no cardápio ainda.</p>
          )}
        </div>

        {adding ? (
          <form onSubmit={add} className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-3">
            <input className="input" placeholder="Nome da refeição (ex: Almoço)*" value={form.meal_name} onChange={e => setForm(f => ({ ...f, meal_name: e.target.value }))} required />
            <textarea className="input resize-none h-24" placeholder="O que comer nessa refeição..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Adicionar</button>
              <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button className="btn-ghost flex items-center gap-1.5 mt-3 self-start border border-gray-200" onClick={() => setAdding(true)}>
            <Plus size={14} /> Adicionar refeição
          </button>
        )}
      </div>
    </div>
  );
}

function QuickLog({ dietPlan, onLogged }) {
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState(null);
  const [notes, setNotes] = useState('');
  const [customFood, setCustomFood] = useState('');
  const [customComplied, setCustomComplied] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const reset = () => { setMode(null); setNotes(''); setCustomFood(''); setCustomComplied(true); };

  const submit = async (type) => {
    setSaving(true);
    const payload = { date, entry_type: type, month, year };
    if (type === 'not_complied') payload.notes = notes;
    if (type === 'custom') { payload.food_eaten = customFood; payload.is_complied = customComplied ? 1 : 0; payload.notes = notes; }
    await axios.post('/api/nutrition', payload);
    setSaving(false);
    reset();
    onLogged();
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-gray-900 text-sm">Registrar dia</h2>
        <div className="flex items-center gap-2">
          <input className="input w-36 py-1.5 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
          {dietPlan.length > 0 && (
            <button onClick={() => setShowPlan(!showPlan)} className="btn-ghost text-xs flex items-center gap-1 border border-gray-200">
              <BookOpen size={12} /> Cardápio
              <ChevronDown size={12} className={`transition-transform ${showPlan ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {showPlan && dietPlan.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
          {dietPlan.map(item => (
            <div key={item.id}>
              <p className="text-xs font-medium text-green-600">{item.meal_name}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setMode(mode === 'complied' ? null : 'complied')}
          className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all font-medium text-sm
            ${mode === 'complied' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-green-300 hover:text-green-600'}`}
        >
          <span className="text-2xl">✅</span>
          <span className="text-center leading-tight">Cumpri o cardápio</span>
        </button>

        <button
          onClick={() => setMode(mode === 'not_complied' ? null : 'not_complied')}
          className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all font-medium text-sm
            ${mode === 'not_complied' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-red-300 hover:text-red-600'}`}
        >
          <span className="text-2xl">❌</span>
          <span className="text-center leading-tight">Não cumpri</span>
        </button>

        <button
          onClick={() => setMode(mode === 'custom' ? null : 'custom')}
          className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2 transition-all font-medium text-sm
            ${mode === 'custom' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-brand-300 hover:text-brand-600'}`}
        >
          <span className="text-2xl">✏️</span>
          <span className="text-center leading-tight">Outros</span>
        </button>
      </div>

      {mode === 'complied' && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-green-600 flex-1">Ótimo! Confirme o registro de hoje como cumprido.</p>
          <button onClick={() => submit('complied')} disabled={saving} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-1.5">
            <Check size={14} /> Confirmar
          </button>
          <button onClick={reset} className="btn-ghost">Cancelar</button>
        </div>
      )}

      {mode === 'not_complied' && (
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          <input className="input" placeholder="Motivo (opcional) — o que te fez sair da dieta?" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => submit('not_complied')} disabled={saving} className="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-1.5">
              <Check size={14} /> Registrar
            </button>
            <button onClick={reset} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          <textarea className="input resize-none h-20" placeholder="O que você comeu? Descreva à vontade..." value={customFood} onChange={e => setCustomFood(e.target.value)} />
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">Isso foi:</p>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="radio" name="cc" checked={customComplied} onChange={() => setCustomComplied(true)} className="accent-green-500" />
              <span className="text-green-600">Cumprido</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="radio" name="cc" checked={!customComplied} onChange={() => setCustomComplied(false)} className="accent-red-500" />
              <span className="text-red-500">Não cumprido</span>
            </label>
          </div>
          <input className="input" placeholder="Observação (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => submit('custom')} disabled={saving || !customFood.trim()} className="btn-primary flex items-center gap-1.5">
              <Check size={14} /> Registrar
            </button>
            <button onClick={reset} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ entry }) {
  if (entry.entry_type === 'complied' || entry.is_complied) {
    return <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Cumprido</span>;
  }
  return <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded-full">✗ Não cumprido</span>;
}

function EntryTypeLabel({ type }) {
  if (type === 'complied')     return <span className="text-xs text-gray-400">Cardápio completo</span>;
  if (type === 'not_complied') return <span className="text-xs text-gray-400">Saiu da dieta</span>;
  return <span className="text-xs text-gray-400">Personalizado</span>;
}

export default function Nutrition() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [dietPlan, setDietPlan] = useState([]);
  const [showCardapio, setShowCardapio] = useState(false);

  const load = async () => {
    const [entriesRes, planRes] = await Promise.all([
      axios.get(`/api/nutrition?month=${month}&year=${year}`),
      axios.get('/api/diet-plan'),
    ]);
    setEntries(entriesRes.data);
    setDietPlan(planRes.data);
  };

  useEffect(() => { load(); }, [month, year]);

  const del = async (id) => {
    if (!confirm('Deletar este registro?')) return;
    await axios.delete(`/api/nutrition/${id}`);
    load();
  };

  const cumpridos = entries.filter(e => e.is_complied === 1 || e.entry_type === 'complied').length;
  const pct = entries.length > 0 ? Math.round((cumpridos / entries.length) * 100) : null;

  const byDate = entries.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input className="input w-24" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
          <button className="btn-ghost flex items-center gap-1.5 border border-gray-200" onClick={() => setShowCardapio(true)}>
            <BookOpen size={14} />
            {dietPlan.length > 0 ? `Cardápio (${dietPlan.length})` : 'Configurar cardápio'}
          </button>
        </div>
      </div>

      {dietPlan.length === 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>Configure seu cardápio para usar os registros rápidos.</span>
          <button onClick={() => setShowCardapio(true)} className="ml-auto text-xs underline underline-offset-2 hover:text-amber-900 shrink-0">Configurar agora</button>
        </div>
      )}

      <QuickLog dietPlan={dietPlan} onLogged={load} />

      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Registros</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{cumpridos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Cumpridos</p>
          </div>
          <div className="card text-center">
            <p className={`text-2xl font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Aderência</p>
          </div>
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum registro em {MONTHS[month - 1]} {year}.</p>
          <p className="text-sm mt-1">Use os botões acima para começar a rastrear.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="card">
              <p className="text-xs font-semibold text-gray-400 mb-3 capitalize">{fmtDate(date)}</p>
              <div className="space-y-2">
                {byDate[date].map(entry => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge entry={entry} />
                        <EntryTypeLabel type={entry.entry_type} />
                      </div>
                      {entry.food_eaten && <p className="text-sm text-gray-700 mt-1 leading-relaxed">{entry.food_eaten}</p>}
                      {entry.notes && <p className="text-xs text-gray-400 mt-0.5">📝 {entry.notes}</p>}
                    </div>
                    <button onClick={() => del(entry.id)} className="text-gray-300 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCardapio && <CardapioModal onClose={() => { setShowCardapio(false); load(); }} />}
    </div>
  );
}
