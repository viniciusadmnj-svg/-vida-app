const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const items = (await db.all('diet_plan')).sort((a, b) => a.order_index - b.order_index || a.id - b.id);
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { meal_name, description, order_index } = req.body;
    const count = (await db.all('diet_plan')).length;
    const item  = await db.insert('diet_plan', {
      meal_name: meal_name || '', description: description || '',
      order_index: order_index ?? count,
    });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { meal_name, description, order_index } = req.body;
    await db.update('diet_plan', Number(req.params.id), { meal_name, description, order_index });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.delete('diet_plan', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
