import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, ExternalLink, Pencil, BookOpen, Check } from 'lucide-react';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4'];
const EMOJIS = ['📚','🎯','📦','❓','🏷️','💡','🔗','📊','🎨','⚡','🛠️','📋','🧠','🚀','💼','📝'];

function LinkRow({ link, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ title: link.title, url: link.url || '', notes: link.notes || '' });

  const save = async () => {
    await onUpdate(link.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-gray-50">
        <td className="table-cell">
          <input
            autoFocus
            className="input py-1 text-sm"
            placeholder="Título"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </td>
        <td className="table-cell">
          <input
            className="input py-1 text-sm"
            placeholder="https://..."
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          />
        </td>
        <td className="table-cell">
          <input
            className="input py-1 text-sm"
            placeholder="Anotações"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </td>
        <td className="table-cell">
          <div className="flex gap-1">
            <button onClick={save} className="text-green-600 hover:text-green-700 p-1">
              <Check size={13} />
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700 p-1">
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      <td className="table-cell font-medium text-gray-700">{link.title || '—'}</td>
      <td className="table-cell max-w-xs">
        {link.url ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:text-brand-600 flex items-center gap-1 text-sm group/link"
          >
            <ExternalLink size={11} className="shrink-0" />
            <span className="truncate group-hover/link:underline">{link.url}</span>
          </a>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>
      <td className="table-cell text-gray-400 text-sm">{link.notes || '—'}</td>
      <td className="table-cell w-16">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brand-500 p-1">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(link.id)} className="text-gray-400 hover:text-red-400 p-1">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddLinkForm({ categoryId, onAdded }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', notes: '' });

  if (!show) return (
    <button
      onClick={() => setShow(true)}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 mt-2 px-2 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
    >
      <Plus size={12} /> Adicionar material
    </button>
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await axios.post(`/api/work/${categoryId}/links`, form);
    setForm({ title: '', url: '', notes: '' });
    setShow(false);
    onAdded();
  };

  return (
    <form onSubmit={submit} className="mt-2 p-3 bg-gray-50 rounded-xl flex flex-col gap-2 border border-gray-100">
      <div className="flex gap-2 flex-wrap">
        <input
          autoFocus
          className="input text-sm flex-1 min-w-40"
          placeholder="Título do material *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          className="input text-sm flex-1 min-w-40"
          placeholder="URL (https://...)"
          value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        />
      </div>
      <input
        className="input text-sm"
        placeholder="Anotações (opcional)"
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-xs py-1.5">Salvar</button>
        <button type="button" className="btn-ghost text-xs" onClick={() => setShow(false)}>Cancelar</button>
      </div>
    </form>
  );
}

function CategorySection({ cat, onDelete, onRefresh, sectionRef }) {
  const updateLink = async (linkId, data) => {
    await axios.put(`/api/work/links/${linkId}`, data);
    onRefresh();
  };
  const deleteLink = async (linkId) => {
    await axios.delete(`/api/work/links/${linkId}`);
    onRefresh();
  };

  return (
    <div ref={sectionRef} className="card overflow-hidden p-0 mb-5 scroll-mt-4">
      {/* Barra de cor */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: cat.color }} />

      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {cat.emoji && <span className="mr-2">{cat.emoji}</span>}
              {cat.title}
            </h2>
            {cat.description && (
              <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{cat.description}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(cat.id)}
            className="text-gray-300 hover:text-red-400 transition-colors ml-4 shrink-0 mt-1"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Tabela de links */}
        {cat.links.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 border-b border-gray-100">
                  <th className="table-cell font-semibold">Título</th>
                  <th className="table-cell font-semibold">Link da aula</th>
                  <th className="table-cell font-semibold">Anotações</th>
                  <th className="table-cell w-16" />
                </tr>
              </thead>
              <tbody>
                {cat.links.map(link => (
                  <LinkRow key={link.id} link={link} onDelete={deleteLink} onUpdate={updateLink} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cat.links.length === 0 && (
          <p className="text-xs text-gray-300 italic mb-1">Nenhum material adicionado ainda.</p>
        )}

        <AddLinkForm categoryId={cat.id} onAdded={onRefresh} />
      </div>
    </div>
  );
}

function NewCategoryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', emoji: '📚', color: COLORS[0] });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await axios.post('/api/work', form);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Nova categoria</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="w-24">
              <label className="text-xs text-gray-400 mb-1 block">Emoji</label>
              <select
                className="input text-center text-lg"
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              >
                {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Nome *</label>
              <input
                className="input"
                placeholder="Ex: Meta Ads, Criativos..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição <span className="text-gray-300">(opcional)</span></label>
            <textarea
              className="input resize-none h-16"
              placeholder="Sobre o que é essa categoria..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all
                    ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary mt-1">Criar categoria</button>
        </form>
      </div>
    </div>
  );
}

export default function Work() {
  const [categories, setCategories] = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const sectionRefs = useRef({});

  const load = async () => {
    const { data } = await axios.get('/api/work');
    setCategories(data);
  };

  useEffect(() => { load(); }, []);

  const deleteCategory = async (id) => {
    if (!confirm('Deletar esta categoria e todos os materiais?')) return;
    await axios.delete(`/api/work/${id}`);
    load();
  };

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <BookOpen size={22} className="text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Trabalho</h1>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova categoria
        </button>
      </div>

      {/* Índice (aparece com 2+ categorias) */}
      {categories.length >= 2 && (
        <div className="card mb-6 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Índice</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                {cat.title}
                {cat.links.length > 0 && (
                  <span className="text-xs text-gray-400 ml-0.5">({cat.links.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {categories.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhuma categoria ainda.</p>
          <p className="text-sm mt-1">Crie categorias para organizar seus materiais de estudo.</p>
          <button className="btn-primary mt-4 inline-flex items-center gap-1.5" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Criar primeira categoria
          </button>
        </div>
      )}

      {/* Seções por categoria */}
      {categories.map(cat => (
        <CategorySection
          key={cat.id}
          cat={cat}
          sectionRef={el => sectionRefs.current[cat.id] = el}
          onDelete={deleteCategory}
          onRefresh={load}
        />
      ))}

      {showModal && <NewCategoryModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
