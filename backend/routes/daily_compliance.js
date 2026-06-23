const express = require('express');
const router  = express.Router();
const db      = require('../db');
const n = v => Number(v) || 0;

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const rows = await db.all('daily_compliance', date ? r => r.date === date : null);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, meal_plan_id, status, dev_food, dev_calories, dev_protein, dev_carbs, dev_fat, dev_fiber, dev_sugar, month, year } = req.body;
    const data = {
      date,
      meal_plan_id: n(meal_plan_id),
      status:       status || 'complied',
      dev_food:     dev_food || '',
      dev_calories: n(dev_calories), dev_protein: n(dev_protein),
      dev_carbs:    n(dev_carbs),    dev_fat:     n(dev_fat),
      dev_fiber:    n(dev_fiber),    dev_sugar:   n(dev_sugar),
      month: n(month), year: n(year),
    };
    const existing = await db.all('daily_compliance',
      r => r.date === date && Number(r.meal_plan_id) === Number(meal_plan_id)
    );
    let row;
    if (existing.length > 0) {
      await db.update('daily_compliance', existing[0].id, data);
      row = { ...existing[0], ...data };
    } else {
      row = await db.insert('daily_compliance', data);
    }
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('daily_compliance', Number(req.params.id)); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
