import { useEffect, useState } from 'react';

// ✅ Détection automatique de l'URL du backend
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
    setMsg('Connexion en cours...');
    try {
      // ✅ Correction de la route : /api/auth/login
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setMsg('');
        loadProfile();
      } else {
        setMsg(data.message || 'Identifiants incorrects');
      }
    } catch (err) {
      setMsg('Erreur : Impossible de joindre le serveur');
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
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

  useEffect(() => {
    loadProfile();
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Ksar El Boukhari SaaS</h1>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <br /><br />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
        <br /><br />
        <button onClick={login}>Connexion</button>
        <p style={{ color: 'red' }}>{msg}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard {user.role === 'admin' ? 'Admin' : 'Utilisateur'}</h1>
      <p>Bienvenue : <strong>{user.email}</strong></p>
      {user.role === 'admin' && stats && (
        <div style={{ background: '#f0f0f0', padding: 15, borderRadius: 8 }}>
          <h2>Statistiques</h2>
          <p>Utilisateurs : {stats.users}</p>
          <p>Admins : {stats.admins}</p>
        </div>
      )}
      <br />
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}

export default App;