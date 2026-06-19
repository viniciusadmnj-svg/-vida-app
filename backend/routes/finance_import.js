const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/rules', async (req, res) => {
  try { res.json(await db.all('finance_rules')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/rules', async (req, res) => {
  try {
    const { pattern, label } = req.body;
    const rule = await db.insert('finance_rules', { pattern: pattern || '', label: label || '' });
    res.json(rule);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const { pattern, label } = req.body;
    await db.update('finance_rules', Number(req.params.id), { pattern: pattern || '', label: label || '' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    await db.delete('finance_rules', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/confirm', async (req, res) => {
  try {
    const { entries, month, year } = req.body;
    let inserted = 0;
    for (const e of entries) {
      await db.insert('finance_entries', {
        day: Number(e.day),
        description: e.description || '',
        entrada: Number(e.entrada) || 0,
        saida:   Number(e.saida)   || 0,
        month:   Number(month),
        year:    Number(year),
      });
      inserted++;
    }
    res.json({ ok: true, inserted });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
