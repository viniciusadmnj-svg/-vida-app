const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const exercises = (await db.all('workout_exercises'))
      .sort((a, b) => a.day_of_week - b.day_of_week || a.order_index - b.order_index);
    const byDay = {};
    for (let i = 0; i <= 6; i++) byDay[i] = [];
    exercises.forEach(e => { byDay[e.day_of_week].push(e); });
    res.json(byDay);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/exercise', async (req, res) => {
  try {
    const { day_of_week, exercise_name, sets, reps, weight, notes, order_index } = req.body;
    const exercise = await db.insert('workout_exercises', {
      day_of_week, exercise_name,
      sets: sets || null, reps: reps || null, weight: weight || null,
      notes: notes || '', order_index: order_index || 0,
    });
    res.json(exercise);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/exercise/:id', async (req, res) => {
  try {
    const { exercise_name, sets, reps, weight, notes } = req.body;
    await db.update('workout_exercises', Number(req.params.id), {
      exercise_name, sets: sets || null, reps: reps || null,
      weight: weight || null, notes: notes || '',
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/exercise/:id', async (req, res) => {
  try {
    await db.delete('workout_exercises', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
