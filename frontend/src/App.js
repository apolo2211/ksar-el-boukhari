import { useEffect, useState } from 'react';

// ✅ Détecte si on est en local ou sur Render
const API = window.location.origin.includes('localhost') 
  ? 'http://localhost:10000' 
  : window.location.origin;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  const login = async () => {
    setMsg('Connexion...');
    try {
      // ✅ Correction de la route vers /api/auth/login
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        loadProfile();
      } else {
        setMsg(data.message || 'Identifiants incorrects');
      }
    } catch (err) {
      setMsg('Erreur : Le serveur ne répond pas');
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        if (data.role === 'admin') loadStats(token);
      }
    } catch (err) { console.error(err); }
  };

  const loadStats = async (token) => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setStats(null);
  };

  useEffect(() => { loadProfile(); }, []);

  if (!user) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Ksar El Boukhari SaaS</h1>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} /><br /><br />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} /><br /><br />
        <button onClick={login}>Connexion</button>
        <p style={{ color: 'red' }}>{msg}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard {user.role === 'admin' ? 'Admin' : 'Utilisateur'}</h1>
      <p>Connecté en tant que : <strong>{user.email}</strong></p>
      {user.role === 'admin' && stats && (
        <div style={{ background: '#eee', padding: 10 }}>
          <p>Utilisateurs : {stats.users} | Admins : {stats.admins}</p>
        </div>
      )}
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}

export default App;