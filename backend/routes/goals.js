const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const goals    = (await db.all('goals')).sort((a, b) => b.id - a.id);
    const checkins = await db.all('goal_checkins');
    res.json(goals.map(g => ({
      ...g,
      checkins: checkins.filter(c => c.goal_id === g.id).map(c => c.date),
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, target_value, unit, start_date, end_date } = req.body;
    const goal = await db.insert('goals', {
      title, description: description || '', target_value,
      unit: unit || 'dias',
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
    });
    res.json({ ...goal, checkins: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, target_value, unit, start_date, end_date } = req.body;
    await db.update('goals', Number(req.params.id), {
      title, description, target_value, unit, start_date, end_date: end_date || null,
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.deleteWhere('goal_checkins', c => c.goal_id === id);
    await db.delete('goals', id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/checkin', async (req, res) => {
  try {
    const goal_id = Number(req.params.id);
    const { date } = req.body;
    const existing = await db.all('goal_checkins', c => c.goal_id === goal_id && c.date === date);
    if (existing.length > 0) {
      await db.deleteWhere('goal_checkins', c => c.goal_id === goal_id && c.date === date);
      res.json({ ok: true, action: 'removed' });
    } else {
      await db.insert('goal_checkins', { goal_id, date });
      res.json({ ok: true, action: 'added' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
