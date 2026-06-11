const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const entries = (await db.all('nutrition_entries',
      e => e.month === Number(month) && e.year === Number(year)
    )).sort((a, b) => b.date?.localeCompare(a.date) || b.id - a.id);
    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, entry_type, food_eaten, is_complied, notes, month, year } = req.body;
    let resolved = entry_type === 'complied' ? 1 : entry_type === 'not_complied' ? 0 : (is_complied ? 1 : 0);
    const entry = await db.insert('nutrition_entries', {
      date, entry_type: entry_type || 'custom',
      food_eaten: food_eaten || '', is_complied: resolved,
      notes: notes || '', month: Number(month), year: Number(year),
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { date, entry_type, food_eaten, is_complied, notes, month, year } = req.body;
    let resolved = entry_type === 'complied' ? 1 : entry_type === 'not_complied' ? 0 : (is_complied ? 1 : 0);
    await db.update('nutrition_entries', Number(req.params.id), {
      date, entry_type: entry_type || 'custom',
      food_eaten: food_eaten || '', is_complied: resolved,
      notes: notes || '', month: Number(month), year: Number(year),
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.delete('nutrition_entries', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
