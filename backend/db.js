const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Cria as tabelas na inicialização
async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

initDB().catch(err => {
  console.error('Erro ao inicializar banco de dados:', err.message);
  process.exit(1);
});

const db = {
  // Retorna todas as linhas. filter é uma função JS opcional (para manter compatibilidade).
  async all(table, filter = null) {
    const { rows } = await pool.query(`SELECT * FROM "${table}" ORDER BY id`);
    return filter ? rows.filter(filter) : rows;
  },

  async get(table, id) {
    const { rows } = await pool.query(`SELECT * FROM "${table}" WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async insert(table, data) {
    const keys   = Object.keys(data).filter(k => k !== 'id');
    const values = keys.map(k => data[k]);
    const cols   = keys.map(k => `"${k}"`).join(', ');
    const ph     = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO "${table}" (${cols}) VALUES (${ph}) RETURNING *`,
      values
    );
    return rows[0];
  },

  async update(table, id, data) {
    const keys = Object.keys(data).filter(k => k !== 'id');
    if (keys.length === 0) return false;
    const values = keys.map(k => data[k]);
    const set    = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const { rowCount } = await pool.query(
      `UPDATE "${table}" SET ${set} WHERE id = $${keys.length + 1}`,
      [...values, id]
    );
    return rowCount > 0;
  },

  async delete(table, id) {
    const { rowCount } = await pool.query(`DELETE FROM "${table}" WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  // filter é uma função JS; busca tudo e filtra em JS (ok para app pessoal)
  async deleteWhere(table, filter) {
    const { rows } = await pool.query(`SELECT * FROM "${table}"`);
    const toDelete = rows.filter(filter);
    if (toDelete.length === 0) return 0;
    const ids = toDelete.map(r => r.id);
    const ph  = ids.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(`DELETE FROM "${table}" WHERE id IN (${ph})`, ids);
    return toDelete.length;
  },
};

module.exports = db;
