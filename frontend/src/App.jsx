import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, AlertCircle, LogOut, Play } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState('trial');
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [chartData, setChartData] = useState([]);
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null);
  const canvasRef = useRef(null);
  const [startPoint, setStartPoint] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('day-trading');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [adminStats, setAdminStats] = useState({ users: 1250, revenue: '$45,320', subs: 380 });

  React.useEffect(() => {
    const handleResize = () => setMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = [
    { id: 'day-trading', name: 'Day Trading', desc: 'Gap ups, volume spikes, intraday momentum' },
    { id: 'swing-trading', name: 'Swing Trading', desc: 'Bull flags, VCP, cup & handles' },
    { id: 'momentum', name: 'Momentum', desc: 'Minervini trends, breakouts, RS highs' },
    { id: 'earnings', name: 'Earnings Play', desc: 'Pre/post earnings movers' },
    { id: 'value', name: 'Value & Growth', desc: 'Buffett, Lynch methodologies' },
    { id: 'intelligence', name: 'Intelligence', desc: 'Sector rotation, insider buying' },
  ];

  const generateStockData = (ticker) => ({
    ticker: ticker.toUpperCase(),
    company: `${ticker} Corp`,
    price: (Math.random() * 200 + 20).toFixed(2),
    change: ((Math.random() - 0.5) * 30).toFixed(2),
    percentChange: ((Math.random() - 0.5) * 15).toFixed(2),
    volume: (Math.random() * 100000000).toFixed(0),
    rsi: (Math.random() * 100).toFixed(1),
    macd: (Math.random() - 0.5).toFixed(3),
    signal: (Math.random() * 100).toFixed(0),
    sma20: (Math.random() * 150 + 50).toFixed(2),
    sma50: (Math.random() * 150 + 50).toFixed(2),
    sma200: (Math.random() * 150 + 50).toFixed(2),
    bollingerUpper: (Math.random() * 200 + 120).toFixed(2),
    bollingerLower: (Math.random() * 100 + 50).toFixed(2),
    pe_ratio: (Math.random() * 40 + 5).toFixed(2),
    earnings_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    dayHigh: (Math.random() * 200 + 100).toFixed(2),
    dayLow: (Math.random() * 100 + 50).toFixed(2),
    fiftyTwoWeekHigh: (Math.random() * 300 + 150).toFixed(2),
    fiftyTwoWeekLow: (Math.random() * 100 + 30).toFixed(2),
    marketCap: `$${(Math.random() * 1000 + 50).toFixed(0)}B`,
    dividend: (Math.random() * 5).toFixed(2),
    earningsGap: Math.random() > 0.7,
    breakout: Math.random() > 0.5,
    oversold: (Math.random() * 100).toFixed(1) < 30,
    volumeSpike: Math.random() > 0.6,
  });

  const generateChartData = () => {
    return Array.from({ length: 100 }, (_, i) => ({
      time: `${Math.floor(i / 4)}:${(i % 4) * 15}`,
      price: Math.random() * 50 + 100,
      volume: Math.random() * 1000000,
      sma20: Math.random() * 50 + 90,
      sma50: Math.random() * 50 + 95,
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
        body: JSON.stringify(isSignUp ? { email, password, name } : { email, password }) 
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('accountCreatedDate', new Date().toISOString());
        setIsLoggedIn(true);
        setPage('app');
        setSubscriptionTier('trial');
        setTrialDaysLeft(7);
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
    if (e) e.preventDefault();
    if (!scanInput.trim()) {
      alert('Enter stock tickers');
      return;
    }
    if (subscriptionTier === 'trial' && trialDaysLeft <= 0) {
      alert('Free trial expired. Upgrade to Pro to continue scanning.');
      return;
    }
    setLoading(true);
    const tickers = scanInput.split(',').map(t => t.trim());
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/scan', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, 
        body: JSON.stringify({ tickers }) 
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

  const handleChartMouseDown = (e) => {
    if (!drawMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleChartMouseMove = (e) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
    ctx.strokeStyle = drawMode === 'trendline' ? '#00d9ff' : '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  };

  const handleChartMouseUp = (e) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const newLine = { x1: startPoint.x, y1: startPoint.y, x2: endX, y2: endY, color: drawMode === 'trendline' ? '#00d9ff' : '#ff6b6b', type: drawMode };
    setLines([...lines, newLine]);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearDrawing = () => {
    setLines([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleUpgrade = (tier) => {
    alert(`Redirecting to payment for ${tier}... (Stripe integration)\n\nThis would charge:\n${tier === 'pro' ? '$29/month' : '$99/month'}`);
    setSubscriptionTier(tier);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accountCreatedDate');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setPage('landing');
    setScanResults([]);
    setSelectedStock(null);
    setWatchlist([]);
    setScanInput('');
  };

  // LANDING PAGE
  if (page === 'landing') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)', minHeight: '100vh', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <nav style={{ background: 'rgba(10,10,20,0.9)', borderBottom: '1px solid rgba(0,217,255,0.1)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: mobileView ? '18px' : '26px', fontWeight: '800', color: '#00d9ff' }}>Bailey's Gauge</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setIsSignUp(false); setPage('auth'); }} style={{ padding: '0.75rem 1rem', background: 'transparent', color: '#00d9ff', border: '2px solid #00d9ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: mobileView ? '12px' : '14px' }}>Sign In</button>
            <button onClick={() => { setIsSignUp(true); setPage('auth'); }} style={{ padding: '0.75rem 1rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: mobileView ? '12px' : '14px' }}>Start Free Trial</button>
          </div>
        </nav>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: mobileView ? '2rem 1rem' : '5rem 2rem' }}>
          <h2 style={{ fontSize: mobileView ? '36px' : '64px', fontWeight: '900', margin: '0 0 1rem', color: '#00d9ff', lineHeight: '1.1' }}>Professional Day Trading<br/>Command Center</h2>
          <p style={{ fontSize: mobileView ? '14px' : '18px', color: '#aaa', margin: '0 0 2rem', maxWidth: '700px' }}>Advanced technical analysis. Real-time alerts. Draw support/resistance. Find winning trades before they move. Professional-grade tools trusted by 1000+ day traders.</p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button onClick={() => { setIsSignUp(true); setPage('auth'); }} style={{ padding: '1rem 2.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', boxShadow: '0 20px 40px rgba(0,217,255,0.3)' }}>Start 7-Day Free Trial →</button>
            <button onClick={() => setShowDemoModal(true)} style={{ padding: '1rem 2.5rem', background: 'transparent', color: '#00d9ff', border: '2px solid #00d9ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={18}/> Watch Demo</button>
          </div>

          {showDemoModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'rgba(26,26,46,0.95)', padding: '2rem', borderRadius: '12px', maxWidth: '90vw', width: '800px', border: '1px solid rgba(0,217,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#00d9ff' }}>Bailey's Gauge Demo Video</h3>
                  <button onClick={() => setShowDemoModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '24px' }}>✕</button>
                </div>
                <div style={{ background: 'rgba(0,217,255,0.05)', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
                  <div style={{ aspectRatio: '16/9', background: 'rgba(10,10,20,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,217,255,0.2)', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🎬</div>
                      <p style={{ color: '#aaa', margin: '0 0 1rem' }}>HD Demo Video - 8 Minutes</p>
                      <button onClick={() => alert('Demo video would play here in production')} style={{ padding: '0.75rem 2rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>▶ Play Demo</button>
                    </div>
                  </div>
                  <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>See how to scan stocks, draw support/resistance, set alerts, and track your wins.</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: mobileView ? '1fr' : 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
            {[
              { icon: '📊', title: '50+ Indicators', desc: 'RSI, MACD, Bollinger, SMA, EMA, Stochastic, ADX, ATR' },
              { icon: '✏️', title: 'Draw Tools', desc: 'Trendlines, support/resistance, annotations' },
              { icon: '🔔', title: 'Price Alerts', desc: 'Real-time notifications for your trades' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '1rem' }}>{f.icon}</div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '18px', fontWeight: '700' }}>{f.title}</h4>
                <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', padding: mobileView ? '2rem 1rem' : '3rem 2rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 2rem', fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>Simple Pricing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: mobileView ? '1fr' : 'repeat(2, 1fr)', gap: '2rem' }}>
              {[
                { tier: 'Trial', price: 'FREE', days: '7 Days', features: ['Full access to all scanners', '50+ technical indicators', 'Draw support/resistance', 'Price alerts (10)', 'Watchlist (50 stocks)', 'No credit card required'] },
                { tier: 'Pro', price: '$29', period: '/month', features: ['Unlimited scans', 'All 50+ indicators', 'Unlimited alerts', 'Draw tools', 'Unlimited watchlists', '1-on-1 support'], highlighted: true },
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
          <h2 style={{ textAlign: 'center', color: 'white', marginTop: 0, marginBottom: '1rem', fontSize: '28px', fontWeight: '700' }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p style={{ textAlign: 'center', color: '#aaa', margin: '0 0 2rem', fontSize: '13px' }}>{isSignUp ? 'Start your 7-day free trial' : 'Welcome back'}</p>
          
          <form onSubmit={handleAuth}>
            {isSignUp && (
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.875rem', marginBottom: '2rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} required />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Loading...' : (isSignUp ? 'Create Account & Start Trial' : 'Sign In')}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '1.5rem', fontSize: '13px' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#00d9ff', cursor: 'pointer', fontWeight: '700' }}>{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
          <button onClick={() => setPage('landing')} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'transparent', color: '#aaa', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>← Back to Home</button>
        </div>
      </div>
    );
  }

  // MAIN APP
  if (page === 'app' && isLoggedIn) {
    const daysLeft = trialDaysLeft > 0 ? trialDaysLeft : 0;
    const showUpgradeBanner = subscriptionTier === 'trial';

    return (
      <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)', minHeight: '100vh', color: 'white', display: 'flex' }}>
        {/* SIDEBAR */}
        {sidebarOpen && (
          <div style={{ width: mobileView ? '100%' : '280px', background: 'rgba(26,26,46,0.8)', borderRight: '1px solid rgba(0,217,255,0.1)', padding: '1.5rem', overflowY: 'auto', maxHeight: '100vh', position: mobileView ? 'fixed' : 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#00d9ff' }}>Bailey's Gauge</h2>
              {mobileView && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#00d9ff', cursor: 'pointer', fontSize: '20px' }}>✕</button>}
            </div>

            {showUpgradeBanner && (
              <div style={{ background: 'rgba(0,217,255,0.15)', border: '2px solid #00d9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#aaa' }}>Free Trial</p>
                <p style={{ margin: '0 0 1rem', fontSize: '24px', fontWeight: '800', color: '#00d9ff' }}>{daysLeft} Days Left</p>
                <button onClick={() => handleUpgrade('pro')} style={{ width: '100%', padding: '0.75rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Upgrade Now</button>
              </div>
            )}

            <p style={{ margin: '0 0 1rem', fontSize: '11px', color: '#00d9ff', fontWeight: '700', textTransform: 'uppercase' }}>Scanners</p>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: selectedCategory === cat.id ? 'rgba(0,217,255,0.15)' : 'transparent',
                  color: selectedCategory === cat.id ? '#00d9ff' : '#aaa',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedCategory === cat.id ? '600' : '400',
                  borderLeft: selectedCategory === cat.id ? '3px solid #00d9ff' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '0.5rem'
                }}
              >
                {cat.name}
              </button>
            ))}

            <div style={{ borderTop: '1px solid rgba(0,217,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '11px', color: '#00d9ff', fontWeight: '700', textTransform: 'uppercase' }}>Navigation</p>
              <button onClick={() => setActiveTab('screener')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'screener' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'screener' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'screener' ? '600' : '400', borderLeft: activeTab === 'screener' ? '3px solid #00d9ff' : '3px solid transparent', marginBottom: '0.5rem' }}>📊 Screener</button>
              <button onClick={() => setActiveTab('watchlist')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'watchlist' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'watchlist' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'watchlist' ? '600' : '400', borderLeft: activeTab === 'watchlist' ? '3px solid #00d9ff' : '3px solid transparent', marginBottom: '0.5rem' }}>❤️ Watchlist ({watchlist.length})</button>
              <button onClick={() => setActiveTab('alerts')} style={{ width: '100%', padding: '0.75rem', background: activeTab === 'alerts' ? 'rgba(0,217,255,0.15)' : 'transparent', color: activeTab === 'alerts' ? '#00d9ff' : '#aaa', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'alerts' ? '600' : '400', borderLeft: activeTab === 'alerts' ? '3px solid #00d9ff' : '3px solid transparent' }}>🔔 Alerts ({alerts.length})</button>
            </div>

            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
              {subscriptionTier === 'trial' && (
                <button onClick={() => handleUpgrade('pro')} style={{ width: '100%', padding: '0.75rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', marginBottom: '0.75rem' }}>Upgrade to Pro</button>
              )}
              <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><LogOut size={14}/> Sign Out</button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: mobileView ? '1rem' : '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
          {/* TOP BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#00d9ff', cursor: 'pointer', fontSize: '24px' }}>☰</button>}
            {activeTab === 'screener' && (
              <form onSubmit={handleScan} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: mobileView ? '100%' : '300px' }}>
                <input type="text" placeholder="AAPL,MSFT,GOOGL..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(10,10,20,0.5)', color: 'white', fontSize: '13px' }} />
                <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', background: '#00d9ff', color: '#0a0a14', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', opacity: loading ? 0.5 : 1 }}>{loading ? 'Scanning...' : 'Scan'}</button>
              </form>
            )}
          </div>

          {/* SCREENER */}
          {activeTab === 'screener' && (
            <>
              {scanResults.length > 0 && (
                <>
                  <h2 style={{ margin: '1rem 0 2rem', fontSize: mobileView ? '18px' : '24px', fontWeight: '700' }}>Results ({scanResults.length})</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: mobileView ? '1fr' : 'repeat(auto-fit, minmax(550px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    {scanResults.map((stock, i) => (
                      <div key={i} onClick={() => { setSelectedStock(stock); setChartData(generateChartData()); setLines([]); }} style={{ background: 'rgba(0,217,255,0.05)', border: selectedStock?.ticker === stock.ticker ? '2px solid #00d9ff' : '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: mobileView ? '1rem' : '1.5rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: mobileView ? '18px' : '22px', fontWeight: '800' }}>{stock.ticker}</h3>
                            <p style={{ margin: 0, color: '#00d9ff', fontSize: '11px', fontWeight: '600' }}>${stock.price}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.ticker); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: watchlist.includes(stock.ticker) ? '#ff6b6b' : '#666' }}>♡</button>
                        </div>
                        <p style={{ margin: 0, color: stock.change > 0 ? '#4ade80' : '#ff6b6b', fontWeight: '700', fontSize: '16px', marginBottom: '1rem' }}>
                          {stock.change > 0 ? '▲' : '▼'} {stock.change}% ({stock.percentChange}%)
                        </p>
                        <ResponsiveContainer width="100%" height={mobileView ? 100 : 150}>
                          <LineChart data={generateChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,217,255,0.1)" />
                            <XAxis dataKey="time" stroke="#666" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                            <Line type="monotone" dataKey="price" stroke="#00d9ff" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,217,255,0.1)' }}>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '9px', fontWeight: '600' }}>RSI</p>
                            <p style={{ margin: 0, color: stock.rsi > 70 ? '#ff6b6b' : stock.rsi < 30 ? '#4ade80' : '#00d9ff', fontSize: '13px', fontWeight: '700' }}>{stock.rsi}</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '9px', fontWeight: '600' }}>MACD</p>
                            <p style={{ margin: 0, color: '#00d9ff', fontSize: '13px', fontWeight: '700' }}>{stock.macd}</p>
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

              {/* DETAILED CHART */}
              {selectedStock && (
                <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: mobileView ? '1rem' : '2rem', marginBottom: '2rem' }}>
                  <div style={{ display: mobileView ? 'block' : 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', gap: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: mobileView ? '18px' : '28px', fontWeight: '700' }}>{selectedStock.ticker}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setDrawMode(drawMode === 'trendline' ? null : 'trendline')} style={{ padding: '0.5rem 0.75rem', background: drawMode === 'trendline' ? '#00d9ff' : 'rgba(0,217,255,0.2)', color: drawMode === 'trendline' ? '#0a0a14' : '#00d9ff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>📈 Trend</button>
                      <button onClick={() => setDrawMode(drawMode === 'support' ? null : 'support')} style={{ padding: '0.5rem 0.75rem', background: drawMode === 'support' ? '#ff6b6b' : 'rgba(255,107,107,0.2)', color: drawMode === 'support' ? 'white' : '#ff6b6b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>📊 Support</button>
                      <button onClick={clearDrawing} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,107,107,0.2)', color: '#ff6b6b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>🗑️ Clear</button>
                    </div>
                  </div>

                  <div style={{ position: 'relative', background: 'rgba(10,10,20,0.5)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid rgba(0,217,255,0.1)', height: mobileView ? '300px' : '500px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,217,255,0.1)" />
                        <XAxis dataKey="time" stroke="#666" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#666" style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '8px', color: 'white' }} />
                        <Line type="monotone" dataKey="price" stroke="#00d9ff" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="sma20" stroke="#ff6b6b" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="sma50" stroke="#4ade80" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={handleChartMouseUp}
                      style={{ position: 'absolute', top: 0, left: 0, cursor: drawMode ? 'crosshair' : 'default' }}
                      width={800}
                      height={500}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: mobileView ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'RSI', value: selectedStock.rsi, color: '#00d9ff' },
                      { label: 'MACD', value: selectedStock.macd, color: '#ff6b6b' },
                      { label: 'SMA20', value: selectedStock.sma20, color: '#4ade80' },
                      { label: 'Earnings', value: selectedStock.earnings_date, color: '#ffc107' },
                      { label: 'High', value: `$${selectedStock.dayHigh}`, color: '#00d9ff' },
                      { label: 'Low', value: `$${selectedStock.dayLow}`, color: '#ff6b6b' },
                      { label: 'P/E', value: selectedStock.pe_ratio, color: '#4ade80' },
                      { label: 'Vol', value: `${(selectedStock.volume / 1000000).toFixed(1)}M`, color: '#ffc107' },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'rgba(10,10,20,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,217,255,0.1)' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '10px', fontWeight: '600' }}>{m.label}</p>
                        <p style={{ margin: 0, color: m.color, fontSize: '14px', fontWeight: '700' }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                  <TrendingUp size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: mobileView ? '14px' : '16px', margin: 0 }}>Enter stock tickers to scan for {categories.find(c => c.id === selectedCategory)?.name}</p>
                  <p style={{ fontSize: '12px', color: '#444', margin: '0.5rem 0 0' }}>Example: AAPL,MSFT,GOOGL,TSLA</p>
                </div>
              )}
            </>
          )}

          {/* WATCHLIST */}
          {activeTab === 'watchlist' && (
            <>
              {watchlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
                  <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', margin: 0 }}>No stocks in watchlist</p>
                  <p style={{ fontSize: '12px', color: '#444', margin: '0.5rem 0 0' }}>Add stocks by clicking the ♡ icon</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: mobileView ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {scanResults.filter(s => watchlist.includes(s.ticker)).map((stock, i) => (
                    <div key={i} style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{stock.ticker}</h3>
                        <button onClick={() => toggleWatchlist(stock.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ff6b6b' }}>♡</button>
                      </div>
                      <p style={{ margin: '0.5rem 0', color: stock.change > 0 ? '#4ade80' : '#ff6b6b', fontWeight: 'bold', fontSize: '14px' }}>{stock.change > 0 ? '▲' : '▼'} {stock.change}%</p>
                      <p style={{ margin: '0.5rem 0', color: '#aaa', fontSize: '12px' }}>Price: ${stock.price}</p>
                      <p style={{ margin: '0.5rem 0 1rem', color: '#aaa', fontSize: '12px' }}>Earnings: {stock.earnings_date}</p>
                      <button onClick={() => { setAlertTicker(stock.ticker); setActiveTab('alerts'); }} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,217,255,0.2)', color: '#00d9ff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Set Alert</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ALERTS */}
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
                <div style={{ display: 'grid', gridTemplateColumns: mobileView ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
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
