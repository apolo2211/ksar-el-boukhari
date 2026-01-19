import { useEffect, useState } from 'react';

// On utilise une chaîne vide pour que l'API utilise le même domaine que le site
const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : '';

const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    document.body.appendChild(script);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUser(await res.json());
    }
    setLoading(false);
  };

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
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        setMsg(data.message);
      }
    } catch (err) {
      setMsg("Erreur de connexion au serveur.");
    }
  };

  useEffect(() => {
    if (user && !user.isPremium) {
      const interval = setInterval(() => {
        if (window.paypal) {
          clearInterval(interval);
          window.paypal.Buttons({
            createOrder: (data, actions) => actions.order.create({ purchase_units: [{ amount: { value: '20.00' } }] }),
            onApprove: async (data, actions) => {
              await actions.order.capture();
              await fetch(`${API}/api/auth/make-premium`, { 
                method: 'POST', 
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
              });
              window.location.reload();
            }
          }).render('#paypal-button-container');
        }
      }, 1000);
    }
  }, [user]);

  if (loading) return <div style={{textAlign:'center', padding:50}}>Chargement...</div>;

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}>
        <div style={{ padding: 30, border: '1px solid #ccc', borderRadius: 10, width: 300, textAlign: 'center' }}>
          <h2>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" required style={{ width: '100%', padding: 10, marginBottom: 10 }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" required style={{ width: '100%', padding: 10, marginBottom: 10 }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 10, background: '#0070ba', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {isRegistering ? "S'inscrire" : "Se connecter"}
            </button>
          </form>
          <p style={{ color: 'red' }}>{msg}</p>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', color: 'blue', fontSize: '0.8em' }}>
            {isRegistering ? "Déjà un compte ? Connexion" : "Pas de compte ? S'inscrire"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 50, fontFamily: 'Arial' }}>
      <h1>Bienvenue, {user.email}</h1>
      <p>Statut : <strong>{user.isPremium ? "💎 PREMIUM" : "Gratuit"}</strong></p>
      {!user.isPremium && (
        <div style={{ width: 300, margin: '20px auto' }}>
          <p>Passer au Premium pour 20$</p>
          <div id="paypal-button-container"></div>
        </div>
      )}
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 20 }}>Déconnexion</button>
    </div>
  );
}

export default App;