import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Target, Wallet, Dumbbell, Salad, BookOpen } from 'lucide-react';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const todayLabel = () => new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

function FinanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-md">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-green-600">Entrada: {fmt(payload[0]?.value)}</p>
      <p className="text-red-500">Saída: {fmt(payload[1]?.value)}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gray-100 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function GoalBar({ goal }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-700 truncate max-w-[70%]">{goal.title}</span>
        <span className="text-gray-400 shrink-0 ml-2">
          {goal.checkins_count}/{goal.target_value} {goal.unit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/summary').then(r => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando...
        </div>
      </div>
    );
  }

  const { goals, finance, workouts, nutrition, diary } = data;
  const saldo = (finance.current?.entrada || 0) - (finance.current?.saida || 0);
  const avgProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;

  const pieData = nutrition.total > 0
    ? [
        { name: 'Na dieta', value: nutrition.total - nutrition.desvios, color: '#22c55e' },
        { name: 'Desvios',  value: nutrition.desvios,                  color: '#f97316' },
      ]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()} 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Metas ativas"
          value={`${goals.length} meta${goals.length !== 1 ? 's' : ''}`}
          sub={goals.length ? `${avgProgress}% de progresso médio` : 'Nenhuma meta'}
          color="text-brand-500"
        />
        <StatCard
          icon={Wallet}
          label="Saldo do mês"
          value={fmt(saldo)}
          sub={`Entrada ${fmt(finance.current?.entrada)} · Saída ${fmt(finance.current?.saida)}`}
          color={saldo >= 0 ? 'text-green-600' : 'text-red-500'}
        />
        <StatCard
          icon={Dumbbell}
          label="Treinos"
          value={`${workouts.total_exercises} exercícios`}
          sub={`${workouts.days_with_exercises} dia${workouts.days_with_exercises !== 1 ? 's' : ''} na semana`}
          color="text-purple-500"
        />
        <StatCard
          icon={Salad}
          label="Alimentação"
          value={nutrition.compliance_pct !== null ? `${nutrition.compliance_pct}% na dieta` : 'Sem dados'}
          sub={nutrition.total > 0 ? `${nutrition.desvios} desvio${nutrition.desvios !== 1 ? 's' : ''} este mês` : 'Nenhum registro'}
          color={nutrition.compliance_pct >= 80 ? 'text-green-600' : nutrition.compliance_pct !== null ? 'text-orange-500' : 'text-gray-400'}
        />
      </div>

      {/* Financeiro + Metas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Receitas × Despesas</h2>
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />Entrada</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />Saída</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={finance.months} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<FinanceTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="entrada" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saida"   fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col">
          <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Target size={14} className="text-brand-500" /> Metas em andamento
          </h2>
          {goals.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-8">Nenhuma meta cadastrada</p>
          ) : (
            <div className="flex-1">
              {goals.slice(0, 6).map(g => <GoalBar key={g.id} goal={g} />)}
              {goals.length > 6 && (
                <p className="text-xs text-gray-400 mt-3">+{goals.length - 6} outras metas</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diário + Alimentação */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-amber-500" /> Últimas entradas do diário
          </h2>
          {diary.recent.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-8">Nenhuma entrada ainda</p>
          ) : (
            <div className="space-y-3">
              {diary.recent.map(e => (
                <div key={e.id} className="border-l-2 border-gray-200 pl-3">
                  <p className="text-xs text-gray-400 mb-0.5">{fmtDate(e.created_at)}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{e.excerpt}</p>
                </div>
              ))}
              {diary.total > 3 && (
                <p className="text-xs text-gray-400">+{diary.total - 3} entradas anteriores</p>
              )}
            </div>
          )}
        </div>

        <div className="card flex flex-col">
          <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Salad size={14} className="text-green-500" /> Alimentação este mês
          </h2>
          {!pieData ? (
            <p className="text-gray-400 text-xs text-center py-8">Nenhum registro este mês</p>
          ) : (
            <div className="flex flex-col items-center flex-1">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: '#374151' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-xs mt-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-500">{d.name}</span>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-2xl font-bold mt-3" style={{ color: nutrition.compliance_pct >= 80 ? '#22c55e' : '#f97316' }}>
                {nutrition.compliance_pct}%
              </p>
              <p className="text-xs text-gray-400">aderência à dieta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
