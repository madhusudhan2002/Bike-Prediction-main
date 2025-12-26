import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaBicycle, FaChartLine, FaCloudSun, FaUser, FaCalendarAlt, FaWind, FaTint, FaThermometerHalf, FaPlus, FaSignOutAlt, FaMapMarkerAlt, FaSync } from 'react-icons/fa';

// --- STYLES (Dark Theme) ---
const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'Segoe UI, sans-serif' },
  authContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' },
  authCard: { width: '400px', padding: '40px', backgroundColor: '#1e293b', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center' },
  sidebar: { width: '250px', backgroundColor: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' },
  menuItem: (isActive) => ({
    padding: '12px 15px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: isActive ? '#0ea5e9' : 'transparent', color: isActive ? 'white' : '#94a3b8', fontWeight: isActive ? 'bold' : 'normal', transition: '0.2s'
  }),
  main: { flex: 1, padding: '30px', overflowY: 'auto' },
  card: { backgroundColor: '#1e293b', borderRadius: '15px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  input: { width: '100%', padding: '12px', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '8px', color: 'white', marginTop: '5px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },
  title: { fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }
};

// --- MOCK DATA FOR CHART ---
const chartData = [
  { date: 'Mon', demand: 120 }, { date: 'Tue', demand: 160 }, { date: 'Wed', demand: 100 },
  { date: 'Thu', demand: 140 }, { date: 'Fri', demand: 190 }, { date: 'Sat', demand: 230 }, { date: 'Sun', demand: 210 },
];

function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [view, setView] = useState('login'); 

  // Forms State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // REAL-TIME WEATHER STATE
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("Locating...");
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Prediction Inputs
  const [formData, setFormData] = useState({
    temperature: '28', humidity: '52', windspeed: '17',
    season: '1', holiday: '0', workingday: '1', weather: '1'
  });

  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '' });

  // --- API ACTIONS ---
  const handleAuth = async (e, type) => {
    e.preventDefault();
    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      
      if (type === 'login') {
        setToken(data.access_token);
        fetchEvents(data.access_token);
      } else {
        alert("Registered! Please login.");
        setView('login');
      }
    } catch (err) { alert("Error: " + err.message); }
  };

  const fetchEvents = async (authToken) => {
    const res = await fetch('http://127.0.0.1:8000/events', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    setEvents(data);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    await fetch('http://127.0.0.1:8000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newEvent)
    });
    setNewEvent({ name: '', date: '', location: '' }); 
    fetchEvents(token); 
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    const res = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setPrediction(data.predicted_demand);
  };

  const loadProfile = async () => {
    const res = await fetch('http://127.0.0.1:8000/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProfile(data);
  };

  // --- REAL-TIME LOCATION & WEATHER LOGIC ---
  const fetchWeather = () => {
    setLoadingWeather(true);
    setLocationName("Locating you...");

    if (!navigator.geolocation) {
      setLocationName("GPS not supported");
      setLoadingWeather(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setLocationName(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`);

      try {
        // 1. Get Weather from Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        setWeather(weatherData.current_weather);

        // 2. Auto-Update Prediction Form
        setFormData(prev => ({
          ...prev,
          temperature: weatherData.current_weather.temperature,
          windspeed: weatherData.current_weather.windspeed,
          weather: mapWeatherCode(weatherData.current_weather.weathercode)
        }));

      } catch (error) {
        console.error("API Error", error);
        setLocationName("Weather unavailable");
      }
      setLoadingWeather(false);
    }, (error) => {
      console.error("GPS Error", error);
      setLocationName("Location Denied");
      setLoadingWeather(false);
    });
  };

  // Helper to convert Open-Meteo codes to our 1-4 scale
  const mapWeatherCode = (code) => {
    if (code <= 3) return '1'; // Clear/Cloudy
    if (code <= 48) return '2'; // Fog/Mist
    if (code <= 77) return '3'; // Rain/Snow
    return '4'; // Heavy Weather
  };

  const getWeatherDescription = (code) => {
    if (code <= 1) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 65) return "Rainy";
    if (code <= 82) return "Heavy Rain";
    return "Snow/Storm";
  };

  // Effects
  useEffect(() => {
    if (activeTab === 'profile' && token) loadProfile();
    if (activeTab === 'dashboard' && token) fetchWeather(); 
  }, [activeTab, token]);


  // --- LOGIN SCREEN ---
  if (!token) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={{...styles.logo, justifyContent: 'center', marginBottom: '20px'}}><FaBicycle /> BikeShare</div>
          <h2 style={{color: 'white', marginBottom: '20px'}}>{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={(e) => handleAuth(e, view)}>
            <input placeholder="Username" style={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" style={styles.button}>{view === 'login' ? 'Login' : 'Register'}</button>
          </form>
          <p style={{color: '#94a3b8', marginTop: '20px', cursor: 'pointer'}} onClick={() => setView(view === 'login' ? 'register' : 'login')}>
            {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}><FaBicycle /> BikeShare</div>
        <div style={styles.menuItem(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}><FaChartLine /> Dashboard</div>
        <div style={styles.menuItem(activeTab === 'predict')} onClick={() => setActiveTab('predict')}><FaWind /> Predict</div>
        <div style={styles.menuItem(activeTab === 'events')} onClick={() => setActiveTab('events')}><FaCalendarAlt /> Events</div>
        <div style={styles.menuItem(activeTab === 'profile')} onClick={() => setActiveTab('profile')}><FaUser /> Profile</div>
        <div style={{ marginTop: 'auto', ...styles.menuItem(false), color: '#ef4444' }} onClick={() => setToken(null)}><FaSignOutAlt /> Logout</div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h1 style={{margin:0, fontSize:'24px'}}>Dashboard Overview</h1>
              <button onClick={fetchWeather} style={{padding:'8px 15px', backgroundColor:'#334155', border:'none', borderRadius:'5px', color:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                <FaSync className={loadingWeather ? 'fa-spin' : ''} /> Refresh Location
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
              {/* REAL WEATHER CARDS */}
              <StatCard 
                icon={<FaThermometerHalf color="#f87171"/>} 
                value={weather ? `${weather.temperature}°C` : "--"} 
                label="Current Temp" 
              />
              <StatCard 
                icon={<FaWind color="#a3e635"/>} 
                value={weather ? `${weather.windspeed} km/h` : "--"} 
                label="Wind Speed" 
              />
              <StatCard 
                icon={<FaCloudSun color="#fbbf24"/>} 
                value={weather ? getWeatherDescription(weather.weathercode) : "--"} 
                label="Condition" 
              />
              <StatCard 
                icon={<FaMapMarkerAlt color="#60a5fa"/>} 
                value={weather ? "Found" : "Unknown"} 
                label={locationName} // Shows Coordinates or "Locating..."
              />
            </div>

            <div style={styles.card}>
              <h3>Weekly Demand Trend</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                    <Area type="monotone" dataKey="demand" stroke="#38bdf8" fillOpacity={1} fill="url(#colorDemand)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* PREDICT TAB */}
        {activeTab === 'predict' && (
          <>
            <h1 style={styles.title}>AI Prediction Engine</h1>
            <div style={styles.card}>
              <p style={{color:'#94a3b8', marginBottom:'20px'}}>
                {weather ? `✨ Auto-filled data from your location (${locationName})` : "Enter values manually below."}
              </p>
              <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <label>Temperature <input type="number" style={styles.input} value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} /></label>
                <label>Humidity <input type="number" style={styles.input} value={formData.humidity} onChange={e => setFormData({...formData, humidity: e.target.value})} /></label>
                <label>Windspeed <input type="number" style={styles.input} value={formData.windspeed} onChange={e => setFormData({...formData, windspeed: e.target.value})} /></label>
                <label>Season <select style={styles.input} value={formData.season} onChange={e => setFormData({...formData, season: e.target.value})}><option value="1">Spring</option><option value="2">Summer</option></select></label>
                <button type="submit" style={{ gridColumn: 'span 2', ...styles.button }}>Run Prediction</button>
              </form>
              {prediction && (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#064e3b', borderRadius: '10px', textAlign: 'center', border: '1px solid #34d399' }}>
                  <h2 style={{ color: '#34d399', margin: 0 }}>Predicted Demand: {Math.round(prediction)} Bikes</h2>
                </div>
              )}
            </div>
          </>
        )}

        {/* EVENTS TAB & PROFILE TAB remain the same... */}
        {activeTab === 'events' && (
          <>
            <h1 style={styles.title}>Community Events</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              <div>
                {events.map((evt, idx) => (
                  <div key={idx} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h3 style={{margin: '0 0 5px 0'}}>{evt.name}</h3>
                      <p style={{color: '#94a3b8', margin: 0}}>{evt.date} • {evt.location}</p>
                    </div>
                    <div style={{padding: '10px', backgroundColor: '#334155', borderRadius: '50%'}}><FaBicycle color="#38bdf8"/></div>
                  </div>
                ))}
              </div>
              <div style={styles.card}>
                <h3>Add Event</h3>
                <form onSubmit={handleAddEvent}>
                  <input placeholder="Event Name" style={styles.input} value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} required/>
                  <input type="date" style={styles.input} value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required/>
                  <input placeholder="Location" style={styles.input} value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} required/>
                  <button type="submit" style={styles.button}><FaPlus /> Create Event</button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && profile && (
          <>
            <h1 style={styles.title}>User Profile</h1>
            <div style={{...styles.card, textAlign: 'center', padding: '50px'}}>
              <div style={{width: '100px', height: '100px', backgroundColor: '#334155', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <FaUser size={40} color="#94a3b8"/>
              </div>
              <h2>{profile.username}</h2>
              <p style={{color: '#94a3b8'}}>{profile.role}</p>
              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px'}}>
                <div style={{padding: '10px 30px', backgroundColor: '#0f172a', borderRadius: '10px'}}>
                  <span style={{display: 'block', fontSize: '20px', fontWeight: 'bold'}}>Active</span>
                  <span style={{color: '#94a3b8', fontSize: '12px'}}>Status</span>
                </div>
                <div style={{padding: '10px 30px', backgroundColor: '#0f172a', borderRadius: '10px'}}>
                  <span style={{display: 'block', fontSize: '20px', fontWeight: 'bold'}}>{profile.member_since}</span>
                  <span style={{color: '#94a3b8', fontSize: '12px'}}>Member Since</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper Card
const StatCard = ({ icon, value, label }) => (
  <div style={{ backgroundColor: '#1e293b', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
    <div style={{fontSize: '24px'}}>{icon}</div>
    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</span>
    <span style={{ color: '#94a3b8', fontSize: '14px', textAlign:'center' }}>{label}</span>
  </div>
);

export default App;