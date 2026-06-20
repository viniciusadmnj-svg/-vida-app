import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Check, Repeat, Pencil, ToggleLeft, ToggleRight, TrendingUp, Upload, FileText, Eraser, Link2 } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt  = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const n    = (v) => Number(v) || 0;

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

// Linha de lançamento variável (extrato / manual)
// Entrada → coluna Entrada | Saída → coluna Diário (despesa do dia)
function EditableRow({ entry, onSave, onDelete, isToday }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ day: entry.day, description: entry.description, entrada: entry.entrada || '', saida: entry.saida || '' });

  const save = async () => {
    await onSave(entry.id, { ...form, entrada: n(form.entrada), saida: n(form.saida) });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-gray-50">
        <td className="table-cell"><input className="input py-1 w-14" type="number" min="1" max="31" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-28" type="number" step="0.01" placeholder="Entrada" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} /></td>
        <td className="table-cell text-gray-300">—</td>
        <td className="table-cell"><input className="input py-1 w-28" type="number" step="0.01" placeholder="Saída" value={form.saida} onChange={e => setForm(f => ({ ...f, saida: e.target.value }))} /></td>
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

  const isReconciled = !!entry.recurring_id;
  return (
    <tr className={`group ${isToday ? 'bg-brand-50/60' : isReconciled ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-gray-50'}`}>
      <td className={`table-cell font-medium ${isToday ? 'text-brand-600' : 'text-gray-500'}`}>
        {entry.day}
        {isToday && <span className="ml-1 text-[9px] bg-brand-500 text-white rounded px-1 py-0.5 font-bold align-middle">HOJE</span>}
      </td>
      <td className="table-cell text-gray-700">
        {entry.description}
        {isReconciled && <Link2 size={10} className="inline ml-1.5 text-brand-400 opacity-60" />}
      </td>
      <td className="table-cell text-green-600">{n(entry.entrada) > 0 ? fmt(n(entry.entrada)) : '—'}</td>
      <td className="table-cell text-red-500">{isReconciled && n(entry.saida) > 0 ? fmt(n(entry.saida)) : '—'}</td>
      <td className={`table-cell font-medium ${!isReconciled && n(entry.saida) > 0 ? 'text-red-500' : 'text-gray-300'}`}>
        {!isReconciled && n(entry.saida) > 0 ? `-${fmt(n(entry.saida))}` : '—'}
      </td>
      <td className={`table-cell font-semibold ${n(entry._saldo) < 0 ? 'text-red-500' : 'text-gray-800'}`}>{fmt(n(entry._saldo))}</td>
      <td className="table-cell">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
          <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

// Linha de despesa/receita fixa (recorrente)
// Entrada → coluna Entrada | Saída → coluna Saída | Diário → sempre —
function RecurringRow({ rec, saldo }) {
  return (
    <tr className="group hover:bg-gray-50/80 bg-indigo-50/20">
      <td className="table-cell text-gray-400 font-medium">{rec.day}</td>
      <td className="table-cell">
        <span className="text-gray-600">{rec.description}</span>
        <Repeat size={10} className="inline ml-1.5 text-brand-400 opacity-60" />
      </td>
      <td className="table-cell text-green-600">{n(rec.entrada) > 0 ? fmt(n(rec.entrada)) : '—'}</td>
      <td className="table-cell text-red-500">{n(rec.saida) > 0 ? fmt(n(rec.saida)) : '—'}</td>
      <td className="table-cell text-gray-200">—</td>
      <td className={`table-cell font-semibold ${saldo < 0 ? 'text-red-500' : 'text-gray-800'}`}>{fmt(saldo)}</td>
      <td className="table-cell" />
    </tr>
  );
}

function RecurringModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ description: '', entrada: '', saida: '', day: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => { const { data } = await axios.get('/api/finance/recurring'); setItems(data); };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.day || !form.description) return;
    await axios.post('/api/finance/recurring', { ...form, entrada: n(form.entrada), saida: n(form.saida), day: n(form.day) });
    setForm({ description: '', entrada: '', saida: '', day: '' });
    setAdding(false);
    load();
  };

  const del = async (id) => { if (!confirm('Remover?')) return; await axios.delete(`/api/finance/recurring/${id}`); load(); };
  const toggleActive = async (item) => { await axios.put(`/api/finance/recurring/${item.id}`, { ...item, active: !item.active }); load(); };
  const startEdit = (item) => { setEditingId(item.id); setEditForm({ description: item.description, entrada: item.entrada || '', saida: item.saida || '', day: item.day }); };
  const saveEdit = async (id) => {
    await axios.put(`/api/finance/recurring/${id}`, { ...editForm, entrada: n(editForm.entrada), saida: n(editForm.saida), day: n(editForm.day), active: items.find(i => i.id === id)?.active ?? 1 });
    setEditingId(null); load();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Despesas & Receitas Fixas</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Aparecem na coluna <strong>Saída</strong> (fixas) ou <strong>Entrada</strong> do fluxo diário, com ícone <Repeat size={10} className="inline text-brand-400" />.</p>
        <div className="flex-1 overflow-y-auto">
          {items.length > 0 && (
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="table-cell font-medium">Dia</th>
                  <th className="table-cell font-medium">Descrição</th>
                  <th className="table-cell font-medium text-green-600">Entrada</th>
                  <th className="table-cell font-medium text-red-500">Saída</th>
                  <th className="table-cell w-24"></th>
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
                    <td className="table-cell text-green-600">{n(item.entrada) > 0 ? fmt(n(item.entrada)) : '—'}</td>
                    <td className="table-cell text-red-500">{n(item.saida) > 0 ? fmt(n(item.saida)) : '—'}</td>
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
            <p className="text-center text-gray-400 py-8 text-sm">Nenhuma despesa/receita fixa cadastrada.</p>
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
            <Plus size={14} /> Nova fixa
          </button>
        )}
      </div>
    </div>
  );
}

function ImportModal({ onClose, month, year, onImported, activeRecurring }) {
  const [rules, setRules] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRulesMgr, setShowRulesMgr] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ pattern: '', label: '' });
  const fileRef = useRef();

  const loadRules = async () => {
    const { data } = await axios.get('/api/finance/import/rules');
    setRules(data);
  };

  useEffect(() => { loadRules(); }, []);

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  const applyRules = (rawDesc, rulesArr) => {
    const rule = rulesArr.find(r => rawDesc.toLowerCase().includes(r.pattern.toLowerCase()));
    return { description: rule ? rule.label : rawDesc, ruleId: rule?.id };
  };

  const parseDate = (s) => {
    s = s.trim().replace(/^"|"$/g, '');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [d,m,y]=s.split('/'); return new Date(`${y}-${m}-${d}T12:00:00`); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T12:00:00');
    return new Date(s);
  };

  const parseAmount = (s) => {
    if (!s) return NaN;
    s = s.trim().replace(/^"|"$/g, '');
    if (/\d,\d/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return parseFloat(s);
  };

  const splitLine = (line, sep) =>
    sep === ';'
      ? line.split(';').map(p => p.trim().replace(/^"|"$/g, ''))
      : parseCSVLine(line);

  const parseCSV = (text, rulesArr) => {
    const clean = text.replace(/^﻿/, '');
    const lines = clean.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : ',';
    const header = splitLine(firstLine, sep).map(h => h.toLowerCase());

    const dateCol  = header.findIndex(h => h.includes('data') || h.includes('date'));
    const valueCol = header.findIndex(h => h.includes('valor') || h.includes('value') || h.includes('amount'));
    const descCol  = header.findIndex(h => h.includes('descri') || h.includes('title') || h.includes('memo'));

    const dc = dateCol  !== -1 ? dateCol  : 0;
    const vc = valueCol !== -1 ? valueCol : (header.length >= 3 ? header.length - 1 : 2);
    const rc = descCol  !== -1 ? descCol  : 1;

    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = splitLine(lines[i], sep);
      if (parts.length < 3) continue;
      const dateStr = parts[dc] || '';
      const rawDesc = parts[rc] || '';
      const valueStr = parts[vc] || '';
      const value = parseAmount(valueStr);
      if (isNaN(value)) continue;
      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;
      if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
      const day = date.getDate();
      const entrada = value > 0 ? value : 0;
      const saida   = value < 0 ? Math.abs(value) : 0;
      const { description, ruleId } = applyRules(rawDesc.trim(), rulesArr);
      const suggestRec = activeRecurring.find(r => {
        if (saida > 0 && n(r.saida) > 0) return Math.abs(n(r.saida) - saida) < 0.01;
        if (entrada > 0 && n(r.entrada) > 0) return Math.abs(n(r.entrada) - entrada) < 0.01;
        return false;
      });
      entries.push({ day, rawDesc: rawDesc.trim(), description, entrada, saida, ruleId, include: true, newRule: false,
        suggestion: suggestRec || null, reconciledWith: suggestRec?.id || null });
    }
    return entries.sort((a, b) => a.day - b.day);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(parseCSV(ev.target.result, rules));
    reader.readAsText(file, 'UTF-8');
  };

  const confirm = async () => {
    setLoading(true);
    try {
      const toSave = preview.filter(e => e.include);
      for (const e of toSave.filter(e => e.newRule && !e.ruleId)) {
        await axios.post('/api/finance/import/rules', { pattern: e.rawDesc, label: e.description });
      }
      await axios.post('/api/finance/import/confirm', { entries: toSave.map(e => ({ ...e, recurring_id: e.reconciledWith || null })), month, year });
      onImported();
      onClose();
    } finally { setLoading(false); }
  };

  const saveRule = async (e) => {
    e.preventDefault();
    if (editingRule?.id) {
      await axios.put(`/api/finance/import/rules/${editingRule.id}`, ruleForm);
    } else {
      await axios.post('/api/finance/import/rules', ruleForm);
    }
    setEditingRule(null);
    setRuleForm({ pattern: '', label: '' });
    loadRules();
  };

  const deleteRule = async (id) => {
    if (!confirm('Remover regra?')) return;
    await axios.delete(`/api/finance/import/rules/${id}`);
    loadRules();
  };

  const includedCount = preview?.filter(e => e.include).length || 0;

  if (showRulesMgr) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="card w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Regras de Conciliação</h2>
            <button onClick={() => setShowRulesMgr(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
          </div>
          <p className="text-xs text-gray-400 mb-4">Quando o extrato contiver o <strong>padrão</strong>, a descrição é substituída pelo <strong>nome amigável</strong>.</p>
          <div className="flex-1 overflow-y-auto">
            {rules.length === 0 && !editingRule && (
              <p className="text-center text-gray-400 py-6 text-sm">Nenhuma regra cadastrada ainda.</p>
            )}
            {rules.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono truncate">{r.pattern}</p>
                  <p className="text-sm text-gray-700 font-medium">{r.label}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => { setEditingRule(r); setRuleForm({ pattern: r.pattern, label: r.label }); }} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
                  <button onClick={() => deleteRule(r.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={saveRule} className="pt-4 border-t border-gray-100 mt-2 flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-600">{editingRule?.id ? 'Editar regra' : 'Nova regra'}</p>
            <input className="input text-sm" placeholder='Padrão (ex: "PIX FULANO")' value={ruleForm.pattern} onChange={e => setRuleForm(f => ({ ...f, pattern: e.target.value }))} required />
            <input className="input text-sm" placeholder='Nome amigável (ex: "Aluguel")' value={ruleForm.label} onChange={e => setRuleForm(f => ({ ...f, label: e.target.value }))} required />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">Salvar</button>
              {editingRule && <button type="button" className="btn-ghost text-sm" onClick={() => { setEditingRule(null); setRuleForm({ pattern: '', label: '' }); }}>Cancelar</button>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Importar Extrato — Nubank</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowRulesMgr(true)} className="text-xs text-brand-500 hover:underline">Gerenciar regras ({rules.length})</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
          </div>
        </div>

        {!preview ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <FileText size={28} className="text-brand-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-medium mb-1">Selecione o CSV exportado do Nubank</p>
              <p className="text-xs text-gray-400">App Nubank → Perfil → Extrato → Exportar extrato em CSV</p>
              <p className="text-xs text-gray-400 mt-1">Só lançamentos de <strong>{MONTHS[month - 1]} {year}</strong> serão importados</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <button className="btn-primary" onClick={() => fileRef.current?.click()}>Escolher arquivo CSV</button>
          </div>
        ) : preview.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-3">Nenhum lançamento de {MONTHS[month - 1]} {year} encontrado no arquivo.</p>
            <button className="btn-ghost text-sm" onClick={() => { setPreview(null); fileRef.current.value = ''; }}>Tentar outro arquivo</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{preview.length}</span> lançamentos · <span className="text-brand-600 font-medium">{includedCount} selecionados</span>
                {(() => { const rc = preview.filter(e => e.include && e.reconciledWith).length; return rc > 0 ? <span className="text-brand-500"> · <Link2 size={11} className="inline mb-0.5" /> {rc} para conciliar</span> : null; })()}
              </p>
              <button className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={() => { setPreview(null); fileRef.current.value = ''; }}>Trocar arquivo</button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400">
                    <th className="table-cell w-8">
                      <input type="checkbox"
                        checked={preview.every(e => e.include)}
                        onChange={v => setPreview(p => p.map(x => ({ ...x, include: v.target.checked })))}
                        className="rounded" />
                    </th>
                    <th className="table-cell w-10">Dia</th>
                    <th className="table-cell">Descrição</th>
                    <th className="table-cell text-green-600 w-28">Entrada</th>
                    <th className="table-cell text-red-500 w-28">Saída</th>
                    <th className="table-cell w-16 text-center" title="Criar regra para reconhecer automaticamente">Regra</th>
                    <th className="table-cell w-36 text-brand-500">Conciliar</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((e, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 ${!e.include ? 'opacity-40' : 'hover:bg-gray-50/50'}`}>
                      <td className="table-cell">
                        <input type="checkbox" checked={e.include}
                          onChange={() => setPreview(p => p.map((x, j) => j === i ? { ...x, include: !x.include } : x))}
                          className="rounded" />
                      </td>
                      <td className="table-cell text-gray-400 font-medium">{e.day}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <input
                            className="input py-0.5 text-xs flex-1 min-w-0"
                            value={e.description}
                            onChange={ev => setPreview(p => p.map((x, j) => j === i ? { ...x, description: ev.target.value } : x))}
                          />
                          {e.ruleId && <span className="text-[9px] text-brand-400 whitespace-nowrap shrink-0">✓ regra</span>}
                        </div>
                      </td>
                      <td className="table-cell text-green-600 text-xs">{e.entrada > 0 ? fmt(e.entrada) : <span className="text-gray-200">—</span>}</td>
                      <td className="table-cell text-red-500 text-xs">{e.saida > 0 ? fmt(e.saida) : <span className="text-gray-200">—</span>}</td>
                      <td className="table-cell text-center">
                        {!e.ruleId && (
                          <input type="checkbox" checked={e.newRule}
                            title="Salvar como regra de conciliação"
                            onChange={() => setPreview(p => p.map((x, j) => j === i ? { ...x, newRule: !x.newRule } : x))}
                            className="rounded" />
                        )}
                      </td>
                      <td className="table-cell">
                        <select
                          className={`text-xs border rounded-md px-1.5 py-0.5 max-w-[150px] transition-colors ${
                            e.reconciledWith
                              ? 'border-brand-200 bg-brand-50 text-brand-700'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                          }`}
                          value={e.reconciledWith || ''}
                          onChange={ev => setPreview(p => p.map((x, j) => j === i ? {
                            ...x, reconciledWith: ev.target.value ? Number(ev.target.value) : null
                          } : x))}
                        >
                          <option value="">— não conciliar —</option>
                          {activeRecurring.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.description.length > 22 ? r.description.slice(0, 22) + '…' : r.description}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
              <p className="text-xs text-gray-400">Marque "Regra" para reconhecer automaticamente na próxima importação</p>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={onClose}>Cancelar</button>
                <button className="btn-primary" onClick={confirm} disabled={loading || includedCount === 0}>
                  {loading ? 'Salvando...' : `Confirmar ${includedCount} lançamento${includedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </>
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
  const [recurring, setRecurring] = useState([]);
  const [form, setForm] = useState({ day: '', description: '', entrada: '', saida: '' });
  const [adding, setAdding] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    const [{ data: ent }, { data: rec }] = await Promise.all([
      axios.get(`/api/finance?month=${month}&year=${year}`),
      axios.get('/api/finance/recurring'),
    ]);
    setEntries(ent);
    setRecurring(rec);
  };

  useEffect(() => { load(); }, [month, year]);

  // Fixas ativas para o mês
  const activeRecurring     = useMemo(() => recurring.filter(r => r.active), [recurring]);
  // Lançamentos do extrato já conciliados com uma fixa
  const reconciledEntries   = useMemo(() => entries.filter(e => e.recurring_id),  [entries]);
  // Lançamentos variáveis (sem recurring_id) — manuais ou não conciliados
  const variableOnlyEntries = useMemo(() => entries.filter(e => !e.recurring_id), [entries]);
  // IDs das fixas já conciliadas neste mês
  const reconciledIds       = useMemo(() => new Set(reconciledEntries.map(e => Number(e.recurring_id))), [reconciledEntries]);
  // Fixas ainda não conciliadas (aparecem como linhas pendentes)
  const pendingRecurring    = useMemo(() => activeRecurring.filter(r => !reconciledIds.has(r.id)), [activeRecurring, reconciledIds]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.day) return;
    await axios.post('/api/finance', { ...form, entrada: n(form.entrada), saida: n(form.saida), month, year });
    setForm({ day: '', description: '', entrada: '', saida: '' });
    setAdding(false);
    load();
  };

  const save = async (id, data) => { await axios.put(`/api/finance/${id}`, data); load(); };
  const del  = async (id) => { if (!confirm('Deletar este lançamento?')) return; await axios.delete(`/api/finance/${id}`); load(); };
  const clearMonth = async () => {
    if (!confirm(`Apagar TODOS os lançamentos de ${MONTHS[month - 1]} ${year}? Isso não pode ser desfeito.`)) return;
    await axios.delete(`/api/finance/clear?month=${month}&year=${year}`);
    load();
  };

  const fmtK = v => { const a = Math.abs(v); return a >= 1000 ? `${(v / 1000).toFixed(1)}k` : v === 0 ? '0' : v.toFixed(0); };

  // Gráfico: todos os lançamentos + fixas pendentes (sem dupla contagem das conciliadas)
  const cashflowData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = {};
    entries.forEach(e => {
      if (!byDay[e.day]) byDay[e.day] = { entrada: 0, saida: 0 };
      byDay[e.day].entrada += n(e.entrada);
      byDay[e.day].saida   += n(e.saida);
    });
    pendingRecurring.forEach(r => {
      const d = n(r.day);
      if (d >= 1 && d <= daysInMonth) {
        if (!byDay[d]) byDay[d] = { entrada: 0, saida: 0 };
        byDay[d].entrada += n(r.entrada);
        byDay[d].saida   += n(r.saida);
      }
    });
    let saldo = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const d = byDay[day] || { entrada: 0, saida: 0 };
      saldo += d.entrada - d.saida;
      return { dia: day, entrada: d.entrada, saida: d.saida, saldo };
    });
  }, [entries, pendingRecurring, month, year]);

  // Tabela unificada: fixas pendentes + todos os lançamentos (variáveis + conciliados)
  const tableRows = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();

    const entByDay = {};
    entries.forEach(e => {
      if (!entByDay[e.day]) entByDay[e.day] = [];
      entByDay[e.day].push(e);
    });

    const recByDay = {};
    pendingRecurring.forEach(r => {
      const d = n(r.day);
      if (d >= 1 && d <= daysInMonth) {
        if (!recByDay[d]) recByDay[d] = [];
        recByDay[d].push(r);
      }
    });

    let runSaldo = 0;
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const recs = recByDay[d] || [];
      const ents = entByDay[d] || [];
      const total = recs.length + ents.length;

      if (total > 0) {
        recs.forEach(r => {
          runSaldo += n(r.entrada) - n(r.saida);
          rows.push({ kind: 'recurring', rec: r, _saldo: runSaldo });
        });
        ents.forEach(e => {
          runSaldo += n(e.entrada) - n(e.saida);
          rows.push({ kind: 'entry', entry: { ...e, _saldo: runSaldo } });
        });
      } else {
        rows.push({ kind: 'empty', day: d, saldo: runSaldo });
      }
    }
    return rows;
  }, [entries, pendingRecurring, month, year]);

  const todayDay = now.getDate();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // Totais sem dupla contagem: conciliados + pendentes
  const totalEntrada   = entries.reduce((s, e) => s + n(e.entrada), 0)
                       + pendingRecurring.reduce((s, r) => s + n(r.entrada), 0);
  const totalSaidaFixa = reconciledEntries.reduce((s, e) => s + n(e.saida), 0)
                       + pendingRecurring.reduce((s, r) => s + n(r.saida), 0);
  const totalDiario    = variableOnlyEntries.reduce((s, e) => s + n(e.saida), 0);
  const resultado      = totalEntrada - totalSaidaFixa - totalDiario;

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
            <Repeat size={14} /> Fixas
          </button>
          <button className="btn-ghost flex items-center gap-1.5 border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-500" onClick={clearMonth}>
            <Eraser size={14} /> Limpar mês
          </button>
          <button className="btn-ghost flex items-center gap-1.5 border border-brand-500/30 text-brand-500 hover:bg-brand-500/5" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Importar extrato
          </button>
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setAdding(!adding)}>
            <Plus size={15} /> Lançamento
          </button>
        </div>
      </div>

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

      {/* Gráfico */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Fluxo de Caixa — {MONTHS[month - 1]} {year}</h2>
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />Entrada</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Saída</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-brand-500 inline-block rounded" />Saldo</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={cashflowData} barCategoryGap="30%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={cashflowData.length > 20 ? 4 : 1} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={42} />
            <ReferenceLine y={0} stroke="rgba(0,0,0,0.08)" />
            <Tooltip content={<CashflowTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="entrada" fill="#4ade80" radius={[3, 3, 0, 0]} />
            <Bar dataKey="saida"   fill="#f87171" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="saldo" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela unificada */}
      <div className="card overflow-x-auto mb-4">
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-sm bg-indigo-100 inline-block border border-indigo-200" /> Fixa <Repeat size={9} className="text-brand-400" /></span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-sm bg-white inline-block border border-gray-100" /> Variável / Diário</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="table-cell font-medium">Dia</th>
              <th className="table-cell font-medium">Descrição</th>
              <th className="table-cell font-medium text-green-600">Entrada</th>
              <th className="table-cell font-medium text-red-500">Saída</th>
              <th className="table-cell font-medium text-orange-500">Diário</th>
              <th className="table-cell font-medium">Saldo</th>
              <th className="table-cell w-16"></th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => {
              if (row.kind === 'recurring') {
                return <RecurringRow key={`rec-${row.rec.id}-${i}`} rec={row.rec} saldo={row._saldo} />;
              }
              if (row.kind === 'entry') {
                const isToday = isCurrentMonth && row.entry.day === todayDay;
                return <EditableRow key={row.entry.id} entry={row.entry} onSave={save} onDelete={del} isToday={isToday} />;
              }
              // Empty day
              const isToday = isCurrentMonth && row.day === todayDay;
              return (
                <tr key={`day-${row.day}`} className={`transition-colors ${isToday ? 'bg-brand-50/60' : 'hover:bg-gray-50/30'}`}>
                  <td className={`table-cell font-medium ${isToday ? 'text-brand-600' : 'text-gray-300'}`}>
                    {row.day}
                    {isToday && <span className="ml-1 text-[9px] bg-brand-500 text-white rounded px-1 py-0.5 font-bold align-middle">HOJE</span>}
                  </td>
                  <td className="table-cell text-gray-200 text-xs">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className="table-cell text-gray-200">—</td>
                  <td className={`table-cell font-medium ${row.saldo < 0 ? 'text-red-400' : 'text-gray-400'}`}>{fmt(row.saldo)}</td>
                  <td className="table-cell" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="card flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">Total entradas</p>
          <p className="text-lg font-semibold text-green-600">{fmt(totalEntrada)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Saídas fixas</p>
          <p className="text-lg font-semibold text-red-500">{fmt(totalSaidaFixa)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Gastos diários</p>
          <p className="text-lg font-semibold text-orange-500">{fmt(totalDiario)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Performance</p>
          <p className={`text-lg font-semibold ${resultado >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(resultado)}</p>
        </div>
      </div>

      {showRecurring && <RecurringModal onClose={() => { setShowRecurring(false); load(); }} />}
      {showImport && <ImportModal month={month} year={year} onClose={() => setShowImport(false)} onImported={load} activeRecurring={activeRecurring} />}
    </div>
  );
}
