import { useEffect, useState } from 'react';

// ✅ Détection automatique de l'URL du backend (Local vs Render)
const API = window.location.origin.includes('localhost') 
  ? 'http://localhost:10000' 
  : window.location.origin;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  // ✅ Fonction unique pour Connexion OU Inscription
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    setMsg('Chargement...');
    
    try {
      const res = await fetch(`${API}${endpoint}`, {
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
        setMsg(data.message || 'Une erreur est survenue');
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

  useEffect(() => { loadProfile(); }, []);

  // 🏠 ÉCRAN D'ACCUEIL (CONNEXION / INSCRIPTION)
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Ksar El Boukhari</h1>
          <p style={styles.subtitle}>{isRegistering ? 'Créer un nouveau compte' : 'Bienvenue sur votre SaaS'}</p>
          
          <form onSubmit={handleAuth}>
            <input 
              type="email" placeholder="Email" required 
              style={styles.input} onChange={e => setEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="Mot de passe" required 
              style={styles.input} onChange={e => setPassword(e.target.value)} 
            />
            <button type="submit" style={styles.button}>
              {isRegistering ? "S'inscrire" : "Se connecter"}
            </button>
          </form>

          <p style={styles.toggleText} onClick={() => { setIsRegistering(!isRegistering); setMsg(''); }}>
            {isRegistering ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? Inscrivez-vous"}
          </p>
          {msg && <p style={styles.error}>{msg}</p>}
        </div>
      </div>
    );
  }

  // 📊 ÉCRAN DASHBOARD (APRÈS CONNEXION)
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Tableau de bord {user.role === 'admin' ? '👑' : '👤'}</h2>
        <p>Email : <strong>{user.email}</strong></p>
        <p>Rôle : <span style={styles.badge}>{user.role}</span></p>

        {user.role === 'admin' && stats && (
          <div style={styles.statsBox}>
            <h3>Statistiques Globales</h3>
            <p>👥 Utilisateurs : {stats.users}</p>
            <p>🛡️ Administrateurs : {stats.admins}</p>
          </div>
        )}

        <button onClick={logout} style={{...styles.button, background: '#ff4d4d'}}>Déconnexion</button>
      </div>
    </div>
  );
}

// 🎨 Styles simples pour rendre l'app opérationnelle et jolie
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa', fontFamily: 'Arial' },
  card: { background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' },
  title: { margin: '0 0 10px 0', color: '#333' },
  subtitle: { color: '#666', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  toggleText: { marginTop: '15px', color: '#4a90e2', cursor: 'pointer', fontSize: '14px' },
  error: { color: 'red', marginTop: '10px', fontSize: '13px' },
  badge: { background: '#e1f5fe', color: '#01579b', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '12px' },
  statsBox: { background: '#f9f9f9', padding: '15px', borderRadius: '8px', margin: '20px 0', textAlign: 'left' }
};

export default App;