const express   = require('express');
const router    = express.Router();
const db        = require('../db');
const multer    = require('multer');
const pdfParse  = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const n = v => Number(v) || 0;

const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada no servidor');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

router.get('/', async (req, res) => {
  try { res.json(await db.all('meal_plans')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/bulk', async (req, res) => {
  try {
    await db.deleteWhere('meal_plans', () => true);
    const { meals } = req.body;
    const saved = [];
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      saved.push(await db.insert('meal_plans', {
        meal_type:   m.meal_type   || '',
        description: m.description || '',
        calories:    n(m.calories),  protein_g: n(m.protein_g),
        carbs_g:     n(m.carbs_g),   fat_g:     n(m.fat_g),
        fiber_g:     n(m.fiber_g),   sugar_g:   n(m.sugar_g),
        order_index: i,
      }));
    }
    res.json(saved);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { meal_type, description, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g } = req.body;
    await db.update('meal_plans', Number(req.params.id), {
      meal_type: meal_type || '', description: description || '',
      calories: n(calories), protein_g: n(protein_g), carbs_g: n(carbs_g),
      fat_g: n(fat_g), fiber_g: n(fiber_g), sugar_g: n(sugar_g),
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('meal_plans', Number(req.params.id)); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const { text } = await pdfParse(req.file.buffer);
    if (!text?.trim()) return res.status(400).json({ error: 'Não foi possível extrair texto do PDF' });

    const client = getClient();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Você é nutricionista. Extraia o plano alimentar deste documento e retorne um array JSON.

Cada item deve ter:
- meal_type: nome da refeição (ex: "Café da Manhã", "Almoço", "Jantar", "Lanche", "Ceia")
- description: o que comer (descrição concisa)
- calories: calorias totais (número — estime se não informado)
- protein_g: proteínas em gramas
- carbs_g: carboidratos em gramas
- fat_g: gordura em gramas
- fiber_g: fibra em gramas
- sugar_g: açúcar em gramas

Retorne SOMENTE o array JSON, sem markdown, sem explicações.

Cardápio:
${text.slice(0, 8000)}`,
      }],
    });

    const raw = msg.content[0].text.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return res.status(500).json({ error: 'Claude não retornou JSON válido' });
    res.json({ meals: JSON.parse(match[0]) });
  } catch (e) {
    console.error('parse-pdf:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/estimate-macros', async (req, res) => {
  try {
    const { food } = req.body;
    if (!food?.trim()) return res.status(400).json({ error: 'Descrição vazia' });

    const client = getClient();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Estime os macros nutricionais para: "${food}".
Retorne SOMENTE JSON: {"calories":N,"protein_g":N,"carbs_g":N,"fat_g":N,"fiber_g":N,"sugar_g":N}`,
      }],
    });

    const raw = msg.content[0].text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Não foi possível estimar' });
    res.json(JSON.parse(match[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
