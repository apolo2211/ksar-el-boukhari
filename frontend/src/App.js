import { useEffect, useState } from 'react';

// API vide pour utiliser le même domaine sur Render
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
      try {
        const res = await fetch(`${API}/api/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) setUser(await res.json());
      } catch (e) { console.error("Session expirée"); }
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg("");
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
        setMsg(data.message || "Identifiants incorrects");
      }
    } catch (err) {
      setMsg("Impossible de contacter le serveur.");
    }
  };

  useEffect(() => {
    if (user && !user.isPremium) {
      const timer = setInterval(() => {
        if (window.paypal) {
          clearInterval(timer);
          const container = document.getElementById('paypal-button-container');
          if (container && container.innerHTML === "") {
            window.paypal.Buttons({
              createOrder: (data, actions) => actions.order.create({
                purchase_units: [{ amount: { value: '20.00' } }]
              }),
              onApprove: async (data, actions) => {
                await actions.order.capture();
                await fetch(`${API}/api/auth/make-premium`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert("Compte Premium activé !");
                window.location.reload();
              }
            }).render('#paypal-button-container');
          }
        }
      }, 1000);
    }
  }, [user]);

  if (loading) return <div style={{textAlign:'center', padding:50}}>Chargement...</div>;

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f7f6', fontFamily: 'Arial' }}>
        <div style={{ padding: 40, background: '#fff', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: 350, textAlign: 'center' }}>
          <h2 style={{ color: '#0070ba' }}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" required style={{ width: '100%', padding: 10, margin: '10px 0', borderRadius: 5, border: '1px solid #ddd' }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" required style={{ width: '100%', padding: 10, margin: '10px 0', borderRadius: 5, border: '1px solid #ddd' }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 12, background: '#0070ba', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
              {isRegistering ? "Créer un compte" : "Se connecter"}
            </button>
          </form>
          {msg && <p style={{ color: 'red', fontSize: '0.9em' }}>{msg}</p>}
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#0070ba', cursor: 'pointer', marginTop: 20, fontSize: '0.85em' }}>
            {isRegistering ? "Déjà un compte ? Connectez-vous" : "Pas encore inscrit ? Créez un compte"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 80, fontFamily: 'Arial' }}>
      <h1>Bienvenue, {user.email}</h1>
      <div style={{ margin: '20px auto', padding: 20, background: '#fff', borderRadius: 10, border: '1px solid #eee', width: 320 }}>
        <p>Statut : <strong>{user.isPremium ? "💎 MEMBRE PREMIUM" : "Utilisateur Gratuit"}</strong></p>
      </div>
      {!user.isPremium && (
        <div>
          <p>Devenez Premium pour 20$ USD</p>
          <div id="paypal-button-container" style={{ width: 300, margin: '20px auto' }}></div>
        </div>
      )}
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 50, color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Déconnexion</button>
    </div>
  );
}

export default App;