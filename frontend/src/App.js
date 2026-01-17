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
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) { localStorage.setItem('token', data.token); loadProfile(); }
      else { setMsg(data.message); }
    } catch (err) { setMsg('Erreur serveur'); }
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

  const buyPremium = async () => {
    const res = await fetch(`${API}/api/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url; // Redirige vers Stripe
  };

  const loadStats = async (t) => {
    const res = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => { loadProfile(); }, []);

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input placeholder="Email" style={styles.input} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" style={styles.input} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={styles.button}>{isRegistering ? "S'inscrire" : "Connexion"}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={styles.link}>
            {isRegistering ? "Déjà membre ?" : "Créer un compte"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Salut, {user.email} !</h1>
        <p>Statut : <strong>{user.isPremium ? '💎 Premium' : '🆓 Gratuit'}</strong></p>
        
        {!user.isPremium && (
          <button onClick={buyPremium} style={{...styles.button, background: '#FFD700', color: '#000'}}>
            ⚡ Passer au Premium (20€)
          </button>
        )}

        {user.role === 'admin' && stats && (
          <div style={styles.stats}>
            <p>Utilisateurs : {stats.users} | Admins : {stats.admins}</p>
          </div>
        )}
        <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.link}>Déconnexion</button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' },
  card: { background: '#fff', padding: 30, borderRadius: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: 300, textAlign: 'center' },
  input: { width: '100%', padding: 10, marginBottom: 10, borderRadius: 5, border: '1px solid #ddd' },
  button: { width: '100%', padding: 10, borderRadius: 5, border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  link: { color: '#007bff', cursor: 'pointer', marginTop: 10, fontSize: 14 },
  stats: { marginTop: 20, padding: 10, background: '#eee', borderRadius: 5 }
};

export default App;