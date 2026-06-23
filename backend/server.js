require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/summary',           require('./routes/summary'));
app.use('/api/goals',             require('./routes/goals'));
app.use('/api/diary',             require('./routes/diary'));
app.use('/api/workouts',          require('./routes/workouts'));
app.use('/api/finance/import',    require('./routes/finance_import'));
app.use('/api/finance/recurring', require('./routes/finance_recurring'));
app.use('/api/finance',           require('./routes/finance'));
app.use('/api/nutrition',         require('./routes/nutrition'));
app.use('/api/macros',            require('./routes/macros'));
app.use('/api/diet-plan',         require('./routes/diet_plan'));
app.use('/api/work',              require('./routes/work'));

// Frontend estático (build de produção)
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Vida rodando na porta ${PORT}`));
