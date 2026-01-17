import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) { localStorage.setItem('token', data.token); loadProfile(); }
    else { setMsg(data.message); }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      if (data.role === 'admin') loadStats(token);
    }
  };

  const loadStats = async (t) => {
    const res = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    setStats(data);
  };

  const buyPremium = async () => {
    const res = await fetch(`${API}/api/checkout`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  useEffect(() => { loadProfile(); }, []);

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ padding: 40, boxShadow: '0 0 10px #ccc', borderRadius: 10, textAlign: 'center' }}>
          <h2>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input placeholder="Email" style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none' }}>{isRegistering ? 'Créer un compte' : 'Connexion'}</button>
          </form>
          <p style={{ color: 'blue', cursor: 'pointer', marginTop: 10 }} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Déjà un compte ?' : 'Pas de compte ? S\'inscrire'}
          </p>
          {msg && <p style={{ color: 'red' }}>{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Bienvenue, {user.email}</h1>
      <p>Statut : <strong>{user.isPremium ? '💎 Premium' : '🆓 Gratuit'}</strong></p>
      {!user.isPremium && <button onClick={buyPremium} style={{ padding: 10, background: 'gold', border: 'none', cursor: 'pointer' }}>⚡ Devenir Premium (20€)</button>}
      {user.role === 'admin' && stats && <div style={{ background: '#eee', padding: 10, margin: '20px auto', width: 200 }}>Utilisateurs : {stats.users}</div>}
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 20 }}>Déconnexion</button>
    </div>
  );
}
export default App;