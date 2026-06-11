import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Pencil, Check } from 'lucide-react';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const emptyEx = () => ({ exercise_name: '', sets: '', reps: '', weight: '', notes: '' });

function ExerciseRow({ ex, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ exercise_name: ex.exercise_name, sets: ex.sets || '', reps: ex.reps || '', weight: ex.weight || '', notes: ex.notes || '' });

  const save = async () => {
    await onUpdate(ex.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr className="bg-gray-50">
        <td className="table-cell"><input className="input py-1" value={form.exercise_name} onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-16" type="number" placeholder="—" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-20" placeholder="ex: 10-12" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1 w-20" type="number" step="0.5" placeholder="kg" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></td>
        <td className="table-cell"><input className="input py-1" placeholder="Obs" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></td>
        <td className="table-cell">
          <div className="flex gap-1">
            <button onClick={save} className="text-green-600 hover:text-green-700 p-1"><Check size={13} /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700 p-1"><X size={13} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="table-cell font-medium text-gray-900">{ex.exercise_name}</td>
      <td className="table-cell text-gray-600">{ex.sets || '—'}</td>
      <td className="table-cell text-gray-600">{ex.reps || '—'}</td>
      <td className="table-cell text-gray-600">{ex.weight ? `${ex.weight} kg` : '—'}</td>
      <td className="table-cell text-gray-400 text-xs">{ex.notes || ''}</td>
      <td className="table-cell">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brand-500 p-1"><Pencil size={13} /></button>
          <button onClick={() => onDelete(ex.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function DayCard({ day, exercises, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyEx());

  const add = async (e) => {
    e.preventDefault();
    if (!form.exercise_name.trim()) return;
    await axios.post('/api/workouts/exercise', { ...form, day_of_week: day, order_index: exercises.length });
    setForm(emptyEx());
    setAdding(false);
    onRefresh();
  };

  const del = async (id) => {
    await axios.delete(`/api/workouts/exercise/${id}`);
    onRefresh();
  };

  const update = async (id, data) => {
    await axios.put(`/api/workouts/exercise/${id}`, data);
    onRefresh();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{DAYS[day]}</h3>
        <button onClick={() => setAdding(!adding)} className="btn-ghost flex items-center gap-1 text-xs">
          <Plus size={13} /> Add
        </button>
      </div>

      {exercises.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="table-cell font-medium">Exercício</th>
                <th className="table-cell font-medium">Séries</th>
                <th className="table-cell font-medium">Reps</th>
                <th className="table-cell font-medium">Peso</th>
                <th className="table-cell font-medium">Obs</th>
                <th className="table-cell font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {exercises.map(ex => (
                <ExerciseRow key={ex.id} ex={ex} onDelete={del} onUpdate={update} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exercises.length === 0 && !adding && (
        <p className="text-xs text-gray-400">Nenhum exercício. Adicione o primeiro!</p>
      )}

      {adding && (
        <form onSubmit={add} className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          <input className="input flex-1 min-w-32" placeholder="Nome do exercício*" value={form.exercise_name} onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))} required />
          <input className="input w-20" type="number" placeholder="Séries" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} />
          <input className="input w-24" placeholder="Reps" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} />
          <input className="input w-24" type="number" step="0.5" placeholder="Peso (kg)" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          <input className="input flex-1 min-w-32" placeholder="Observações" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Salvar</button>
            <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Workouts() {
  const [byDay, setByDay] = useState({});

  const load = async () => {
    const { data } = await axios.get('/api/workouts');
    setByDay(data);
  };

  useEffect(() => { load(); }, []);

  const activeDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Treinos</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeDays.map(day => (
          <DayCard key={day} day={day} exercises={byDay[day] || []} onRefresh={load} />
        ))}
      </div>
    </div>
  );
}
