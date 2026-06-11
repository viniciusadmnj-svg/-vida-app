/**
 * Migra os dados dos arquivos JSON locais para o banco PostgreSQL (Supabase/Railway).
 * Execute UMA VEZ após configurar o DATABASE_URL:
 *
 *   DATABASE_URL="postgresql://..." node migrate-from-json.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DATA_DIR = path.join(__dirname, 'data');

function loadJSON(name) {
  const fp = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  try {
    const { rows } = JSON.parse(fs.readFileSync(fp, 'utf8'));
    return rows || [];
  } catch { return []; }
}

async function insertRows(table, rows) {
  if (rows.length === 0) { console.log(`  ${table}: vazio, pulando.`); return; }
  let ok = 0;
  for (const row of rows) {
    const keys   = Object.keys(row).filter(k => k !== 'id');
    const values = keys.map(k => row[k]);
    const cols   = keys.map(k => `"${k}"`).join(', ');
    const ph     = keys.map((_, i) => `$${i + 1}`).join(', ');
    try {
      // Preserva o ID original para manter as foreign keys intactas
      await pool.query(
        `INSERT INTO "${table}" (id, ${cols}) VALUES ($${keys.length + 1}, ${ph})
         ON CONFLICT (id) DO NOTHING`,
        [...values, row.id]
      );
      ok++;
    } catch (e) {
      console.warn(`  Erro em ${table} id=${row.id}: ${e.message}`);
    }
  }
  console.log(`  ${table}: ${ok}/${rows.length} inseridos.`);
}

async function resetSequence(table) {
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'),
     COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
  );
}

async function main() {
  console.log('🔄 Iniciando migração JSON → PostgreSQL...\n');

  // Cria as tabelas se ainda não existirem
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✓ Schema criado/verificado\n');

  const tables = [
    'goals', 'goal_checkins',
    'diary_entries',
    'workout_exercises',
    'finance_entries', 'finance_recurring',
    'nutrition_entries', 'diet_plan',
    'work_projects', 'work_tasks',
  ];

  for (const table of tables) {
    const rows = loadJSON(table);
    await insertRows(table, rows);
    await resetSequence(table);
  }

  console.log('\n✅ Migração concluída!');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
