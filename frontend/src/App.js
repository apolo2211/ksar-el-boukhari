import { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  const login = async () => {
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        loadProfile();
      } else {
        setMsg(data.message);
      }
    } catch (err) {
      setMsg('Erreur serveur : impossible de se connecter');
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUser(data);

    if (data.role === 'admin') loadStats(token);
  };

  const loadStats = async (token) => {
    const res = await fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setStats(data);
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
        <br />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
        <br />
        <button onClick={login}>Connexion</button>
        <p>{msg}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard {user.role === 'admin' ? 'Admin' : 'Utilisateur'}</h1>
      <p>{user.email}</p>

      {user.role === 'admin' && stats && (
        <div>
          <h2>Statistiques</h2>
          <p>Utilisateurs : {stats.users}</p>
          <p>Admins : {stats.admins}</p>
        </div>
      )}

      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}

export default App;
