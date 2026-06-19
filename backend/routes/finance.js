const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const entries = (await db.all('finance_entries',
      e => e.month === Number(month) && e.year === Number(year)
    )).sort((a, b) => a.day - b.day || a.id - b.id);
    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { day, description, entrada, saida, month, year } = req.body;
    const entry = await db.insert('finance_entries', {
      day: Number(day), description: description || '',
      entrada: Number(entrada) || 0, saida: Number(saida) || 0,
      month: Number(month), year: Number(year),
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { day, description, entrada, saida } = req.body;
    await db.update('finance_entries', Number(req.params.id), {
      day: Number(day), description: description || '',
      entrada: Number(entrada) || 0, saida: Number(saida) || 0,
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clear', async (req, res) => {
  try {
    const { month, year } = req.query;
    await db.deleteWhere('finance_entries', e => e.month === Number(month) && e.year === Number(year));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.delete('finance_entries', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
