import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : window.location.origin;
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Charger le script PayPal et vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR&buyer-country=FR`;
    script.async = true;
    document.body.appendChild(script);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    }
    setLoading(false);
  };

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
      setMsg(data.message || "Erreur d'identifiants"); 
    }
  };

  // 2. Affichage des boutons PayPal
  useEffect(() => {
    if (user && !user.isPremium) {
      const interval = setInterval(() => {
        if (window.paypal) {
          clearInterval(interval);
          const container = document.getElementById('paypal-button-container');
          if (container && container.innerHTML === "") {
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
                alert("Paiement réussi ! 💎");
                window.location.reload();
              }
            }).render('#paypal-button-container');
          }
        }
      }, 1000);
    }
  }, [user]);

  if (loading) return <div style={{textAlign:'center', padding:50}}>Chargement du site...</div>;

  // --- SI PAS CONNECTÉ : ON AFFICHE LE FORMULAIRE ---
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f0f2f5' }}>
        <div style={{ padding: 40, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 10, textAlign: 'center', width: 300 }}>
          <h2 style={{color: '#1a73e8'}}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input placeholder="Email" style={{ width: '90%', padding: 12, marginBottom: 10, borderRadius: 5, border: '1px solid #ddd' }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" style={{ width: '90%', padding: 12, marginBottom: 10, borderRadius: 5, border: '1px solid #ddd' }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 12, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
              {isRegistering ? "S'inscrire" : "Se connecter"}
            </button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#1a73e8', cursor: 'pointer', marginTop: 15, fontSize: '0.9em' }}>
            {isRegistering ? "Déjà un compte ? Connexion" : "Pas de compte ? S'inscrire"}
          </p>
          {msg && <p style={{ color: 'red' }}>{msg}</p>}
        </div>
      </div>
    );
  }

  // --- SI CONNECTÉ : ON AFFICHE LE PROFIL ---
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: 30, borderRadius: 15, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Bonjour 👋</h1>
        <p style={{fontSize: '1.1em'}}>Compte : <strong>{user.email}</strong></p>
        <p>Statut : <span style={{color: user.isPremium ? 'green' : 'orange', fontWeight: 'bold'}}>{user.isPremium ? '💎 Membre Premium' : '🆓 Gratuit'}</span></p>
        
        {!user.isPremium && (
          <div style={{ marginTop: 30 }}>
            <h3>Devenir Premium (20€)</h3>
            <div id="paypal-button-container" style={{ marginTop: 20 }}></div>
          </div>
        )}

        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 40, border: 'none', background: '#eee', padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>
          Se déconnecter
        </button>

        {/* BOUTON DE SECOURS POUR FORCER LE PREMIUM */}
        <div style={{ marginTop: 20 }}>
          <button 
            onClick={async () => {
              const token = localStorage.getItem('token');
              await fetch(`${API}/api/auth/make-premium`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              alert("Succès ! Activation du diamant...");
              window.location.reload();
            }} 
            style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '10px' }}
          >
            (Simuler succès paiement)
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;