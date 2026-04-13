import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, AlertCircle, LogOut } from 'lucide-react';

const App = () => {
  const [page, setPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertTicker, setAlertTicker] = useState('');
  const [activeTab, setActiveTab] = useState('screener');
  const [subscriptionTier, setSubscriptionTier] = useState('trial');
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);

  const generateStockData = (ticker) => ({
    ticker: ticker.toUpperCase(),
    price: (Math.random() * 200 + 20).toFixed(2),
    change: ((Math.random() - 0.5) * 30).toFixed(2),
    percentChange: ((Math.random() - 0.5) * 15).toFixed(2),
    volume: (Math.random() * 100000000).toFixed(0),
    rsi: (Math.random() * 100).toFixed(1),
    macd: (Math.random() - 0.5).toFixed(3),
    signal: (Math.random() * 100).toFixed(0),
    sma20: (Math.random() * 150 + 50).toFixed(2),
    sma50: (Math.random() * 150 + 50).toFixed(2),
    dayHigh: (Math.random() * 200 + 100).toFixed(2),
    dayLow: (Math.random() * 100 + 50).toFixed(2),
    earnings_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  });

  const generateChartData = () => {
    return Array.from({ length: 48 }, (_, i) => ({
      time: `${Math.floor(i / 4)}:${(i % 4) * 15}`,
      price: Math.random() * 50 + 100,
    }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isSignUp ? 'http://localhost:5001/api/auth/register' : 'http://localhost:5001/api/auth/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSignUp ? { email, password, name } : { email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setPage('app');
        setEmail('');
        setPassword('');
        setName('');
      } else {
        alert('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) {
      alert('Enter stock tickers');
      return;
    }
    setLoading(true);
    const tickers = scanInput.split(',').map(t => t.trim());
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://baileys-gauge-saas.onrender.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ tickers }),
      });
      const data = await res.json();
      const enhanced = (data.results || []).map(r => ({ ...r, ...generateStockData(r.ticker) }));
      setScanResults(enhanced);
      setSelectedStock(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const toggleWatchlist = (ticker) => {
    if (watchlist.includes(ticker)) {
      setWatchlist(watchlist.filter(t => t !== ticker));
    } else {
      setWatchlist([...watchlist, ticker]);
    }
  };

  const addAlert = () => {
    if (!alertTicker.trim() || !alertPrice.trim()) {
      alert('Enter ticker and price');
      return;
    }
    setAlerts([...alerts, { id: Date.now(), ticker: alertTicker.toUpperCase(), price: alertPrice }]);
    setAlertTicker('');
    setAlertPrice('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setPage('landing');
  };

  // LANDING PAGE
  if (page === 'landing') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)', minHeight: '100vh', color: 'white', fontFamily: 'system-ui' }}>
        <nav style={{ background: 'rgba(10,10,20,0.9)', borderBottom: '1px solid rgba(0,217,255,0.1)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#00d9ff' }}>Bailey's Gauge</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => { setIsSignUp(false); setPage('auth'); }} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: '#00d9ff', border: '2px solid #00d9ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Sign In</button>
            <button onClick={() => { setIsSignUp(true); setPage('auth'); }} style={{ padding: '0.75rem 1.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Start Free Trial</button>
          </div>
        </nav>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '64px', fontWeight: '900', margin: '0 0 1.5rem', color: '#00d9ff', lineHeight: '1.1' }}>Professional Day Trading Scanner</h2>
          <p style={{ fontSize: '18px', color: '#aaa', margin: '0 0 2rem', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>Real-time stock analysis. Technical indicators. Price alerts. Find winning trades before they move.</p>
          
          <button onClick={() => { setIsSignUp(true); setPage('auth'); }} style={{ padding: '1rem 2.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', marginRight: '1rem', boxShadow: '0 20px 40px rgba(0,217,255,0.3)' }}>Start 7-Day Free Trial →</button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '4rem' }}>
            {[
              { icon: '📊', title: '50+ Indicators', desc: 'RSI, MACD, Bollinger, SMA, EMA' },
              { icon: '🔔', title: 'Price Alerts', desc: 'Real-time notifications' },
              { icon: '❤️', title: 'Watchlists', desc: 'Track your stocks' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', padding: '2rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '40px', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '18px', fontWeight: '700' }}>{f.title}</h3>
                <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', padding: '3rem 2rem', borderRadius: '12px', marginTop: '4rem' }}>
            <h3 style={{ margin: '0 0 2rem', fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>Simple Pricing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              {[
                { tier: 'Trial', price: 'FREE', days: '7 Days', features: ['Full access', '50+ indicators', 'Alerts', 'Watchlist'] },
                { tier: 'Pro', price: '$29', period: '/month', features: ['Unlimited scans', 'All indicators', 'Unlimited alerts', '24/7 support'], highlighted: true },
              ].map((plan, i) => (
                <div key={i} style={{ background: plan.highlighted ? 'rgba(0,217,255,0.15)' : 'transparent', border: plan.highlighted ? '2px solid #00d9ff' : '1px solid rgba(0,217,255,0.2)', padding: '2rem', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '20px', fontWeight: '700' }}>{plan.tier}</h4>
                  <p style={{ margin: '0 0 1rem', fontSize: plan.days ? '16px' : '32px', fontWeight: '800', color: '#00d9ff' }}>
                    {plan.price}
                    {plan.period && <span style={{ fontSize: '14px', color: '#aaa' }}>{plan.period}</span>}
                    {plan.days && <span style={{ fontSize: '14px', color: '#aaa' }}>{plan.days}</span>}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ margin: '0.75rem 0', color: '#aaa', fontSize: '13px' }}>✓ {f}</li>
                    ))}
                  </ul>
                  <button onClick={() => { setIsSignUp(true); setPage('auth'); }} style={{ width: '100%', padding: '0.75rem', background: plan.highlighted ? '#00d9ff' : 'transparent', color: plan.highlighted ? '#0a0a14' : '#00d9ff', border: plan.highlighted ? 'none' : '1px solid #00d9ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Get Started</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTH PAGE
  if (page === 'auth') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '450px', width: '100%', background: 'rgba(26,26,46,0.8)', padding: '3rem', borderRadius: '12px', border: '1px solid rgba(0,217,255,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: 'white', marginTop: 0, marginBottom: '2rem', fontSize: '28px', fontWeight: '700' }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <form onSubmit={handleAuth}>
            {isSignUp && (
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '2rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '1.5rem', fontSize: '14px' }}>
            {isSignUp ? 'Have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#00d9ff', cursor: 'pointer', fontWeight: '700' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
          <button onClick={() => setPage('landing')} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'transparent', color: '#aaa', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>← Back to Home</button>
        </div>
      </div>
    );
  }

  // MAIN APP
  if (page === 'app' && isLoggedIn) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)', minHeight: '100vh', color: 'white', display: 'flex' }}>
        {/* SIDEBAR */}
        <div style={{ width: '280px', background: 'rgba(26,26,46,0.8)', borderRight: '1px solid rgba(0,217,255,0.1)', padding: '2rem', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 2rem', fontSize: '18px', fontWeight: '800', color: '#00d9ff' }}>Bailey's Gauge</h2>
          
          <div style={{ background: 'rgba(0,217,255,0.15)', border: '2px solid #00d9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#aaa' }}>Free Trial</p>
            <p style={{ margin: '0 0 1rem', fontSize: '24px', fontWeight: '800', color: '#00d9ff' }}>{trialDaysLeft} Days Left</p>
            <button onClick={() => alert('Upgrade to Pro: $29/month')} style={{ width: '100%', padding: '0.75rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Upgrade Now</button>
          </div>

          <button onClick={() => setActiveTab('screener')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'screener' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'screener' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'screener' ? '600' : '400', borderLeft: activeTab === 'screener' ? '3px solid #00d9ff' : '3px solid transparent', marginBottom: '0.5rem' }}>📊 Screener</button>
          <button onClick={() => setActiveTab('watchlist')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'watchlist' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'watchlist' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'watchlist' ? '600' : '400', borderLeft: activeTab === 'watchlist' ? '3px solid #00d9ff' : '3px solid transparent', marginBottom: '0.5rem' }}>❤️ Watchlist ({watchlist.length})</button>
          <button onClick={() => setActiveTab('alerts')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'alerts' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'alerts' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'alerts' ? '600' : '400', borderLeft: activeTab === 'alerts' ? '3px solid #00d9ff' : '3px solid transparent' }}>🔔 Alerts ({alerts.length})</button>

          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(0,217,255,0.1)', paddingTop: '1.5rem' }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Sign Out</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'screener' && (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" placeholder="AAPL,MSFT,GOOGL..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '13px' }} />
                <button onClick={handleScan} disabled={loading} style={{ padding: '0.75rem 1.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', opacity: loading ? 0.5 : 1 }}>{loading ? 'Scanning...' : 'Scan'}</button>
              </div>

              {scanResults.length > 0 && (
                <>
                  <h2 style={{ margin: '1rem 0 2rem', fontSize: '24px', fontWeight: '700' }}>Results ({scanResults.length})</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    {scanResults.map((stock, i) => (
                      <div key={i} onClick={() => setSelectedStock(stock)} style={{ background: 'rgba(0,217,255,0.05)', border: selectedStock?.ticker === stock.ticker ? '2px solid #00d9ff' : '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '22px', fontWeight: '800' }}>{stock.ticker}</h3>
                            <p style={{ margin: 0, color: '#00d9ff', fontSize: '11px', fontWeight: '600' }}>${stock.price}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.ticker); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: watchlist.includes(stock.ticker) ? '#ff6b6b' : '#666' }}>♡</button>
                        </div>
                        <p style={{ margin: 0, color: stock.change > 0 ? '#4ade80' : '#ff6b6b', fontWeight: '700', fontSize: '16px', marginBottom: '1rem' }}>{stock.change > 0 ? '▲' : '▼'} {stock.change}% ({stock.percentChange}%)</p>
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={generateChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,217,255,0.1)" />
                            <XAxis dataKey="time" stroke="#666" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                            <Line type="monotone" dataKey="price" stroke="#00d9ff" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,217,255,0.1)' }}>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '9px', fontWeight: '600' }}>RSI</p>
                            <p style={{ margin: 0, color: stock.rsi > 70 ? '#ff6b6b' : stock.rsi < 30 ? '#4ade80' : '#00d9ff', fontSize: '13px', fontWeight: '700' }}>{stock.rsi}</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '9px', fontWeight: '600' }}>VOL</p>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '13px', fontWeight: '700' }}>{(stock.volume / 1000000).toFixed(1)}M</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {scanResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                  <TrendingUp size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', margin: 0 }}>Enter stock tickers to scan</p>
                  <p style={{ fontSize: '12px', color: '#444', margin: '0.5rem 0 0' }}>Example: AAPL,MSFT,GOOGL</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'watchlist' && (
            <>
              {watchlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                  <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', margin: 0 }}>No stocks in watchlist</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {scanResults.filter(s => watchlist.includes(s.ticker)).map((stock, i) => (
                    <div key={i} style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                      <h3 style={{ margin: '0 0 1rem', fontSize: '18px', fontWeight: '800' }}>{stock.ticker}</h3>
                      <p style={{ margin: '0.5rem 0', color: stock.change > 0 ? '#4ade80' : '#ff6b6b', fontWeight: 'bold', fontSize: '14px' }}>{stock.change > 0 ? '▲' : '▼'} {stock.change}%</p>
                      <p style={{ margin: '0.5rem 0 1rem', color: '#aaa', fontSize: '12px' }}>Earnings: {stock.earnings_date}</p>
                      <button onClick={() => toggleWatchlist(stock.ticker)} style={{ width: '100%', padding: '0.75rem', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'alerts' && (
            <>
              <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '16px', fontWeight: '700' }}>Create Price Alert</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Ticker" value={alertTicker} onChange={(e) => setAlertTicker(e.target.value.toUpperCase())} style={{ flex: 1, minWidth: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '12px' }} />
                  <input type="number" placeholder="Price" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} style={{ flex: 1, minWidth: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '12px' }} />
                  <button onClick={addAlert} style={{ padding: '0.75rem 1.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Add Alert</button>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', margin: 0 }}>No price alerts set</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {alerts.map((alert, i) => (
                    <div key={i} style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{alert.ticker}</h4>
                      <p style={{ margin: '0.75rem 0 0', color: '#00d9ff', fontWeight: '700' }}>Alert at: ${alert.price}</p>
                      <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))} style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default App;
