import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, ChevronRight } from 'lucide-react';

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const excerpt = (text, n = 120) => text.length > n ? text.slice(0, n) + '…' : text;

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [writing, setWriting] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [content, setContent] = useState('');
  const textRef = useRef(null);

  const load = async () => {
    const { data } = await axios.get('/api/diary');
    setEntries(data);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (writing && textRef.current) textRef.current.focus();
  }, [writing]);

  const save = async () => {
    if (!content.trim()) return;
    await axios.post('/api/diary', { content });
    setContent('');
    setWriting(false);
    load();
  };

  const del = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deletar esta entrada?')) return;
    await axios.delete(`/api/diary/${id}`);
    if (viewing?.id === id) setViewing(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Diário</h1>
        {!writing && (
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setWriting(true)}>
            <Plus size={15} /> Nova entrada
          </button>
        )}
      </div>

      {writing && (
        <div className="card mb-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">{fmtDate(new Date().toISOString())}</span>
            <button onClick={() => { setWriting(false); setContent(''); }} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
          </div>
          <textarea
            ref={textRef}
            className="input resize-none h-48 mb-3"
            placeholder="Escreva o que está pensando..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => { setWriting(false); setContent(''); }}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Salvar</button>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">{fmtDate(viewing.created_at)}</span>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {viewing.content}
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !writing && (
        <div className="text-center py-20 text-gray-400">
          <p>Nenhuma entrada ainda.</p>
          <p className="text-sm mt-1">Comece a escrever seu diário!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entries.map(e => (
          <div
            key={e.id}
            className="card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => setViewing(e)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{fmtDate(e.created_at)}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{excerpt(e.content)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(ev) => del(e.id, ev)} className="text-gray-300 hover:text-red-400 p-1 transition-colors">
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
