import { useEffect, useState } from 'react';

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

  // Charger PayPal SDK et profil utilisateur
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.async = true;
    document.body.appendChild(script);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        console.error("Erreur de session :", e);
      }
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(`<span class="math-inline" data-latex="%7BAPI%7D">{API}</span>{endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        setMsg(data.message || "Erreur d'accès");
      }
    } catch (error) {
      setMsg("Erreur de connexion au serveur");
    }
  };

  // Gestion du paiement PayPal
  useEffect(() => {
    if (user && !user.isPremium) {
      const interval = setInterval(() => {
        if (window.paypal) {
          clearInterval(interval);
          const container = document.getElementById('paypal-button-container');
          if (container && container.innerHTML === "") {
            window.paypal.Buttons({
              createOrder: (data, actions) =>
                actions.order.create({
                  purchase_units: [{ amount: { value: '20.00' } }],
                }),
              onApprove: async (data, actions) => {
                await actions.order.capture();
                const token = localStorage.getItem('token');
                await fetch(`${API}/api/auth/make-premium`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });
                alert("🎉 Félicitations ! Vous êtes maintenant Premium !");
                window.location.reload();
              },
            }).render('#paypal-button-container');
          }
        }
      }, 1000);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        Chargement du site...
      </div>
    );

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f9fc',
        }}
      >
        <div
          style={{
            padding: 40,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: 320,
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#0070ba' }}>Ksar El Boukhari</h2>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              required
              style={{
                width: '90%',
                padding: 12,
                marginBottom: 10,
                borderRadius: 6,
                border: '1px solid #ddd',
              }}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              required
              style={{
                width: '90%',
                padding: 12,
                marginBottom: 15,
                borderRadius: 6,
                border: '1px solid #ddd',
              }}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                background: '#0070ba',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isRegistering ? "Créer un compte" : "Se connecter"}
            </button>
          </form>
          <p
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              color: '#0070ba',
              cursor: 'pointer',
              marginTop: 20,
              fontSize: '0.9em',
            }}
          >
            {isRegistering
              ? "Déjà membre ? Connexion"
              : "Nouveau ? S'inscrire gratuitement"}
          </p>
          {msg && (
            <p style={{ color: '#d93025', fontSize: '0.85em' }}>{msg}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 450,
          margin: '0 auto',
          background: '#fff',
          padding: 40,
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: 10 }}>Bienvenue 👋</h1>
        <p style={{ color: '#667' }}>
          Connecté en tant que : <strong>{user.email}</strong>
        </p>

        <div
          style={{
            margin: '30px 0',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: 15,
          }}
        >
          Statut actuel : <br />
          <span
            style={{
              color: user.isPremium ? '#28a745' : '#d93025',
              fontWeight: 'bold',
              fontSize: '1.1em',
            }}
          >
            {user.isPremium ? '✅ Premium' : '⛔ Standard'}
          </span>
        </div>

        {!user.isPremium && (
          <div>
            <h3>Passer en Premium (20 €)</h3>
            <div id="paypal-button-container" style={{ marginTop: 20 }}></div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            marginTop: 30,
            background: '#d93025',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default App;
