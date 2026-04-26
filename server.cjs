const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.API_PORT || 3001);

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Vinod@8999',
  database: process.env.MYSQL_DATABASE || 'sofa_showroom',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;
let initPromise;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Sofa showroom API is running.',
    apiHealth: '/api/health',
    demos: '/api/demos',
  });
});

async function ensureDatabase() {
  const bootstrap = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await bootstrap.end();
}

async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureDatabase();
      pool = mysql.createPool(dbConfig);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sofa_demos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(160) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          alternate_phone VARCHAR(40),
          address TEXT,
          expected_delivery_date DATE,
          advance_amount DECIMAL(12,2) DEFAULT 0,
          balance_amount DECIMAL(12,2) DEFAULT 0,
          sofa_type VARCHAR(80) NOT NULL,
          sofa_category VARCHAR(120) NOT NULL,
          material VARCHAR(80) NOT NULL,
          color VARCHAR(40) NOT NULL,
          seat_count VARCHAR(120) NOT NULL,
          dimensions VARCHAR(180) NOT NULL,
          selected_image_data LONGTEXT,
          config_json JSON NOT NULL,
          customer_json JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query('ALTER TABLE sofa_demos ADD COLUMN selected_image_data LONGTEXT').catch(() => {});
    })();
  }

  return initPromise;
}

function parseJsonField(value) {
  if (!value) return {};
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function toDemoRow(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    alternatePhone: row.alternate_phone,
    address: row.address,
    expectedDeliveryDate: row.expected_delivery_date,
    advanceAmount: Number(row.advance_amount || 0),
    balanceAmount: Number(row.balance_amount || 0),
    sofaType: row.sofa_type,
    sofaCategory: row.sofa_category,
    material: row.material,
    color: row.color,
    seatCount: row.seat_count,
    dimensions: row.dimensions,
    config: parseJsonField(row.config_json),
    customer: parseJsonField(row.customer_json),
    createdAt: row.created_at,
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await initDb();
    res.json({ ok: true, database: dbConfig.database });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.get('/api/demos', async (_req, res) => {
  try {
    await initDb();
    const [rows] = await pool.query('SELECT * FROM sofa_demos ORDER BY created_at DESC, id DESC LIMIT 100');
    res.json(rows.map(toDemoRow));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/demos', async (req, res) => {
  try {
    await initDb();
    const { customer, config, sofa } = req.body;

    if (!customer?.name || !customer?.phone) {
      res.status(400).json({ message: 'Customer name and phone number are required.' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO sofa_demos (
        customer_name, phone, alternate_phone, address, expected_delivery_date,
        advance_amount, balance_amount, sofa_type, sofa_category, material, color,
        seat_count, dimensions, selected_image_data, config_json, customer_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.phone,
        customer.alternatePhone || '',
        customer.address || '',
        customer.expectedDeliveryDate || null,
        Number(customer.advanceAmount || 0),
        Number(customer.balanceAmount || 0),
        config.type,
        config.sofaCategory,
        config.material,
        config.color,
        sofa.seats.label,
        sofa.dimensions,
        '',
        JSON.stringify(config),
        JSON.stringify(customer),
      ],
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/demos/:id', async (req, res) => {
  try {
    await initDb();
    await pool.execute('DELETE FROM sofa_demos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sofa showroom API running on http://127.0.0.1:${PORT}`);
});
