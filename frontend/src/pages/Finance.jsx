import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Check, RefreshCw, Repeat, Pencil, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function CashflowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const entrada = payload.find(p => p.dataKey === 'entrada')?.value || 0;
  const saida   = payload.find(p => p.dataKey === 'saida')?.value   || 0;
  const saldo   = payload.find(p => p.dataKey === 'saldo')?.value;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-md min-w-36">
      <p className="text-gray-500 font-medium mb-1.5">Dia {label}</p>
      {entrada > 0 && <p className="text-green-600">+ {fmt(entrada)}</p>}
      {saida   > 0 && <p className="text-red-500">− {fmt(saida)}</p>}
      {saldo !== undefined && (
        <p className={`font-semibold mt-1 pt-1 border-t border-gray-100 ${saldo >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
          Saldo: {fmt(saldo)}
        </p>
      )}
    </div>
  );
}

function EditableRow({ entry, onSave, onDelete, isToday }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ day: entry.day, description: entry.description, entrada: entry.entrada || '', saida: entry.saida || '' });

  const save = async () => {
    await onSave(entry.id, { ...form, entrada: Number(form.entrada) || 0, saida: Number(form.saida) || 0 });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-gray-50">
        <td className="table-cell"><input className="input py-1 w-14" type="number" min="1" max="31" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-28" type="number" step="0.01" placeholder="0,00" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-28" type="number" step="0.01" placeholder="0,00" value={form.saida} onChange={e => setForm(f => ({ ...f, saida: e.target.value }))} /></td>
        <td className="table-cell text-gray-400">—</td>
        <td className="table-cell text-gray-400">—</td>
        <td className="table-cell">
          <div className="flex gap-1">
            <button onClick={save} className="text-green-600 hover:text-green-700 p-1"><Check size={13} /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700 p-1"><X size={13} /></button>
          </div>
        </td>
      </tr>
    );
  }

  const daily = (entry.entrada || 0) - (entry.saida || 0);
  return (
    <tr className={`group ${isToday ? 'bg-brand-50/60' : 'hover:bg-gray-50'}`}>
      <td className={`table-cell font-medium ${isToday ? 'text-brand-600' : 'text-gray-500'}`}>
        {entry.day}
        {isToday && <span className="ml-1 text-[9px] bg-brand-500 text-white rounded px-1 py-0.5 font-bold align-middle">HOJE</span>}
      </td>
      <td className="table-cell">
        <span className="text-gray-700">{entry.description}</span>
        {entry.recurring_id && (
          <span title="Recorrente" className="ml-1.5 text-brand-400 opacity-60">
            <Repeat size={10} className="inline" />
          </span>
        )}
      </td>
      <td className="table-cell text-green-600">{entry.entrada > 0 ? fmt(entry.entrada) : '—'}</td>
      <td className="table-cell text-red-500">{entry.saida > 0 ? fmt(entry.saida) : '—'}</td>
      <td className={`table-cell font-medium ${daily >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(daily)}</td>
      <td className={`table-cell font-semibold ${entry._saldo < 0 ? 'text-red-500' : 'text-gray-800'}`}>{fmt(entry._saldo)}</td>
      <td className="table-cell">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
          <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function RecurringModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ description: '', entrada: '', saida: '', day: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    const { data } = await axios.get('/api/finance/recurring');
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.day || !form.description) return;
    await axios.post('/api/finance/recurring', { ...form, entrada: Number(form.entrada) || 0, saida: Number(form.saida) || 0, day: Number(form.day) });
    setForm({ description: '', entrada: '', saida: '', day: '' });
    setAdding(false);
    load();
  };

  const del = async (id) => {
    if (!confirm('Remover este recorrente?')) return;
    await axios.delete(`/api/finance/recurring/${id}`);
    load();
  };

  const toggleActive = async (item) => {
    await axios.put(`/api/finance/recurring/${item.id}`, { ...item, active: !item.active });
    load();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ description: item.description, entrada: item.entrada || '', saida: item.saida || '', day: item.day });
  };

  const saveEdit = async (id) => {
    await axios.put(`/api/finance/recurring/${id}`, { ...editForm, entrada: Number(editForm.entrada) || 0, saida: Number(editForm.saida) || 0, day: Number(editForm.day), active: items.find(i => i.id === id)?.active ?? 1 });
    setEditingId(null);
    load();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Lançamentos recorrentes</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Entradas e saídas fixas mensais. Use <strong className="text-gray-600">"Aplicar ao mês"</strong> para inserí-las no período desejado.</p>

        <div className="flex-1 overflow-y-auto">
          {items.length > 0 && (
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="table-cell font-medium">Dia</th>
                  <th className="table-cell font-medium">Descrição</th>
                  <th className="table-cell font-medium text-green-600">Entrada</th>
                  <th className="table-cell font-medium text-red-500">Saída</th>
                  <th className="table-cell font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => editingId === item.id ? (
                  <tr key={item.id} className="bg-gray-50">
                    <td className="table-cell"><input className="input py-1 w-14" type="number" min="1" max="31" value={editForm.day} onChange={e => setEditForm(f => ({ ...f, day: e.target.value }))} /></td>
                    <td className="table-cell"><input className="input py-1" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></td>
                    <td className="table-cell"><input className="input py-1 w-24" type="number" step="0.01" value={editForm.entrada} onChange={e => setEditForm(f => ({ ...f, entrada: e.target.value }))} /></td>
                    <td className="table-cell"><input className="input py-1 w-24" type="number" step="0.01" value={editForm.saida} onChange={e => setEditForm(f => ({ ...f, saida: e.target.value }))} /></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(item.id)} className="text-green-600 p-1"><Check size={13} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 p-1"><X size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className={`group hover:bg-gray-50 ${!item.active ? 'opacity-40' : ''}`}>
                    <td className="table-cell text-gray-400">{item.day}</td>
                    <td className="table-cell text-gray-700">{item.description}</td>
                    <td className="table-cell text-green-600">{item.entrada > 0 ? fmt(item.entrada) : '—'}</td>
                    <td className="table-cell text-red-500">{item.saida > 0 ? fmt(item.saida) : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleActive(item)} className="text-gray-400 hover:text-brand-500 p-1">
                          {item.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
                        <button onClick={() => del(item.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {items.length === 0 && !adding && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum recorrente cadastrado ainda.</p>
          )}
        </div>

        {adding ? (
          <form onSubmit={add} className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-2">
            <input className="input w-16" type="number" min="1" max="31" placeholder="Dia*" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} required />
            <input className="input flex-1 min-w-40" placeholder="Descrição*" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            <input className="input w-28" type="number" step="0.01" placeholder="Entrada (R$)" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
            <input className="input w-28" type="number" step="0.01" placeholder="Saída (R$)" value={form.saida} onChange={e => setForm(f => ({ ...f, saida: e.target.value }))} />
            <div className="flex gap-2 w-full">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button className="btn-ghost flex items-center gap-1.5 mt-3 self-start" onClick={() => setAdding(true)}>
            <Plus size={14} /> Novo recorrente
          </button>
        )}
      </div>
    </div>
  );
}

export default function Finance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ day: '', description: '', entrada: '', saida: '' });
  const [adding, setAdding] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [applyMsg, setApplyMsg] = useState(null);

  const load = async () => {
    const { data } = await axios.get(`/api/finance?month=${month}&year=${year}`);
    let saldo = 0;
    const withSaldo = data.map(e => {
      saldo += (e.entrada || 0) - (e.saida || 0);
      return { ...e, _saldo: saldo };
    });
    setEntries(withSaldo);
  };

  useEffect(() => { load(); }, [month, year]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.day) return;
    await axios.post('/api/finance', { ...form, entrada: Number(form.entrada) || 0, saida: Number(form.saida) || 0, month, year });
    setForm({ day: '', description: '', entrada: '', saida: '' });
    setAdding(false);
    load();
  };

  const save = async (id, data) => { await axios.put(`/api/finance/${id}`, data); load(); };
  const del = async (id) => {
    if (!confirm('Deletar este lançamento?')) return;
    await axios.delete(`/api/finance/${id}`);
    load();
  };

  const applyRecurring = async () => {
    const { data } = await axios.post('/api/finance/recurring/apply', { month, year });
    load();
    setApplyMsg(data.inserted === 0
      ? 'Todos os recorrentes já foram aplicados neste mês.'
      : `${data.inserted} recorrente${data.inserted > 1 ? 's' : ''} inserido${data.inserted > 1 ? 's' : ''}!${data.skipped > 0 ? ` (${data.skipped} já existia${data.skipped > 1 ? 'm' : ''})` : ''}`
    );
    setTimeout(() => setApplyMsg(null), 3000);
  };

  const totalEntrada = entries.reduce((s, e) => s + (e.entrada || 0), 0);
  const totalSaida   = entries.reduce((s, e) => s + (e.saida   || 0), 0);
  const resultado = totalEntrada - totalSaida;

  const cashflowData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = {};
    entries.forEach(e => {
      if (!byDay[e.day]) byDay[e.day] = { entrada: 0, saida: 0 };
      byDay[e.day].entrada += (e.entrada || 0);
      byDay[e.day].saida   += (e.saida   || 0);
    });
    let saldo = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const d = byDay[day] || { entrada: 0, saida: 0 };
      saldo += d.entrada - d.saida;
      return { dia: day, entrada: d.entrada, saida: d.saida, saldo };
    });
  }, [entries, month, year]);

  const fmtK = v => {
    const abs = Math.abs(v);
    if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v === 0 ? '0' : v.toFixed(0);
  };

  // Gera uma linha para cada dia do mês, com saldo acumulado mesmo em dias sem lançamento
  const tableRows = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = {};
    entries.forEach(e => {
      if (!byDay[e.day]) byDay[e.day] = [];
      byDay[e.day].push(e);
    });
    let runSaldo = 0;
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEntries = byDay[d] || [];
      if (dayEntries.length > 0) {
        dayEntries.forEach(e => {
          runSaldo += (e.entrada || 0) - (e.saida || 0);
          rows.push({ kind: 'entry', entry: { ...e, _saldo: runSaldo } });
        });
      } else {
        rows.push({ kind: 'empty', day: d, saldo: runSaldo });
      }
    }
    return rows;
  }, [entries, month, year]);

  const todayDay = new Date().getDate();
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input className="input w-24" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
          <button className="btn-ghost flex items-center gap-1.5 border border-gray-200" onClick={() => setShowRecurring(true)}>
            <Repeat size={14} /> Recorrentes
          </button>
          <button className="btn-ghost flex items-center gap-1.5 border border-brand-500/30 text-brand-500 hover:bg-brand-500/5" onClick={applyRecurring}>
            <RefreshCw size={14} /> Aplicar ao mês
          </button>
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setAdding(!adding)}>
            <Plus size={15} /> Lançamento
          </button>
        </div>
      </div>

      {applyMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 text-sm">
          {applyMsg}
        </div>
      )}

      {adding && (
        <form onSubmit={add} className="card mb-4 flex flex-wrap gap-2">
          <input className="input w-20" type="number" min="1" max="31" placeholder="Dia*" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} required />
          <input className="input flex-1 min-w-48" placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="input w-32" type="number" step="0.01" placeholder="Entrada (R$)" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
          <input className="input w-32" type="number" step="0.01" placeholder="Saída (R$)" value={form.saida} onChange={e => setForm(f => ({ ...f, saida: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Adicionar</button>
            <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Fluxo de caixa diário */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 text-sm">
              Fluxo de Caixa — {MONTHS[month - 1]} {year}
            </h2>
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />Entrada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Saída
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-brand-500 inline-block rounded" />Saldo
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={cashflowData} barCategoryGap="30%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="dia"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={cashflowData.length > 20 ? 4 : 1}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtK}
              width={42}
            />
            <ReferenceLine y={0} stroke="rgba(0,0,0,0.08)" />
            <Tooltip content={<CashflowTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="entrada" fill="#4ade80" radius={[3, 3, 0, 0]} />
            <Bar dataKey="saida"   fill="#f87171" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="table-cell font-medium">Dia</th>
              <th className="table-cell font-medium">Descrição</th>
              <th className="table-cell font-medium text-green-600">Entrada</th>
              <th className="table-cell font-medium text-red-500">Saída</th>
              <th className="table-cell font-medium">Diário</th>
              <th className="table-cell font-medium">Saldo</th>
              <th className="table-cell font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              if (row.kind === 'entry') {
                const isToday = isCurrentMonth && row.entry.day === todayDay;
                return <EditableRow key={row.entry.id} entry={row.entry} onSave={save} onDelete={del} isToday={isToday} />;
              }
              const isToday = isCurrentMonth && row.day === todayDay;
              return (
                <tr
                  key={`day-${row.day}`}
                  className={`group transition-colors ${isToday ? 'bg-brand-50/60' : 'hover:bg-gray-50/30'}`}
                >
                  <td className={`table-cell font-medium ${isToday ? 'text-brand-600' : 'text-gray-300'}`}>
                    {row.day}
                    {isToday && <span className="ml-1 text-[9px] bg-brand-500 text-white rounded px-1 py-0.5 font-bold align-middle">HOJE</span>}
                  </td>
                  <td className="table-cell text-gray-200 text-xs">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className={`table-cell font-medium ${row.saldo < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {fmt(row.saldo)}
                  </td>
                  <td className="table-cell" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card mt-4 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">Total entradas</p>
          <p className="text-lg font-semibold text-green-600">{fmt(totalEntrada)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Total saídas</p>
          <p className="text-lg font-semibold text-red-500">{fmt(totalSaida)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Performance</p>
          <p className={`text-lg font-semibold ${resultado >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(resultado)}</p>
        </div>
      </div>

      {showRecurring && <RecurringModal onClose={() => setShowRecurring(false)} />}
    </div>
  );
}
