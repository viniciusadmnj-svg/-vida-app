const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();
    const LABELS       = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    const [goals, checkins, exercises, nutrition, diaryAll] = await Promise.all([
      db.all('goals'),
      db.all('goal_checkins'),
      db.all('workout_exercises'),
      db.all('nutrition_entries', e => e.month === currentMonth && e.year === currentYear),
      db.all('diary_entries'),
    ]);

    // Metas
    const goalsData = goals.map(g => {
      const count = checkins.filter(c => c.goal_id === g.id).length;
      return {
        id: g.id, title: g.title, target_value: g.target_value, unit: g.unit,
        checkins_count: count,
        progress: Math.min(Math.round((count / g.target_value) * 100), 100),
      };
    }).sort((a, b) => b.progress - a.progress);

    // Financeiro: últimos 6 meses (paralelo)
    const financeMonths = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        return db.all('finance_entries', e => e.month === m && e.year === y).then(entries => ({
          month: m, year: y,
          label: `${LABELS[m - 1]}/${String(y).slice(2)}`,
          entrada: entries.reduce((s, e) => s + Number(e.entrada || 0), 0),
          saida:   entries.reduce((s, e) => s + Number(e.saida   || 0), 0),
        }));
      })
    );

    // Treinos
    const daysWithExercises = new Set(exercises.map(e => e.day_of_week)).size;

    // Alimentação
    const cumpridos     = nutrition.filter(e => e.is_complied === 1 || e.is_complied === true).length;
    const desvios       = nutrition.length - cumpridos;
    const compliancePct = nutrition.length > 0 ? Math.round((cumpridos / nutrition.length) * 100) : null;

    // Diário
    const sorted = [...diaryAll].sort((a, b) => b.id - a.id);
    const diaryRecent = sorted.slice(0, 3).map(e => ({
      id: e.id,
      excerpt: e.content.slice(0, 100) + (e.content.length > 100 ? '…' : ''),
      created_at: e.created_at,
    }));

    res.json({
      goals:    goalsData,
      finance:  { months: financeMonths, current: financeMonths[financeMonths.length - 1] },
      workouts: { total_exercises: exercises.length, days_with_exercises: daysWithExercises },
      nutrition:{ total: nutrition.length, desvios, compliance_pct: compliancePct },
      diary:    { total: diaryAll.length, recent: diaryRecent },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
