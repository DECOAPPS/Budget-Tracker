const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'transactions.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function readData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getMonthKey(date) {
  const d = new Date(date || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET all transactions for a month
app.get('/api/transactions', (req, res) => {
  const month = req.query.month || getMonthKey();
  const data = readData();
  res.json(data[month] || []);
});

// POST add a transaction
app.post('/api/transactions', (req, res) => {
  const { desc, amount, who, date } = req.body;
  if (!desc || !amount || !who || !date) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const month = getMonthKey(date);
  const data = readData();
  if (!data[month]) data[month] = [];
  const tx = { id: Date.now(), desc, amount: parseFloat(amount), who, date };
  data[month].push(tx);
  writeData(data);
  res.json(tx);
});

// DELETE a transaction
app.delete('/api/transactions/:month/:id', (req, res) => {
  const { month, id } = req.params;
  const data = readData();
  if (!data[month]) return res.status(404).json({ error: 'Month not found' });
  data[month] = data[month].filter(tx => tx.id !== parseInt(id));
  writeData(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Budget tracker running on port ${PORT}`);
});
