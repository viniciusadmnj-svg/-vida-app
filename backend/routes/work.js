const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.put('/links/:linkId', async (req, res) => {
  try {
    await db.update('work_tasks', Number(req.params.linkId), req.body);
    res.json(await db.get('work_tasks', Number(req.params.linkId)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/links/:linkId', async (req, res) => {
  try {
    await db.delete('work_tasks', Number(req.params.linkId));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const categories = await db.all('work_projects');
    const links      = await db.all('work_tasks');
    res.json(categories.map(c => ({ ...c, links: links.filter(l => l.project_id === c.id) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, emoji, color } = req.body;
    const row = await db.insert('work_projects', {
      title: title || '', description: description || '',
      emoji: emoji || '📚', color: color || '#6366f1',
    });
    res.json({ ...row, links: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await db.update('work_projects', Number(req.params.id), req.body);
    res.json(await db.get('work_projects', Number(req.params.id)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.deleteWhere('work_tasks', r => r.project_id === id);
    await db.delete('work_projects', id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/links', async (req, res) => {
  try {
    const { title, url, notes } = req.body;
    const link = await db.insert('work_tasks', {
      project_id: Number(req.params.id),
      title: title || '', url: url || '', notes: notes || '',
    });
    res.json(link);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
