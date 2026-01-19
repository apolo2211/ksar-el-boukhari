import { useEffect, useState } from 'react';

// Configuration automatique : le front appelle le domaine sur lequel il est hébergé
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

  // 1. Chargement de PayPal et vérification de la session au démarrage
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

  // 2. Gestion de la Connexion et de l'Inscription
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
        setMsg(data.message || "Erreur : Identifiants incorrects"); 
      }
    } catch (err) {
      setMsg("Erreur de connexion au serveur. Vérifiez que le Backend est bien 'Live'.");
    }
  };

  // 3. Affichage du bouton PayPal pour les membres non-premium
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
                alert("Félicitations ! Votre compte est passé en Premium 💎");
                window.location.reload();
              }
            }).render('#paypal-button-container');
          }
        }
      }, 1000);
    }
  }, [user]);

  if (loading) return <div style={{textAlign:'center', marginTop:50}}>Initialisation sécurisée...</div>;

  // --- ÉCRAN CONNEXION ---
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
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#0070ba', cursor: 'pointer', marginTop: 20, fontSize: '0.9em' }}>
            {isRegistering ? "Déjà inscrit ? Connectez-vous" : "Pas encore membre ? S'inscrire"}
          </p>
          {msg && <p style={{ color: '#d93025', fontSize: '0.85em', marginTop: 10 }}>{msg}</p>}
        </div>
      </div>
    );
  }

  // --- ÉCRAN TABLEAU DE BORD ---
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif', background: '#f7f9fc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 450, margin: '0 auto', background: '#fff', padding: 40, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', marginBottom: 10 }}>Mon Espace</h1>
        <p style={{ color: '#667' }}>Bienvenue : <strong>{user.email}</strong></p>
        
        <div style={{ margin: '30px 0', padding: '25px', background: '#f8f9fa', borderRadius: 15, border: '1px solid #eee' }}>
          <span style={{ color: '#666', fontSize: '0.9em' }}>Statut du compte :</span> <br/>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: user.isPremium ? '#28a745' : '#e67e22' }}>
            {user.isPremium ? '💎 MEMBRE PREMIUM' : '🆓 ACCÈS GRATUIT'}
          </span>
        </div>

        {!user.isPremium ? (
          <div>
            <p style={{ marginBottom: 20, color: '#444' }}>Devenez Premium pour débloquer tous les services : <strong>20$</strong></p>
            <div id="paypal-button-container"></div>
          </div>
        ) : (
          <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: 10, color: '#28a745' }}>
            ✅ Vous profitez actuellement de tous les avantages Premium.
          </div>
        )}

        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 40, background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default App;