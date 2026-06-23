const express = require('express');
const router  = express.Router();
const db      = require('../db');

const n = v => Number(v) || 0;

router.get('/goals', async (req, res) => {
  try {
    const rows = await db.all('macro_goals');
    res.json(rows[0] || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/goals', async (req, res) => {
  try {
    const { calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g } = req.body;
    const data = { calories: n(calories), protein_g: n(protein_g), carbs_g: n(carbs_g), fat_g: n(fat_g), fiber_g: n(fiber_g), sugar_g: n(sugar_g) };
    const rows = await db.all('macro_goals');
    if (rows.length > 0) {
      await db.update('macro_goals', rows[0].id, data);
    } else {
      await db.insert('macro_goals', data);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const rows = await db.all('macro_logs', date ? r => r.date === date : null);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, meal_name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, month, year } = req.body;
    const entry = await db.insert('macro_logs', {
      date, meal_name: meal_name || '',
      calories: n(calories), protein_g: n(protein_g), carbs_g: n(carbs_g),
      fat_g: n(fat_g), fiber_g: n(fiber_g), sugar_g: n(sugar_g),
      month: n(month), year: n(year),
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.delete('macro_logs', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
