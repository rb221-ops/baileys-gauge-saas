const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

const users = new Map();

const generateStockData = (ticker) => ({
  ticker: ticker.toUpperCase(),
  price: (Math.random() * 200 + 20).toFixed(2),
  change: ((Math.random() - 0.5) * 30).toFixed(2),
  percentChange: ((Math.random() - 0.5) * 15).toFixed(2),
  volume: (Math.random() * 100000000).toFixed(0),
  rsi: (Math.random() * 100).toFixed(1),
  macd: (Math.random() - 0.5).toFixed(3),
  signal: (Math.random() * 100).toFixed(0),
  pe_ratio: (Math.random() * 40 + 5).toFixed(2),
  earnings_date: '2026-05-15',
  dividend_yield: (Math.random() * 8).toFixed(2),
  dayHigh: (Math.random() * 200 + 100).toFixed(2),
  dayLow: (Math.random() * 100 + 50).toFixed(2),
  fiftyTwoWeekHigh: (Math.random() * 300 + 150).toFixed(2),
  fiftyTwoWeekLow: (Math.random() * 100 + 30).toFixed(2),
  gapUp: Math.random() > 0.7,
  volumeSpike: Math.random() > 0.6,
  breakout: Math.random() > 0.5,
  oversold: Math.random() > 0.7
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (users.has(email)) return res.status(400).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    users.set(email, { id: 'u' + Date.now(), email, password: hash, name, plan: 'free' });
    const token = jwt.sign({ userId: users.get(email).id, email }, 'secret');
    res.json({ token, user: { id: users.get(email).id, email, name, plan: 'free' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ userId: user.id, email }, 'secret');
    res.json({ token, user: { id: user.id, email, name: user.name, plan: user.plan } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'no token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    res.json(user);
  } catch { res.status(401).json({ error: 'bad token' }); }
});

app.post('/api/scan', async (req, res) => {
  try {
    const { tickers } = req.body;
    const results = [];
    const API_KEY = 49V5A7DR5QAL612L // Replace with your Alpha Vantage key

    for (let ticker of tickers) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote && quote['05. price']) {
          results.push({
            ticker: ticker.toUpperCase(),
            price: quote['05. price'],
            change: quote['09. change'] || '0',
            percentChange: quote['10. change percent'] || '0%',
            volume: quote['06. volume'] || '0',
            rsi: (Math.random() * 100).toFixed(1),
            signal: (Math.random() * 100).toFixed(0),
            pe_ratio: (Math.random() * 40 + 5).toFixed(2),
            dividend_yield: (Math.random() * 8).toFixed(2),
            dayHigh: quote['03. high'] || '0',
            dayLow: quote['04. low'] || '0',
            gapUp: Math.random() > 0.7,
            breakout: Math.random() > 0.5,
            oversold: Math.random() > 0.7
          });
        }
      } catch (err) {
        console.log(`Error fetching ${ticker}:`, err.message);
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(5001, () => console.log('🎯 Running on :5001'));
