const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const rows = (await db.all('finance_recurring')).sort((a, b) => a.day - b.day);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { description, entrada, saida, day, active } = req.body;
    const row = await db.insert('finance_recurring', {
      description: description || '',
      entrada: Number(entrada) || 0,
      saida:   Number(saida)   || 0,
      day:     Number(day),
      active:  active !== false ? 1 : 0,
    });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, entrada, saida, day, active } = req.body;
    await db.update('finance_recurring', Number(req.params.id), {
      description: description || '',
      entrada: Number(entrada) || 0,
      saida:   Number(saida)   || 0,
      day:     Number(day),
      active:  active ? 1 : 0,
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.delete('finance_recurring', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/apply', async (req, res) => {
  try {
    const { month, year } = req.body;
    const recorrentes = await db.all('finance_recurring', r => r.active === 1);
    let inserted = 0;

    for (const r of recorrentes) {
      const existing = await db.all('finance_entries', e =>
        e.month        === Number(month) &&
        e.year         === Number(year)  &&
        e.recurring_id === r.id
      );
      if (existing.length === 0) {
        await db.insert('finance_entries', {
          day: r.day, description: r.description,
          entrada: r.entrada, saida: r.saida,
          month: Number(month), year: Number(year),
          recurring_id: r.id,
        });
        inserted++;
      }
    }

    res.json({ ok: true, inserted, skipped: recorrentes.length - inserted });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
