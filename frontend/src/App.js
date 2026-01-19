import { useEffect, useState } from 'react';

const API = window.location.origin.includes('localhost') ? 'http://localhost:10000' : '';
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Chargement du profil
  useEffect(() => {
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
        } catch (e) { console.error("Erreur profil"); }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // 2. Gestion Connexion/Inscription
  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg("Chargement...");
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
        setMsg(data.message || "Erreur");
      }
    } catch (err) {
      setMsg("Le serveur ne répond pas.");
    }
  };

  // 3. Chargement PayPal SEULEMENT si l'utilisateur est connecté et non-premium
  useEffect(() => {
    if (user && !user.isPremium) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => {
        if (window.paypal) {
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
              window.location.reload();
            }
          }).render('#paypal-button-container');
        }
      };
      document.body.appendChild(script);
    }
  }, [user]);

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Vérification de la session...</div>;

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h2>Ksar El Boukhari</h2>
        <form onSubmit={handleAuth} style={{ display: 'inline-block', padding: '20px', border: '1px solid #ccc' }}>
          <input type="email" placeholder="Email" style={{display:'block', marginBottom:10}} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" style={{display:'block', marginBottom:10}} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" style={{width:'100%', background:'#0070ba', color:'#fff', border:'none', padding:10}}>
            {isRegistering ? "Créer mon compte" : "Me connecter"}
          </button>
        </form>
        <p style={{color:'red'}}>{msg}</p>
        <button onClick={() => setIsRegistering(!isRegistering)} style={{background:'none', border:'none', color:'blue', cursor:'pointer'}}>
          {isRegistering ? "Déjà inscrit ? Connexion" : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>Espace Membre</h1>
      <p>Bienvenue : <b>{user.email}</b></p>
      <p>Statut : <b>{user.isPremium ? "💎 PREMIUM" : "GRATUIT"}</b></p>
      
      {!user.isPremium && (
        <div style={{marginTop:30}}>
          <h3>Passer au Premium (20$)</h3>
          <div id="paypal-button-container" style={{maxWidth:'300px', margin:'0 auto'}}></div>
        </div>
      )}

      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{marginTop:50}}>Déconnexion</button>
    </div>
  );
}

export default App;