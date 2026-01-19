import { useEffect, useState } from 'react';

// Configuration automatique de l'URL API
const API = window.location.origin.includes('localhost') 
  ? 'http://localhost:10000' 
  : window.location.origin;

const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Chargement du SDK PayPal et vérification session
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&buyer-country=US`;
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
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        console.error("Erreur de connexion API");
      }
    }
    setLoading(false);
  };

  // Connexion / Inscription
  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg("");
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      // CORRECTION : Utilisation propre de la template string sans tags HTML
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
        setMsg(data.message || "Erreur : Identifiants incorrects");
      }
    } catch (err) {
      setMsg("Erreur de connexion au serveur. Vérifiez que le Backend est bien 'Live'.");
    }
  };

  // Intégration PayPal si non premium
  useEffect(() => {
    if (user && !user.isPremium) {
      const interval = setInterval(() => {
        if (window.paypal) {
          clearInterval(interval);
          const container = document.getElementById('paypal-button-container');
          if (container && container.innerHTML === "") {
            window.paypal.Buttons({
              createOrder: (data, actions) => actions.order.create({ 
                purchase_units: [{ amount: { value: '20.00' } }] 
              }),
              onApprove: async (data, actions) => {
                await actions.order.capture();
                const token = localStorage.getItem('token');
                await fetch(`${API}/api/auth/make-premium`, { 
                  method: 'POST', 
                  headers: { Authorization: `Bearer ${token}` } 
                });
                alert("Félicitations ! Votre compte est passé en Premium 🎉");
                window.location.reload();
              }
            }).render('#paypal-button-container');
          }
        }
      }, 1000);
    }
  }, [user]);

  if (loading) return <div style={{textAlign:'center', marginTop:50}}>Initialisation sécurisée...</div>;

  // --- ÉCRAN DE CONNEXION ---
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <div style={{ padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 320, textAlign: 'center' }}>
          <h2 style={{ color: '#0070ba', marginBottom: 20 }}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" required style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" required style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} onChange={e => setPassword(e.target.value)} />
            <button type="submit" style={{ width: '100%', padding: 12, background: '#0070ba', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>
          {msg && <p style={{ color: 'red', marginTop: 10, fontSize: '0.85em' }}>{msg}</p>}
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#0070ba', cursor: 'pointer', marginTop: 20, fontSize: '0.9em' }}>
            {isRegistering ? "Déjà inscrit ? Connectez-vous" : "Pas encore inscrit ? Créez un compte"}
          </p>
        </div>
      </div>
    );
  }

  // --- ÉCRAN UTILISATEUR ---
  return (
    <div style={{ textAlign: 'center', marginTop: 80, fontFamily: 'Arial' }}>
      <h1>Bienvenue, {user.email}</h1>
      <div style={{ margin: '20px auto', padding: 20, background: '#f8f9fa', borderRadius: 10, width: 300 }}>
        <p style={{ margin: 0 }}>Statut : <strong>{user.isPremium ? "⭐ Premium" : "Compte standard"}</strong></p>
      </div>
      
      {!user.isPremium && (
        <div>
          <p>Devenez Premium pour seulement 20 USD :</p>
          <div id="paypal-button-container" style={{ width: 300, margin: '20px auto' }}></div>
        </div>
      )}

      {user.isPremium && (
        <p style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Accès Premium Activé</p>
      )}

      <button 
        onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} 
        style={{ marginTop: 40, padding: '10px 20px', borderRadius: 6, background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Se déconnecter
      </button>
    </div>
  );
}

export default App;