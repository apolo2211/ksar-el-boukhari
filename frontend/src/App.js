import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');

  // Chargement du script PayPal
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.async = true;
    document.body.appendChild(script);
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
      setMsg(data.message); 
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

  useEffect(() => { loadProfile(); }, []);

  // Fonction pour afficher le bouton PayPal une fois connecté
  const renderPayPalButton = () => {
    if (window.paypal) {
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: '20.00' } }]
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          alert("Paiement réussi par " + order.payer.name.given_name);
          // Optionnel : Ajouter ici un appel fetch vers ton backend pour passer isPremium à 1
        }
      }).render('#paypal-button-container');
    }
  };

  useEffect(() => {
    if (user && !user.isPremium) {
      setTimeout(renderPayPalButton, 500); // Petit délai pour laisser le temps au script de charger
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f4f7f6' }}>
        <div style={{ padding: 40, background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 12, textAlign: 'center', width: 320 }}>
          <h2 style={{ color: '#333' }}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input placeholder="Email" style={{ display: 'block', width: '93%', marginBottom: 15, padding: 12, borderRadius: 8, border: '1px solid #ddd' }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" style={{ display: 'block', width: '93%', marginBottom: 15, padding: 12, borderRadius: 8, border: '1px solid #ddd' }} onChange={e => setPassword(e.target.value)} />
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

  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: 30, borderRadius: 15, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1>Bonjour, {user.email.split('@')[0]}</h1>
        <p style={{ fontSize: '1.2em' }}>Statut actuel : <span style={{ color: user.isPremium ? 'green' : 'orange', fontWeight: 'bold' }}>{user.isPremium ? '💎 Membre Premium' : '🆓 Utilisateur Gratuit'}</span></p>
        
        {!user.isPremium && (
          <div style={{ marginTop: 30 }}>
            <h3>Devenir Premium pour 20€</h3>
            <div id="paypal-button-container" style={{ marginTop: 20 }}></div>
          </div>
        )}

        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 40, background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default App;