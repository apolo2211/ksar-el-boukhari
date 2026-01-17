import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');

  // 1. Charger le script PayPal et le profil
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    document.body.appendChild(script);
    loadProfile();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
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
      setMsg(data.message || "Erreur d'authentification"); 
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    }
  };

  // 2. Afficher le bouton PayPal
  useEffect(() => {
    if (user && !user.isPremium) {
      const timer = setInterval(() => {
        if (window.paypal) {
          clearInterval(timer);
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({ purchase_units: [{ amount: { value: '20.00' } }] });
            },
            onApprove: async (data, actions) => {
              await actions.order.capture();
              const token = localStorage.getItem('token');
              await fetch(`${API}/api/auth/make-premium`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              alert("Félicitations ! Vous êtes Premium 💎");
              window.location.reload();
            }
          }).render('#paypal-button-container');
        }
      }, 1000);
    }
  }, [user]);

  // --- AFFICHAGE SI NON CONNECTÉ ---
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f4f7f6' }}>
        <div style={{ padding: 40, background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 12, textAlign: 'center', width: 320 }}>
          <h2 style={{ color: '#333' }}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input placeholder="Email" style={{ display: 'block', width: '92%', marginBottom: 15, padding: 12, borderRadius: 8, border: '1px solid #ddd' }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" style={{ display: 'block', width: '92%', marginBottom: 15, padding: 12, borderRadius: 8, border: '1px solid #ddd' }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 12, background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? 'Créer un compte' : 'Connexion'}
            </button>
          </form>
          <p style={{ color: '#007bff', cursor: 'pointer', marginTop: 15, fontSize: '0.9em' }} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
          </p>
          {msg && <p style={{ color: 'red', fontSize: '0.8em' }}>{msg}</p>}
        </div>
      </div>
    );
  }

  // --- AFFICHAGE SI CONNECTÉ ---
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: 30, borderRadius: 15, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Bonjour, {user.email}</h1>
        <p style={{ fontSize: '1.2em' }}>Statut : <strong>{user.isPremium ? '💎 Premium' : '🆓 Gratuit'}</strong></p>
        
        {!user.isPremium && (
          <div style={{ marginTop: 30 }}>
            <h3>Devenir Premium (20€)</h3>
            <div id="paypal-button-container" style={{ maxWidth: '300px', margin: '0 auto' }}></div>
          </div>
        )}

        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 40, background: '#eee', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default App;