import { useEffect, useState } from 'react';

const API = ""; 
const PAYPAL_CLIENT_ID = "AcpSdVE7R3G62JC-70OczqR0BGeuZHngYsP9sfv20t1o41Ht-MWWaykIHb9drrMW1FUnxjS2MCoP5JEl";

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. CHARGEMENT DU PROFIL (Correction du blocage "Chargement")
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(API + '/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (e) { 
          console.error("Erreur serveur"); 
        }
      }
      setLoading(false); // Arrête le chargement quoi qu'il arrive
    };
    loadProfile();
  }, []);

  // 2. LOGIQUE PAYPAL (Optimisée)
  useEffect(() => {
    if (user && !user.isPremium) {
      const script = document.createElement("script");
      script.src = "https://www.paypal.com/sdk/js?client-id=" + PAYPAL_CLIENT_ID + "&currency=USD";
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          const container = document.getElementById('paypal-button-container');
          if (window.paypal && container) {
            container.innerHTML = ""; 
            window.paypal.Buttons({
              createOrder: (data, actions) => actions.order.create({
                purchase_units: [{ amount: { value: '20.00' } }]
              }),
              onApprove: async (data, actions) => {
                await actions.order.capture();
                await fetch(API + '/api/auth/make-premium', {
                  method: 'POST',
                  headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
                });
                window.location.reload();
              }
            }).render('#paypal-button-container');
          }
        }, 500);
      };
      document.body.appendChild(script);
      return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }
  }, [user]);

  // 3. CONNEXION / INSCRIPTION
  const handleAuth = async (e) => {
    e.preventDefault();
    setMsg("Chargement...");
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        setMsg(data.message || "Erreur d'accès");
      }
    } catch (err) { setMsg("Erreur réseau"); }
  };

  if (loading) return <div style={{textAlign:'center', padding:50}}>Chargement du Ksar...</div>;

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Ksar El Boukhari</h1>
        <div style={{ display: 'inline-block', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" style={{display:'block', marginBottom:10, padding:8, width:250}} onChange={e=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Mot de passe" style={{display:'block', marginBottom:10, padding:8, width:250}} onChange={e=>setPassword(e.target.value)} required />
            <button type="submit" style={{width:'100%', background:'#0070ba', color:'#fff', border:'none', padding:10, cursor:'pointer'}}>
              {isRegistering ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>
          <p style={{color:'red'}}>{msg}</p>
          <button onClick={() => setIsRegistering(!isRegistering)} style={{background:'none', border:'none', color:'blue', cursor:'pointer', marginTop:10}}>
            {isRegistering ? "Déjà inscrit ? Connexion" : "Pas de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>Bienvenue, {user.email}</h1>
      <p>Statut actuel : <b>{user.isPremium ? "🌟 MEMBRE PREMIUM" : "UTILISATEUR GRATUIT"}</b></p>
      
      {!user.isPremium && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{color: '#0070ba'}}>Accéder au contenu Premium (20$)</h3>
          <p>Cliquez sur le bouton ci-dessous pour payer avec PayPal :</p>
          <div id="paypal-button-container" style={{ maxWidth: '300px', margin: '0 auto' }}></div>
        </div>
      )}

      <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{marginTop:50}}>Déconnexion</button>
    </div>
  );
}

export default App;